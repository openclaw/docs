---
read_when:
    - Antworten auf häufige Supportfragen zu Einrichtung, Installation, Onboarding oder Laufzeit
    - Von Benutzern gemeldete Probleme vor einer eingehenderen Fehlerbehebung einordnen
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-07-12T15:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten plus detaillierte Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, mehrere Agenten, OAuth/API-Schlüssel, Modell-Failover). Informationen zur Laufzeitdiagnose finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas nicht funktioniert

<Steps>
  <Step title="Schnellstatus">
    ```bash
    openclaw status
    ```
    Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Dienst, Agenten/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).
  </Step>
  <Step title="Einfügbarer Bericht (kann sicher geteilt werden)">
    ```bash
    openclaw status --all
    ```
    Schreibgeschützte Diagnose mit dem Ende des Protokolls (Tokens unkenntlich gemacht).
  </Step>
  <Step title="Daemon- und Portstatus">
    ```bash
    openclaw gateway status
    ```
    Zeigt die Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Dienst wahrscheinlich verwendet hat.
  </Step>
  <Step title="Detaillierte Prüfungen">
    ```bash
    openclaw status --deep
    ```
    Live-Zustandsprüfung des Gateways, einschließlich Kanalprüfungen, sofern unterstützt (erfordert ein erreichbares Gateway). Siehe [Zustand](/de/gateway/health).
  </Step>
  <Step title="Neuestes Protokoll live verfolgen">
    ```bash
    openclaw logs --follow
    ```
    Wenn RPC nicht verfügbar ist, verwenden Sie als Alternative:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Dateiprotokolle sind von Dienstprotokollen getrennt; siehe [Protokollierung](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).
  </Step>
  <Step title="Doctor ausführen (Reparaturen)">
    ```bash
    openclaw doctor
    ```
    Repariert/migriert Konfiguration und Zustand und führt anschließend Zustandsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).
  </Step>
  <Step title="Gateway-Momentaufnahme (nur WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
    ```
    Fordert vom laufenden Gateway eine vollständige Momentaufnahme an. Siehe [Zustand](/de/gateway/health).
  </Step>
</Steps>

## Schnellstart und Ersteinrichtung

Fragen und Antworten zum ersten Start – Installation, Onboarding, Authentifizierungswege, Abonnements, anfängliche Fehler – finden Sie in den [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw, in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet über die Messaging-Oberflächen, die Sie bereits verwenden (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp und gebündelte Kanal-Plugins wie QQ Bot), und unterstützt auf kompatiblen Plattformen außerdem Sprache sowie ein Live-Canvas. Das **Gateway** ist die dauerhaft aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Nutzenversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **Local-First-Steuerungsebene**, die einen leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführt, über die von Ihnen bereits verwendeten Chat-Apps erreichbar ist und zustandsbehaftete Sitzungen, Speicher und Werkzeuge bietet – ohne Ihre Arbeitsabläufe einem gehosteten SaaS zu überlassen.

    - **Ihre Geräte, Ihre Daten**: Führen Sie das Gateway an einem beliebigen Ort aus (Mac, Linux, VPS) und speichern Sie den Arbeitsbereich und den Sitzungsverlauf lokal.
    - **Echte Kanäle statt Web-Sandbox**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp usw. sowie mobile Sprachfunktionen und Canvas auf unterstützten Plattformen.
    - **Modellunabhängig**: Verwenden Sie Anthropic, MiniMax, OpenAI, OpenRouter usw. mit Routing und Failover pro Agent.
    - **Option für ausschließlich lokalen Betrieb**: Führen Sie lokale Modelle aus, sodass alle Daten auf Ihrem Gerät verbleiben können.
    - **Routing mit mehreren Agenten**: Verwenden Sie separate Agenten pro Kanal, Konto oder Aufgabe, jeweils mit eigenem Arbeitsbereich und eigenen Standardwerten.
    - **Open Source und anpassbar**: Prüfen, erweitern und selbst hosten – ohne Anbieterbindung.

    Dokumentation: [Gateway](/de/gateway), [Kanäle](/de/channels), [Mehrere Agenten](/de/concepts/multi-agent), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte: Erstellen Sie eine Website (WordPress, Shopify oder eine statische Website); entwickeln Sie einen Prototyp einer mobilen App (Konzept, Ansichten, API-Plan); organisieren Sie Dateien und Ordner; verbinden Sie Gmail und automatisieren Sie Zusammenfassungen oder Nachfassaktionen.

    OpenClaw kann große Aufgaben bearbeiten, funktioniert jedoch am besten, wenn diese in Phasen unterteilt und für parallele Arbeiten auf Unteragenten verteilt werden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    - **Persönliche Übersichten**: Zusammenfassungen Ihres Posteingangs, Kalenders und der Nachrichten, die Sie interessieren.
    - **Recherche und Entwürfe**: schnelle Recherchen, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Nachfassaktionen**: Cron- oder Heartbeat-gesteuerte Hinweise und Checklisten.
    - **Browserautomatisierung**: Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination**: Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Leadgenerierung, Kontaktaufnahme, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, bei **Recherche, Qualifizierung und Entwürfen**: Websites durchsuchen, Auswahllisten erstellen, potenzielle Kunden zusammenfassen und Entwürfe für Kontaktaufnahmen oder Anzeigentexte verfassen.

    Bei **Kontaktaufnahme oder Anzeigenkampagnen** sollte stets ein Mensch eingebunden bleiben. Vermeiden Sie Spam, beachten Sie lokale Gesetze und Plattformrichtlinien und prüfen Sie alles vor dem Versand. Lassen Sie OpenClaw Entwürfe erstellen; Sie erteilen die Freigabe.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile bietet OpenClaw gegenüber Claude Code bei der Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinierungsebene, kein Ersatz für eine IDE. Verwenden Sie Claude Code oder Codex für den schnellsten direkten Programmierablauf innerhalb eines Repositorys. Verwenden Sie OpenClaw für dauerhaften Speicher, geräteübergreifenden Zugriff und die Orchestrierung von Werkzeugen.

    - Dauerhafter Speicher und Arbeitsbereich über Sitzungen hinweg.
    - Plattformübergreifender Zugriff (Telegram, WhatsApp, TUI, WebChat).
    - Werkzeugorchestrierung (Browser, Dateien, Zeitplanung, Hooks).
    - Dauerhaft aktives Gateway (auf einem VPS ausführen, von überall interagieren).
    - Nodes für lokalen Browser/Bildschirm/Kamera/Befehlsausführung.

    Beispiele: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repository zu verändern?">
    Verwenden Sie verwaltete Überschreibungen, statt die Repository-Kopie zu bearbeiten. Legen Sie Änderungen unter `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Rangfolge: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> gebündelt -> `skills.load.extraDirs`, sodass verwaltete Überschreibungen Vorrang vor gebündelten Skills haben, ohne Git zu verändern. Um Skills global zu installieren, ihre Sichtbarkeit aber auf bestimmte Agenten zu beschränken, bewahren Sie die gemeinsam verwendete Kopie unter `~/.openclaw/skills` auf und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` / `agents.list[].skills`. Nur Änderungen, die für das Upstream-Repository geeignet sind, sollten als PRs für die Repository-Kopie eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja: Fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` Verzeichnisse hinzu (niedrigste Rangfolge in der oben genannten Reihenfolge). `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Um die Sichtbarkeit auf bestimmte Agenten zu beschränken, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich für verschiedene Aufgaben unterschiedliche Modelle oder Einstellungen verwenden?">
    Unterstützte Muster:

    - **Cron-Aufträge**: Isolierte Aufträge können pro Auftrag eine `model`-Überschreibung festlegen.
    - **Agenten**: Leiten Sie Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen, Denkstufen und Streaming-Parametern weiter.
    - **Wechsel bei Bedarf**: `/model` wechselt jederzeit das Modell der aktuellen Sitzung.

    Beispiel – gleiches Modell, unterschiedliche Einstellungen pro Agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Legen Sie gemeinsame Standardwerte pro Modell in `agents.defaults.models["provider/model"].params` und anschließend agentenspezifische Überschreibungen direkt in `agents.list[].params` fest. Duplizieren Sie dasselbe Modell nicht unter dem verschachtelten Pfad `agents.list[].models["provider/model"].params`; dieser Pfad ist für den Modellkatalog und Laufzeitüberschreibungen pro Agent vorgesehen.

    Siehe [Cron-Aufträge](/de/automation/cron-jobs), [Routing mit mehreren Agenten](/de/concepts/multi-agent), [Konfiguration](/de/gateway/config-agents), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot reagiert bei rechenintensiven Arbeiten nicht mehr. Wie kann ich diese auslagern?">
    Verwenden Sie **Unteragenten** für langwierige oder parallele Aufgaben: Sie werden in einer eigenen Sitzung ausgeführt, geben eine Zusammenfassung zurück und sorgen dafür, dass Ihr Hauptchat reaktionsfähig bleibt. Bitten Sie den Bot, „einen Unteragenten für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`. Mit `/status` können Sie prüfen, ob das Gateway derzeit ausgelastet ist.

    Sowohl lange Aufgaben als auch Unteragenten verbrauchen Tokens; legen Sie über `agents.defaults.subagents.model` ein günstigeres Modell für Unteragenten fest, wenn die Kosten relevant sind.

    Dokumentation: [Unteragenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Unteragentensitzungen auf Discord?">
    Binden Sie einen Discord-Thread an einen Unteragenten oder ein Sitzungsziel, damit nachfolgende Nachrichten dort in der gebundenen Sitzung verbleiben.

    - Starten Sie mit `sessions_spawn` und `thread: true` (optional mit `mode: "session"` für dauerhafte Nachfragen).
    - Oder binden Sie manuell mit `/focus <target>`.
    - `/agents` zeigt den Bindungsstatus an.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` steuern die automatische Aufhebung des Fokus.
    - `/unfocus` löst den Thread.

    Konfiguration: `session.threadBindings.enabled` (globaler Schalter), `session.threadBindings.idleHours` (Standardwert `24`, `0` deaktiviert), `session.threadBindings.maxAgeHours` (Standardwert `0` = keine feste Obergrenze) und kanalspezifische Überschreibungen unter `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` steuert die automatische Bindung beim Start (Standardwert `true`).

    Dokumentation: [Unteragenten](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Unteragent wurde abgeschlossen, aber die Abschlussmeldung wurde am falschen Ort oder gar nicht veröffentlicht. Was sollte ich prüfen?">
    Prüfen Sie die aufgelöste Route des Anforderers:

    - Bei der Zustellung von Unteragentenergebnissen im Abschlussmodus wird eine gebundene Thread- oder Konversationsroute bevorzugt, sofern eine vorhanden ist.
    - Wenn der Ursprung des Abschlusses nur einen Kanal enthält, greift OpenClaw auf die gespeicherte Route der Anforderersitzung (`lastChannel` / `lastTo` / `lastAccountId`) zurück, damit eine direkte Zustellung weiterhin möglich ist.
    - Keine gebundene Route und keine verwendbare gespeicherte Route: Die direkte Zustellung kann fehlschlagen, und das Ergebnis wird statt einer sofortigen Veröffentlichung über die Warteschlange an die Sitzung zugestellt.
    - Ungültige oder veraltete Ziele können ebenfalls dazu führen, dass auf die Warteschlange zurückgegriffen wird oder die endgültige Zustellung fehlschlägt.
    - Wenn die letzte sichtbare Assistentenantwort des untergeordneten Agenten exakt `NO_REPLY` / `no_reply` oder `ANNOUNCE_SKIP` lautet, unterdrückt OpenClaw die Ankündigung absichtlich, statt einen veralteten früheren Fortschritt zu veröffentlichen.

    Fehlerbehebung: `openclaw tasks show <lookup>`, wobei `<lookup>` eine Aufgaben-ID, Ausführungs-ID oder ein Sitzungsschlüssel ist.

    Dokumentation: [Unteragenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungswerkzeuge](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron wird innerhalb des Gateway-Prozesses ausgeführt; es wird nicht ausgelöst, wenn das Gateway nicht kontinuierlich läuft.

    - Vergewissern Sie sich, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht festgelegt ist.
    - Vergewissern Sie sich, dass das Gateway rund um die Uhr läuft (kein Ruhezustand/keine Neustarts).
    - Überprüfen Sie die Zeitzone des Auftrags (`--tz` gegenüber der Zeitzone des Hosts).

    Fehlerbehebung:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Aufträge](/de/automation/cron-jobs), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber es wurde nichts an den Kanal gesendet. Warum?">
    Prüfen Sie den Zustellungsmodus:

    - `--no-deliver` / `delivery.mode: "none"`: Es wird keine Ersatzsendung durch den Runner erwartet.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`): Der Runner hat die ausgehende Zustellung übersprungen.
    - Fehler bei der Kanalauthentifizierung (`unauthorized`, `Forbidden`): Der Runner hat die Zustellung versucht, aber die Anmeldedaten haben sie verhindert.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, sodass auch die in die Warteschlange eingereihte Ersatzzustellung unterdrückt wird.

    Bei isolierten Cron-Aufträgen kann der Agent weiterhin direkt mit dem `message`-Tool senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur die Ersatzzustellung durch den Runner für endgültigen Text, den der Agent nicht bereits selbst gesendet hat.

    Fehlerdiagnose:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Dokumentation: [Cron-Aufträge](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einen erneuten Versuch durchgeführt?">
    Das ist der Pfad für den Modellwechsel im laufenden Betrieb und keine doppelte Zeitplanung. Isoliertes Cron speichert eine Laufzeitübergabe des Modells dauerhaft und versucht es erneut, wenn der aktive Lauf `LiveSessionModelSwitchError` auslöst. Dabei werden der gewechselte Provider und das gewechselte Modell (sowie eine gegebenenfalls gewechselte Überschreibung des Authentifizierungsprofils) vor dem erneuten Versuch beibehalten.

    Priorität der Modellauswahl: zuerst die Modellüberschreibung des Gmail-Hooks (`hooks.gmail.model`), dann das auftragsspezifische `model`, danach eine gespeicherte Modellüberschreibung der Cron-Sitzung und schließlich die normale Agenten-/Standardmodellauswahl.

    Die Schleife für erneute Versuche ist auf den ersten Versuch plus 2 erneute Versuche nach einem Wechsel begrenzt; anschließend bricht Cron ab, statt endlos weiterzulaufen.

    Fehlerdiagnose:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Aufträge](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie die nativen `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Arbeitsbereich ab; die macOS-Benutzeroberfläche für Skills ist unter Linux nicht verfügbar. Durchsuchen Sie Skills unter [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Das native `openclaw skills install` schreibt standardmäßig in das Verzeichnis `skills/` des aktiven Arbeitsbereichs. Fügen Sie `--global` hinzu, um im gemeinsam verwalteten Skills-Verzeichnis für alle lokalen Agenten zu installieren. Installieren Sie die separate `clawhub`-CLI nur, um Ihre eigenen Skills zu veröffentlichen oder zu synchronisieren. Verwenden Sie `agents.defaults.skills` oder `agents.list[].skills`, um einzuschränken, welche Agenten gemeinsame Skills sehen.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach einem Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja, über den Gateway-Zeitplaner:

    - **Cron-Aufträge** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für regelmäßige Prüfungen der Hauptsitzung.
    - **Isolierte Aufträge** für autonome Agenten, die Zusammenfassungen veröffentlichen oder an Chats zustellen.

    Dokumentation: [Cron-Aufträge](/de/automation/cron-jobs), [Automatisierung](/de/automation), [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich ausschließlich für Apple macOS bestimmte Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` sowie erforderliche Binärdateien eingeschränkt und nur geladen, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden ausschließlich für `darwin` bestimmte Skills (`apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie diese Einschränkung nicht überschreiben.

    Drei unterstützte Muster:

    **Option A – Gateway auf einem Mac ausführen (am einfachsten)**. Führen Sie Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und stellen Sie anschließend unter Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale eine Verbindung her. Die Skills werden normal geladen, da der Gateway-Host macOS verwendet.

    **Option B – einen macOS-Node verwenden (ohne SSH)**. Führen Sie Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie auf dem Mac **Node Run Commands** auf "Always Ask" oder "Always Allow". OpenClaw betrachtet ausschließlich für macOS bestimmte Skills als zulässig, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind; der Agent führt sie über das `nodes`-Tool aus. Wenn "Always Ask" aktiviert ist, wird der Befehl durch die Genehmigung von "Always Allow" in der Eingabeaufforderung zur Positivliste hinzugefügt.

    **Option C – macOS-Binärdateien über SSH weiterleiten (fortgeschritten)**. Lassen Sie Gateway unter Linux laufen, sorgen Sie jedoch dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac ausgeführt werden. Überschreiben Sie anschließend den Skill so, dass Linux zulässig ist und der Skill weiterhin verwendet werden kann.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Stellen Sie den Wrapper auf dem Linux-Host über `PATH` bereit (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (im Arbeitsbereich oder unter `~/.openclaw/skills`), um Linux zuzulassen:
       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI unter macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Starten Sie eine neue Sitzung, damit die Skills-Momentaufnahme aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Integration für Notion oder HeyGen?">
    Derzeit nicht integriert. Optionen:

    - **Benutzerdefinierter Skill / benutzerdefiniertes Plugin**: am besten für zuverlässigen API-Zugriff (beide bieten APIs).
    - **Browserautomatisierung**: funktioniert ohne Code, ist jedoch langsamer und fehleranfälliger.

    Für einen agenturähnlichen Kontext pro Kunde: Verwenden Sie pro Kunde eine Notion-Seite (Kontext + Präferenzen + aktive Arbeiten) und weisen Sie den Agenten an, diese Seite zu Beginn einer Sitzung abzurufen.

    Für eine native Integration können Sie eine Funktionsanfrage stellen oder einen Skill für diese APIs erstellen.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native Installationen werden im Verzeichnis `skills/` des aktiven Arbeitsbereichs abgelegt; verwenden Sie `--global` für alle lokalen Agenten oder konfigurieren Sie `agents.defaults.skills` / `agents.list[].skills`, um die Sichtbarkeit einzuschränken. Einige Skills erwarten über Homebrew installierte Binärdateien; unter Linux bedeutet dies Linuxbrew.

    Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bereits angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte Browserprofil `user`, das über Chrome DevTools MCP eine Verbindung herstellt:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Erstellen Sie für einen benutzerdefinierten Namen ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dabei kann der Browser auf dem lokalen Host oder ein verbundener Browser-Node verwendet werden. Wenn Gateway an einem anderen Ort ausgeführt wird, führen Sie auf dem Browser-Rechner einen Node-Host aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session`- / `user`-Profilen gegenüber dem verwalteten Profil `openclaw`:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Momentaufnahme-Referenzen statt CSS-Selektoren.
    - Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, und unterstützen kein CSS-`element`.
    - `responsebody`, PDF-Export, Abfangen von Downloads und Stapelaktionen erfordern weiterhin den verwalteten Browserpfad.

    Die vollständige Gegenüberstellung finden Sie unter [Browser](/de/tools/browser#existing-session-via-chrome-devtools-mcp).

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Dokumentation zum Sandboxing?">
    Ja: [Sandboxing](/de/gateway/sandboxing). Informationen zur Docker-spezifischen Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) finden Sie unter [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt – wie aktiviere ich den vollständigen Funktionsumfang?">
    Das Standard-Image priorisiert Sicherheit und wird als Benutzer `node` ausgeführt, weshalb es keine Systempakete, Homebrew und gebündelten Browser enthält. Für eine umfassendere Einrichtung:

    - Speichern Sie `/home/node` dauerhaft mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Integrieren Sie Systemabhängigkeiten mit `OPENCLAW_IMAGE_APT_PACKAGES` in das Image.
    - Installieren Sie Playwright-Browser über die gebündelte CLI: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Legen Sie `PLAYWRIGHT_BROWSERS_PATH` fest und speichern Sie diesen Pfad dauerhaft.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich Direktnachrichten persönlich halten, aber Gruppen mit einem Agenten öffentlich bzw. in einer Sandbox betreiben?">
    Ja, wenn privater Datenverkehr aus **Direktnachrichten** und öffentlicher Datenverkehr aus **Gruppen** besteht. Setzen Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend ausgeführt werden, während die Hauptsitzung für Direktnachrichten auf dem Host verbleibt. Docker ist das Standard-Backend, sobald Sandboxing aktiviert ist. Schränken Sie die in Sandbox-Sitzungen verfügbaren Tools über `tools.sandbox.tools` ein.

    Einrichtungsanleitung: [Gruppen: persönliche Direktnachrichten + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent). Wichtige Referenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:container:mode"]` (zum Beispiel `"/home/user/src:/src:ro"`). Globale und agentenspezifische Einbindungen werden zusammengeführt; agentenspezifische Einbindungen werden bei `scope: "shared"` ignoriert. Verwenden Sie für alle vertraulichen Inhalte `:ro`; Einbindungen umgehen die Dateisystembegrenzungen der Sandbox.

    OpenClaw validiert Einbindungsquellen sowohl anhand des normalisierten Pfads als auch anhand des kanonischen Pfads, der über den tiefsten vorhandenen übergeordneten Pfad aufgelöst wird. Dadurch werden Ausbrüche über übergeordnete symbolische Links sicher abgewiesen, selbst wenn das letzte Pfadsegment noch nicht vorhanden ist.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Wie funktioniert der Speicher?">
    Der OpenClaw-Speicher besteht aus Markdown-Dateien im Arbeitsbereich des Agenten: tägliche Notizen in `memory/YYYY-MM-DD.md`, kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen).

    OpenClaw führt außerdem vor der Compaction, die die Unterhaltung zusammenfasst, eine stille **Speicherübertragung vor der Compaction** aus und erinnert das Modell daran, zunächst dauerhafte Notizen zu schreiben. Sie wird nur ausgeführt, wenn der Arbeitsbereich beschreibbar ist (schreibgeschützte Sandboxes überspringen sie); deaktivieren Sie sie mit `agents.defaults.compaction.memoryFlush.enabled: false`. Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst ständig Dinge. Wie sorge ich dafür, dass sie erhalten bleiben?">
    Bitten Sie den Bot, **die Tatsache in den Speicher zu schreiben**: Langzeitnotizen gehören in `MEMORY.md`, kurzfristiger Kontext in `memory/YYYY-MM-DD.md`. Das Modell daran zu erinnern, Erinnerungen zu speichern, behebt das Problem normalerweise. Falls es weiterhin Dinge vergisst, prüfen Sie, ob Gateway bei jedem Lauf denselben Arbeitsbereich verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agentenarbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt der Speicher für immer erhalten? Welche Grenzen gibt es?">
    Speicherdateien befinden sich auf dem Datenträger und bleiben erhalten, bis sie gelöscht werden; die Grenze ist Ihr Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells begrenzt, sodass lange Unterhaltungen komprimiert oder abgeschnitten werden können – deshalb gibt es die Speichersuche, die nur die relevanten Teile wieder in den Kontext lädt.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Erfordert die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Einbettungen** verwenden, was der Standard-Provider ist. Codex OAuth deckt Chat/Vervollständigungen ab und gewährt **keinen** Zugriff auf Einbettungen. Daher aktiviert die Anmeldung mit Codex (OAuth oder die Anmeldung über die Codex-CLI) nicht die semantische Speichersuche. OpenAI-Einbettungen benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Um lokal zu bleiben, setzen Sie `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Weitere unterstützte Provider: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` oder `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI-kompatible Provider und Voyage. Einzelheiten zur Einrichtung finden Sie unter [Memory](/de/concepts/memory) und [Memory-Suche](/de/concepts/memory-search).

  </Accordion>
</AccordionGroup>

## Speicherorte auf dem Datenträger

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein: **Der eigene Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal**: Sitzungen, Memory-Dateien, Konfiguration und Arbeitsbereich befinden sich auf dem Gateway-Host (`~/.openclaw` sowie Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote**: An Modell-Provider (Anthropic/OpenAI/usw.) gesendete Nachrichten gehen an deren APIs, und Chatplattformen (Slack/Telegram/WhatsApp/usw.) speichern Nachrichtendaten auf ihren Servern.
    - **Sie kontrollieren den Umfang**: Lokale Modelle behalten Prompts auf Ihrem Rechner, der Kanalverkehr läuft jedoch weiterhin über die Server des Kanals.

    Verwandte Themen: [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles befindet sich unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                               | Zweck                                                              |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Hauptkonfiguration (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Legacy-OAuth-Import (bei der ersten Verwendung in Authentifizierungsprofile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Authentifizierungsprofile (OAuth, API-Schlüssel, optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Optionale dateibasierte geheime Nutzdaten für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Provider-Zustand (zum Beispiel `whatsapp/<accountId>/creds.json`)   |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Agent-spezifischer Zustand (agentDir + Legacy-/Archiv-Sitzungsartefakte) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Agent-spezifischer SQLite-Zustand einschließlich Sitzungszeilen und Transkripten |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Quellen für die Migration von Legacy-Sitzungen und Archiv-/Supportartefakte |

    Der alte Einzel-Agent-Pfad `~/.openclaw/agent/*` wird von `openclaw doctor` migriert.

    Ihr **Arbeitsbereich** (AGENTS.md, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien befinden sich im **Agent-Arbeitsbereich**, nicht unter `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`. Die kleingeschriebene Stammdatei `memory.md` dient nur als Eingabe für die Legacy-Reparatur; `openclaw doctor --fix` kann sie mit `MEMORY.md` zusammenführen, wenn beide vorhanden sind.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Authentifizierungsprofile, Sitzungen, Protokolle, gemeinsam genutzte Skills (`~/.openclaw/skills`).

    Der Standardarbeitsbereich ist `~/.openclaw/workspace` und kann konfiguriert werden:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart etwas „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben Arbeitsbereich verwendet (im Remote-Modus wird der Arbeitsbereich des **Gateway-Hosts** verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Bitten Sie den Bot bei dauerhaftem Verhalten oder dauerhaften Präferenzen, diese **in AGENTS.md oder MEMORY.md zu schreiben**, anstatt sich auf den Chatverlauf zu verlassen.

    Siehe [Agent-Arbeitsbereich](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Kann ich SOUL.md vergrößern?">
    Ja. `SOUL.md` ist eine der Bootstrap-Dateien des Arbeitsbereichs, die in den Agent-Kontext eingefügt werden. Das standardmäßige Einfügungslimit pro Datei beträgt `20000` Zeichen; das gesamte Bootstrap-Budget über alle Dateien hinweg beträgt `60000` Zeichen.

    Ändern Sie die gemeinsamen Standardwerte:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Oder überschreiben Sie die Werte für einen Agent unter `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Verwenden Sie `/context`, um die Rohgrößen und die eingefügten Größen zu prüfen und festzustellen, ob eine Kürzung stattgefunden hat. Konzentrieren Sie `SOUL.md` auf Ausdrucksweise, Haltung und Persönlichkeit; legen Sie Betriebsregeln in `AGENTS.md` und dauerhafte Fakten im Memory ab.

    Siehe [Kontext](/de/concepts/context) und [Agent-Konfiguration](/de/gateway/config-agents).

  </Accordion>

  <Accordion title="Empfohlene Sicherungsstrategie">
    Legen Sie Ihren **Agent-Arbeitsbereich** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem privaten Ort (zum Beispiel in einem privaten GitHub-Repository). Dadurch werden das Memory sowie die AGENTS-/SOUL-/USER-Dateien erfasst, und Sie können den „Verstand“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Token, verschlüsselte geheime Nutzdaten). Sichern Sie für eine vollständige Wiederherstellung den Arbeitsbereich und das Zustandsverzeichnis separat.

    Dokumentation: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **standardmäßige aktuelle Arbeitsverzeichnis** und der Memory-Anker, keine strikte Sandbox. Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst; absolute Pfade können auf andere Speicherorte des Hosts zugreifen, sofern Sandboxing nicht aktiviert ist. Verwenden Sie zur Isolierung [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder Agent-spezifische Sandbox-Einstellungen. Um ein Repository als Standardarbeitsverzeichnis festzulegen, setzen Sie `workspace` dieses Agenten auf das Stammverzeichnis des Repositorys – das OpenClaw-Repository selbst enthält lediglich den Quellcode. Halten Sie den Arbeitsbereich daher getrennt, sofern der Agent nicht bewusst darin arbeiten soll.

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Im Remote-Modus befindet sich der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`). Fehlt die Datei, verwendet es weitgehend sichere Standardwerte, darunter den Standardarbeitsbereich `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") festgelegt, und jetzt lauscht nichts mehr / die Benutzeroberfläche meldet fehlende Autorisierung'>
    Bindungen außerhalb der Loopback-Schnittstelle **erfordern einen gültigen Gateway-Authentifizierungspfad**: Authentifizierung mit einem gemeinsamen Geheimnis (Token oder Passwort) oder `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Reverse-Proxy.

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

    - `gateway.remote.token` / `.password` aktivieren die lokale Gateway-Authentifizierung **nicht** eigenständig; lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Legen Sie für die Passwortauthentifizierung `gateway.auth.mode: "password"` sowie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`) fest.
    - Wenn `gateway.auth.token` / `.password` explizit über SecretRef konfiguriert ist und nicht aufgelöst werden kann, schlägt die Auflösung geschlossen fehl (kein verschleiernder Remote-Fallback).
    - Control-UI-Konfigurationen mit gemeinsamem Geheimnis authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (in den App-/UI-Einstellungen gespeichert). Modi mit Identitätsinformationen wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Anfrage-Header – vermeiden Sie es, gemeinsame Geheimnisse in URLs einzufügen.
    - Bei `gateway.auth.mode: "trusted-proxy"` erfordern Loopback-Reverse-Proxys auf demselben Host ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true` und einen Loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum benötige ich jetzt auf localhost ein Token?">
    OpenClaw erzwingt standardmäßig die Gateway-Authentifizierung, einschließlich für Loopback. Wenn kein expliziter Authentifizierungspfad konfiguriert ist, wird beim Start der Token-Modus gewählt und ein nur für diesen Start gültiges Laufzeit-Token erzeugt. Daher müssen sich lokale WS-Clients authentifizieren. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients über Neustarts hinweg ein stabiles Geheimnis benötigen. Sie können auch den Passwortmodus oder `trusted-proxy` für identitätsbewusste Reverse-Proxys wählen. Für einen offenen Loopback-Zugriff legen Sie ausdrücklich `gateway.auth.mode: "none"` fest. `openclaw doctor --generate-gateway-token` erzeugt jederzeit ein Token.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload: `gateway.reload.mode: "hybrid"` (Standard) wendet sichere Änderungen im laufenden Betrieb an und führt bei kritischen Änderungen einen Neustart durch. `hot`, `restart` und `off` werden ebenfalls unterstützt. Die meisten Änderungen an `tools.*`, der `agents.*`-Richtlinie, `session.*` und `messages.*` werden sofort und ganz ohne Neuladeaktion angewendet; Änderungen an Bindung oder Port unter `gateway.*` erfordern einen Neustart.
  </Accordion>

  <Accordion title="Wie deaktiviere ich die humorvollen CLI-Slogans?">
    Legen Sie `cli.banner.taglineMode` fest:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: Blendet den Slogantext aus, behält aber die Titel-/Versionszeile des Banners bei.
    - `default`: Verwendet immer `All your chats, one OpenClaw.`.
    - `random`: Wechselnde humorvolle/saisonale Slogans (Standardverhalten).
    - Um das Banner vollständig auszublenden, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich die Websuche (und das Abrufen von Webinhalten)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt vom ausgewählten Provider ab:

    | Provider | Ohne Schlüssel | Umgebungsvariable(n) |
    | --- | --- | --- |
    | Brave | Nein | `BRAVE_API_KEY` |
    | DuckDuckGo | Ja (inoffiziell, HTML-basiert) | - |
    | Exa | Nein | `EXA_API_KEY` |
    | Firecrawl | Nein | `FIRECRAWL_API_KEY` |
    | Gemini | Nein | `GEMINI_API_KEY` |
    | Grok | Nein (xAI OAuth oder Schlüssel) | `XAI_API_KEY` |
    | Kimi | Nein | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |
    | MiniMax Search | Nein | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oder `MINIMAX_API_KEY` |
    | Ollama Web Search | Ja (erfordert `ollama signin`) | - |
    | Perplexity | Nein | `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY` |
    | SearXNG | Ja (selbst gehostet) | `SEARXNG_BASE_URL` |
    | Tavily | Nein | `TAVILY_API_KEY` |

    Grok kann außerdem xAI OAuth aus der Modellauthentifizierung wiederverwenden (`openclaw onboard --auth-choice xai-oauth`).

    **Empfohlen**: Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // optional; für automatische Erkennung weglassen
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    Die providerspezifische Websuche-Konfiguration befindet sich unter `plugins.entries.<plugin>.config.webSearch.*`. Ältere Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen weiterhin geladen, sollten aber in neuen Konfigurationen nicht verwendet werden. Die Konfiguration für den Firecrawl-Webabruf-Fallback befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    - Zulassungslisten: Fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` für alle drei hinzu.
    - `web_fetch` ist standardmäßig aktiviert.
    - Wenn `tools.web.fetch.provider` nicht angegeben ist, erkennt OpenClaw automatisch den ersten einsatzbereiten Fallback-Provider zum Abrufen anhand der verfügbaren Anmeldedaten; das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Dienstumgebung).

    Dokumentation: [Webtools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie kann ich sie wiederherstellen und dies künftig vermeiden?">
    `config.apply` ersetzt die **gesamte Konfiguration**; bei einem unvollständigen Objekt wird alles andere entfernt.

    Die aktuelle OpenClaw-Version schützt vor den meisten versehentlichen Überschreibungen:

    - Von OpenClaw vorgenommene Konfigurationsänderungen validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive, von OpenClaw vorgenommene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Führt eine direkte Bearbeitung dazu, dass der Start oder das Hot Reload fehlschlägt, verweigert der Gateway den Betrieb oder überspringt das erneute Laden; `openclaw.json` wird dabei nicht neu geschrieben.
    - `openclaw doctor --fix` ist für die Reparatur zuständig, kann die letzte als funktionsfähig bekannte Version wiederherstellen und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Untersuchen Sie die neueste Datei `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Keine letzte funktionsfähige Konfiguration oder abgelehnte Nutzlast vorhanden: Stellen Sie sie aus einer Sicherung wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Unerwarteter Verlust: Melden Sie einen Fehler und fügen Sie Ihre letzte bekannte Konfiguration oder eine Sicherung bei. Ein lokaler Coding-Agent kann häufig anhand von Protokollen oder dem Verlauf eine funktionsfähige Konfiguration rekonstruieren.

    So vermeiden Sie dies: Verwenden Sie `openclaw config set` für kleine Änderungen, `openclaw configure` für interaktive Bearbeitungen, `config.schema.lookup` zum Untersuchen eines unbekannten Pfads (gibt einen flachen Schemaknoten sowie Zusammenfassungen der unmittelbar untergeordneten Elemente zurück) und `config.patch` für partielle RPC-Bearbeitungen – verwenden Sie `config.apply` ausschließlich zum Ersetzen der vollständigen Konfiguration. Das agentenseitige Laufzeitwerkzeug `gateway` verweigert das Umschreiben von `tools.exec.ask` / `tools.exec.security` selbst über die veralteten Aliasse `tools.bash.*`.

    Dokumentation: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Fehlerbehebung für das Gateway](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern auf mehreren Geräten?">
    Gängiges Muster: **ein Gateway** (zum Beispiel ein Raspberry Pi) plus **Nodes** und **Agenten**.

    - **Gateway (zentral)**: verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte)**: Macs/iOS/Android-Geräte verbinden sich als Peripheriegeräte und stellen lokale Tools (`system.run`, `canvas`, `camera`) bereit.
    - **Agenten (Worker)**: separate Instanzen mit eigenen Arbeitsbereichen für spezielle Rollen (beispielsweise Betriebs- und persönliche Daten).
    - **Subagenten**: starten Hintergrundaufgaben von einem Hauptagenten aus, um sie parallel auszuführen.
    - **TUI**: stellt eine Verbindung zum Gateway her und wechselt zwischen Agenten/Sitzungen.

    Dokumentation: [Nodes](/de/nodes), [Remotezugriff](/de/gateway/remote), [Multi-Agenten-Routing](/de/concepts/multi-agent), [Subagenten](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser im Headless-Modus ausgeführt werden?">
    Ja:

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

    Der Standardwert ist `false` (mit sichtbarer Benutzeroberfläche). Der Headless-Modus löst auf einigen Websites eher Anti-Bot-Prüfungen aus (X/Twitter blockiert Headless-Sitzungen häufig). Er verwendet dieselbe Chromium-Engine und eignet sich für die meisten Automatisierungen; der Hauptunterschied besteht darin, dass kein Browserfenster sichtbar ist (verwenden Sie Screenshots für visuelle Darstellungen). Siehe [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie das Gateway neu. Siehe [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergeleitet?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet, das den Agenten ausführt und erst danach Nodes über den **Gateway-WebSocket** aufruft, wenn ein Node-Tool benötigt wird:

    Telegram -> Gateway -> Agent -> `node.*` -> Node -> Gateway -> Telegram

    Nodes sehen keinen eingehenden Provider-Datenverkehr; sie empfangen ausschließlich Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Koppeln Sie Ihren Computer als **Node**. Das Gateway wird an einem anderen Ort ausgeführt, kann jedoch über den Gateway-WebSocket `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Computer aufrufen.

    1. Führen Sie das Gateway auf dem ständig verfügbaren Host aus (VPS/Heimserver).
    2. Fügen Sie den Gateway-Host und Ihren Computer demselben Tailnet hinzu.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und stellen Sie im Modus **Remote over SSH** (oder direkt über das Tailnet) eine Verbindung her, damit sie als Node registriert wird.
    5. Genehmigen Sie die Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes stellen die Verbindung über den Gateway-WebSocket her.

    Sicherheitshinweis: Durch das Koppeln einer macOS-Node wird `system.run` auf diesem Computer ermöglicht. Koppeln Sie nur Geräte, denen Sie vertrauen; lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [Remote-Modus von macOS](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was nun?">
    Prüfen Sie zunächst die Grundlagen:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Überprüfen Sie anschließend die Authentifizierung und das Routing: Wenn Sie Tailscale Serve verwenden, vergewissern Sie sich, dass `gateway.auth.allowTailscale` korrekt festgelegt ist; wenn Sie eine Verbindung über einen SSH-Tunnel herstellen, stellen Sie sicher, dass der Tunnel aktiv ist und auf den richtigen Port verweist; vergewissern Sie sich, dass die Zulassungslisten für Direktnachrichten und Gruppen Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remotezugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander kommunizieren (lokal + VPS)?">
    Ja, allerdings gibt es keine integrierte Bot-zu-Bot-Bridge.

    **Am einfachsten**: Verwenden Sie einen normalen Chatkanal, auf den beide Bots zugreifen können (Slack/Telegram/WhatsApp). Lassen Sie Bot A eine Nachricht an Bot B senden und Bot B anschließend wie gewohnt antworten.

    **CLI-Bridge (generisch)**: Führen Sie ein Skript aus, das den anderen Gateway mit `openclaw agent --message ... --deliver` aufruft und dabei einen Chat als Ziel angibt, in dem der andere Bot Nachrichten empfängt. Wenn sich ein Bot auf einem entfernten VPS befindet, richten Sie Ihre CLI über SSH/Tailscale auf diesen entfernten Gateway aus (siehe [Remotezugriff](/de/gateway/remote)):

    ```bash
    openclaw agent --message "Hallo vom lokalen Bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Fügen Sie eine Schutzvorkehrung hinzu, damit die beiden Bots keine Endlosschleife erzeugen (nur bei Erwähnungen, Kanal-Zulassungslisten oder eine Regel „Nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remotezugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent-Versand](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Benötige ich für mehrere Agenten separate VPS-Instanzen?">
    Nein. Ein Gateway hostet mehrere Agenten, jeweils mit eigenem Arbeitsbereich, eigenen Modellstandards und eigenem Routing – dies ist die übliche Einrichtung und wesentlich günstiger und einfacher als ein VPS pro Agent. Verwenden Sie separate VPS-Instanzen nur für eine strikte Isolation (Sicherheitsgrenzen) oder für stark abweichende Konfigurationen, die Sie nicht gemeinsam nutzen möchten.
  </Accordion>

  <Accordion title="Bietet die Verwendung einer Node auf meinem persönlichen Laptop Vorteile gegenüber SSH von einem VPS aus?">
    Ja: Nodes sind die bevorzugte Möglichkeit, von einem entfernten Gateway auf Ihren Laptop zuzugreifen, und bieten mehr als nur Shell-Zugriff. Der Gateway läuft unter macOS/Linux (Windows über WSL2) und ist ressourcenschonend (ein kleiner VPS oder ein System der Raspberry-Pi-Klasse ist ausreichend; 4 GB RAM genügen), sodass eine übliche Einrichtung aus einem ständig aktiven Host und Ihrem Laptop als Node besteht.

    - **Kein eingehender SSH-Zugriff erforderlich** – Nodes stellen über die Gerätekopplung eine ausgehende Verbindung zum Gateway-WebSocket her.
    - **Sicherere Ausführungssteuerung** – `system.run` wird auf diesem Laptop durch Node-Zulassungslisten und -Genehmigungen kontrolliert.
    - **Mehr Gerätewerkzeuge** – Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browserautomatisierung** – Belassen Sie den Gateway auf einem VPS, führen Sie Chrome jedoch lokal über einen Node-Host aus, oder stellen Sie über Chrome MCP eine Verbindung zum lokalen Chrome her.

    SSH eignet sich gut für gelegentlichen Shell-Zugriff; Nodes sind für fortlaufende Agent-Workflows und Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** ausgeführt werden, sofern Sie nicht absichtlich isolierte Profile verwenden (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich mit dem Gateway verbinden (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Informationen zu monitorlosen Node-Hosts und zur CLI-Steuerung finden Sie unter [Node-Host-CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und bereitgestellten Plugin-Oberflächen ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, die Konfiguration anzuwenden?">
    Ja:

    - `config.schema.lookup`: Prüft vor dem Schreiben einen Konfigurationsunterbaum mit seinem flachen Schemaknoten, dem passenden UI-Hinweis und Zusammenfassungen der unmittelbaren untergeordneten Elemente.
    - `config.get`: Ruft den aktuellen Snapshot samt Hash ab.
    - `config.patch`: Sichere teilweise Aktualisierung (für die meisten RPC-Änderungen bevorzugt); lädt nach Möglichkeit dynamisch neu und startet bei Bedarf neu.
    - `config.apply`: Validiert und ersetzt die vollständige Konfiguration; lädt nach Möglichkeit dynamisch neu und startet bei Bedarf neu.
    - Das agentenseitige `gateway`-Laufzeittool verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; veraltete `tools.bash.*`-Aliasse werden auf dieselben geschützten Pfade normalisiert.

  </Accordion>

  <Accordion title="Minimale sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Legt Ihren Arbeitsbereich fest und beschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und stelle von meinem Mac aus eine Verbindung her?">
    1. **Auf dem VPS installieren und anmelden**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Auf Ihrem Mac installieren und anmelden** – verwenden Sie dazu die Tailscale-App und dasselbe Tailnet.
    3. **MagicDNS aktivieren** – aktivieren Sie dies in der Tailscale-Administrationskonsole, damit der VPS einen stabilen Namen erhält.
    4. **Den Tailnet-Hostnamen verwenden**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; Gateway-WS `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Um die Control UI ohne SSH zu verwenden, nutzen Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an die Loopback-Schnittstelle gebunden und HTTPS wird über Tailscale bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit; Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    1. Stellen Sie sicher, dass sich der VPS und der Mac im selben Tailnet befinden.
    2. Verwenden Sie die macOS-App im Remote-Modus (als SSH-Ziel kann der Tailnet-Hostname dienen) – sie tunnelt den Gateway-Port und stellt die Verbindung als Node her.
    3. Genehmigen Sie den Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Erkennung](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich OpenClaw auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop **nur lokale Tools** (Bildschirm/Kamera/exec) benötigen, fügen Sie ihn als **Node** hinzu – ein Gateway, keine duplizierte Konfiguration. Lokale Node-Tools sind derzeit nur unter macOS verfügbar. Installieren Sie ein zweites Gateway nur für **strikte Isolation** oder zwei vollständig getrennte Bots.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis.
    - eine globale Ausweichdatei `.env` aus `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Keine der beiden `.env`-Dateien überschreibt bestehende Umgebungsvariablen. Schlüssel für Provider-Anmeldedaten bilden bei der `.env`-Datei des Workspace eine Ausnahme: Schlüssel wie `GEMINI_API_KEY`, `XAI_API_KEY` oder `MISTRAL_API_KEY` (sowie andere Umgebungsvariablen für die Authentifizierung gebündelter Provider) werden aus der Workspace-`.env` ignoriert und sollten in der Prozessumgebung, in `~/.openclaw/.env` oder in der Konfiguration unter `env` hinterlegt werden.

    Inline-Umgebungsvariablen in der Konfiguration werden nur angewendet, wenn sie in der Prozessumgebung fehlen:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Die vollständige Rangfolge und alle Quellen finden Sie unter [/environment](/de/help/environment).

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Dienst gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei Lösungen:

    1. Hinterlegen Sie die fehlenden Schlüssel in `~/.openclaw/.env`, damit sie auch geladen werden, wenn der Dienst Ihre Shell-Umgebung nicht übernimmt.
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
       Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (bestehende werden niemals überschrieben). Entsprechende Umgebungsvariablen: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt "Shell env: off." Warum?'>
    `openclaw models status` gibt an, ob der **Shell-Umgebungsimport** aktiviert ist. "Shell env: off" bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen – es bedeutet lediglich, dass OpenClaw Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst (launchd/systemd) ausgeführt wird, übernimmt es Ihre Shell-Umgebung nicht. Beheben Sie dies, indem Sie das Token in `~/.openclaw/.env` hinterlegen, `env.shellEnv.enabled: true` aktivieren oder es der Konfiguration unter `env` hinzufügen (wird nur angewendet, wenn es fehlt). Starten Sie anschließend das Gateway neu und prüfen Sie den Status erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Tokens werden in dieser Reihenfolge aufgelöst: `OPENCLAW_GITHUB_TOKEN`, dann `COPILOT_GITHUB_TOKEN`, dann `GH_TOKEN`, dann `GITHUB_TOKEN`.

    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sitzungen und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie starte ich eine neue Unterhaltung?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Ja. Die standardmäßige Zurücksetzungsrichtlinie ist **täglich**: Eine Sitzung wechselt zu einer neuen Sitzung, sobald auf dem Gateway-Host eine konfigurierte lokale Uhrzeit erreicht wird (`session.reset.atHour`, Standardwert `4`, 0-23), ausgehend vom Startzeitpunkt der aktuellen Sitzung. Wechseln Sie stattdessen mit `mode: "idle"` und `session.reset.idleMinutes` zu einem inaktivitätsbasierten Zurücksetzen. Dadurch läuft eine Sitzung nach einer bestimmten Dauer ohne Aktivität ab (basierend auf der letzten tatsächlichen Interaktion, nicht auf Heartbeat-/Cron-/exec-Systemereignissen).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` unterstützt `direct` (veralteter Alias `dm`), `group` und `thread`. Das veraltete `session.idleMinutes` auf oberster Ebene funktioniert weiterhin als Kompatibilitätsalias für einen Standardwert im Inaktivitätsmodus, wenn kein Block `session.reset`/`resetByType` festgelegt ist. Sitzungen mit einer aktiven, vom Provider verwalteten CLI-Sitzung werden nicht durch den impliziten täglichen Standard beendet. Den vollständigen Lebenszyklus finden Sie unter [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title="Kann ich ein Team aus OpenClaw-Instanzen erstellen (ein CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agenten**: ein koordinierender Agent sowie mehrere Arbeitsagenten mit eigenen Workspaces und Modellen.

    Dies ist am ehesten als interessantes Experiment zu betrachten – es verbraucht viele Tokens und ist häufig weniger effizient als ein Bot mit getrennten Sitzungen. Das typische Modell besteht aus einem Bot, mit dem Sie kommunizieren, verschiedenen Sitzungen für parallele Arbeit und bei Bedarf gestarteten Sub-Agenten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agenten-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie kann ich das verhindern?">
    Der Sitzungskontext ist durch das Kontextfenster des Modells begrenzt. Lange Chats, umfangreiche Tool-Ausgaben oder viele Dateien können Compaction oder eine Kürzung auslösen.

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Bewahren Sie wichtigen Kontext im Workspace auf und bitten Sie den Bot, ihn erneut einzulesen.
    - Verwenden Sie Sub-Agenten für lange oder parallele Arbeiten, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit einem größeren Kontextfenster, wenn dies häufig auftritt.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, ohne es zu deinstallieren?">
    ```bash
    openclaw reset
    ```

    Vollständiges nicht interaktives Zurücksetzen:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Das Onboarding bietet ebenfalls **Zurücksetzen** an, wenn eine bestehende Konfiguration erkannt wird; siehe [Onboarding (CLI)](/de/start/wizard). Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, setzen Sie jedes Zustandsverzeichnis zurück (standardmäßig `~/.openclaw-<profile>`). Nur für die Entwicklung vorgesehenes Zurücksetzen: `openclaw gateway --dev --reset` löscht die Entwicklungskonfiguration, Anmeldedaten, Sitzungen und den Workspace.

  </Accordion>

  <Accordion title='Ich erhalte Fehler vom Typ "context too large" – wie kann ich zurücksetzen oder eine Compaction durchführen?'>
    - **Compaction** (behält die Unterhaltung bei und fasst ältere Gesprächsrunden zusammen): `/compact` oder `/compact <instructions>`, um Vorgaben für die Zusammenfassung zu machen.
    - **Zurücksetzen** (neue Sitzungs-ID für denselben Chat-Schlüssel): `/new` oder `/reset`.

    Falls das Problem weiterhin auftritt, passen Sie die **Sitzungsbereinigung** (`agents.defaults.contextPruning`) an, um alte Tool-Ausgaben zu kürzen, oder verwenden Sie ein Modell mit einem größeren Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Sitzungsbereinigung](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche `input` ausgegeben. Dies bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (häufig nach langen Threads oder einer Änderung an einem Tool bzw. Schema).

    Lösung: Starten Sie mit `/new` eine neue Sitzung (als eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum erhalte ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats werden standardmäßig alle **30m** ausgeführt oder alle **1h**, wenn der ermittelte Authentifizierungsmodus Anthropic-OAuth-/Token-Authentifizierung ist (einschließlich der Wiederverwendung der Claude-CLI) und `heartbeat.every` nicht gesetzt ist. Passen Sie das Intervall an oder deaktivieren Sie die Funktion:

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

    Wenn `HEARTBEAT.md` vorhanden, aber praktisch leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, ATX-Überschriften, Fence-Markierungen oder leere Listenelement-Platzhalter), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen. Wenn die Datei fehlt, wird der Heartbeat dennoch ausgeführt und das Modell entscheidet, was zu tun ist.

    Agentenspezifische Überschreibungen verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einer WhatsApp-Gruppe ein "Bot-Konto" hinzufügen?'>
    Nein. OpenClaw wird mit **Ihrem eigenen Konto** ausgeführt – wenn Sie Mitglied der Gruppe sind, kann OpenClaw sie sehen. Standardmäßig werden Gruppenantworten blockiert, bis Sie Absender zulassen (`groupPolicy: "allowlist"`).

    So beschränken Sie Gruppenantworten ausschließlich auf sich selbst:

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

  <Accordion title="Wie ermittle ich die JID einer WhatsApp-Gruppe?">
    Am schnellsten geht es, indem Sie die Logs live verfolgen und eine Testnachricht in der Gruppe senden.

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`) mit der Endung `@g.us`, beispielsweise `1234567890-1234567890@g.us`.

    Wenn die Gruppe bereits konfiguriert bzw. zugelassen ist, listen Sie die Gruppen aus der Konfiguration auf:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Verzeichnis](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen: Die Erwähnungsbeschränkung ist standardmäßig aktiviert (Sie müssen den Bot mit @ erwähnen oder mit `mentionPatterns` übereinstimmen), oder Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht in der Zulassungsliste enthalten.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads ihren Kontext mit Direktnachrichten?">
    Direkte Chats werden standardmäßig in der Hauptsitzung zusammengeführt. Gruppen/Kanäle besitzen eigene Sitzungsschlüssel, und Telegram-Themen bzw. Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Es gibt keine festen Grenzen – Dutzende oder sogar Hunderte sind möglich. Beachten Sie jedoch Folgendes:

    - **Speicherplatzwachstum**: Aktive Sitzungen und Transkripte befinden sich in der agentenspezifischen SQLite-Datenbank; veraltete bzw. archivierte Artefakte können sich weiterhin unter `~/.openclaw/agents/<agentId>/sessions/` ansammeln.
    - **Token-Kosten**: Mehr Agenten bedeuten eine stärkere gleichzeitige Modellnutzung.
    - **Betriebsaufwand**: agentenspezifische Authentifizierungsprofile, Workspaces und Kanal-Routing.

    Verwenden Sie pro Agent einen **aktiven** Workspace (`agents.defaults.workspace`), bereinigen Sie alte Sitzungen bei zunehmender Speicherbelegung mit `openclaw sessions cleanup` (bearbeiten Sie den aktiven SQLite-Zustand nicht manuell), und verwenden Sie `openclaw doctor`, um verwaiste Workspaces und nicht übereinstimmende Profile zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja, über **Multi-Agent-Routing**: Führen Sie mehrere isolierte Agenten aus und routen Sie eingehende Nachrichten nach Kanal/Konto/Kommunikationspartner. Slack wird als Kanal unterstützt und kann bestimmten Agenten zugewiesen werden.

    Browserzugriff ist leistungsfähig, kann aber nicht „alles tun, was ein Mensch kann“ – Anti-Bot-Maßnahmen, CAPTCHAs und MFA können die Automatisierung weiterhin blockieren. Verwenden Sie für eine möglichst zuverlässige Steuerung lokales Chrome MCP auf dem Host oder CDP auf dem Rechner, auf dem der Browser tatsächlich ausgeführt wird.

    Best-Practice-Einrichtung: permanent laufender Gateway-Host (VPS/Mac mini), ein Agent pro Rolle (Bindungen), diesen Agenten zugeordnete Slack-Kanäle und bei Bedarf ein lokaler Browser über Chrome MCP oder eine Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack), [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Authentifizierungsprofile

Fragen und Antworten zu Modellen – Standardwerte, Auswahl, Aliase, Wechsel, Failover und Authentifizierungsprofile – finden Sie in den [häufig gestellten Fragen zu Modellen](/de/help/faq-models).

## Gateway: Ports, „bereits ausgeführt“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen, gemultiplexten Port für WebSocket + HTTP (Control UI, Hooks usw.). Prioritätsreihenfolge:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standardwert 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status „Runtime: running“, aber „Connectivity probe: failed“?'>
    „Running“ ist die Ansicht des **Supervisors** (launchd/systemd/schtasks); bei der Konnektivitätsprüfung stellt die CLI tatsächlich eine Verbindung zum Gateway-WebSocket her. Verlassen Sie sich auf diese Zeilen aus `openclaw gateway status`: `Probe target:` (die von der Prüfung verwendete URL), `Listening:` (was tatsächlich an den Port gebunden ist), `Last gateway error:` (häufige Grundursache, wenn der Prozess ausgeführt wird, der Port aber nicht lauscht).
  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für „Config (cli)“ und „Config (service)“ an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere verwendet (häufig aufgrund einer Abweichung bei `--profile` / `OPENCLAW_STATE_DIR`).

    Führen Sie zur Behebung Folgendes mit demselben `--profile` / derselben Umgebung aus, die der Dienst verwenden soll:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='Was bedeutet „another gateway instance is already listening“?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem es den WebSocket-Listener unmittelbar beim Start bindet (standardmäßig `ws://127.0.0.1:18789`). Wenn die Bindung mit `EADDRINUSE` fehlschlägt, wird ein `GatewayLockError` ausgelöst („another gateway instance is already listening“).

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie OpenClaw mit `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (der Client verbindet sich mit einem Gateway an einem anderen Ort)?">
    Legen Sie `gateway.mode: "remote"` fest und geben Sie eine Remote-WebSocket-URL an, optional mit Remote-Anmeldedaten auf Basis eines gemeinsamen Geheimnisses:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` auf `local` gesetzt ist (oder Sie ein überschreibendes Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt bei Änderungen dieser Werte im laufenden Betrieb den Modus.
    - `gateway.remote.token` / `.password` sind ausschließlich clientseitige Remote-Anmeldedaten; sie aktivieren nicht von selbst die lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet „unauthorized“ (oder stellt ständig erneut eine Verbindung her). Was nun?'>
    Der Authentifizierungspfad Ihres Gateways stimmt nicht mit der Authentifizierungsmethode der UI überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage`, beschränkt auf den aktuellen Browser-Tab und die ausgewählte Gateway-URL. Dadurch funktionieren Aktualisierungen im selben Tab weiterhin, ohne dass das Token dauerhaft in localStorage gespeichert wird.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten einmaligen Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token durchführen, wenn das Gateway entsprechende Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Wiederholungsversuch mit dem zwischengespeicherten Token verwendet erneut die zusammen mit dem Geräte-Token gespeicherten genehmigten Geltungsbereiche; Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten die angeforderte Menge von Geltungsbereichen bei, anstatt die zwischengespeicherten Geltungsbereiche zu übernehmen.
    - Außerhalb dieses Wiederholungspfads gilt für die Verbindungsherstellung folgende Authentifizierungspriorität: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token und schließlich Bootstrap-Token.
    - Der integrierte Bootstrap über Einrichtungscode gibt ein Node-Geräte-Token mit `scopes: []` sowie ein zeitlich begrenztes Operator-Übergabe-Token für das vertrauenswürdige mobile Onboarding zurück. Die Operator-Übergabe kann während der Einrichtung auf native Konfigurationsdaten zugreifen, gewährt jedoch weder Geltungsbereiche zum Ändern der Kopplung noch `operator.admin`.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus, kopiert sie und versucht, sie zu öffnen; zeigt bei einem System ohne grafische Oberfläche einen SSH-Hinweis an).
    - Noch kein Token: `openclaw doctor --generate-gateway-token`.
    - Remote: Richten Sie zunächst mit `ssh -N -L 18789:127.0.0.1:18789 user@host` einen Tunnel ein und öffnen Sie anschließend `http://127.0.0.1:18789/`.
    - Modus mit gemeinsamem Geheimnis: Legen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` fest und fügen Sie anschließend das entsprechende Geheimnis in die Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Vergewissern Sie sich, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine direkte Loopback-/Tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Modus mit vertrauenswürdigem Proxy: Vergewissern Sie sich, dass die Verbindung über den konfigurierten identitätsbewussten Proxy erfolgt. Loopback-Proxys auf demselben Host benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Abweichung bleibt nach dem einmaligen Wiederholungsversuch bestehen: Rotieren/genehmigen Sie das Token des gekoppelten Geräts erneut:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Rotation abgelehnt: Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich über `operator.admin` verfügen. Explizite `--scope`-Werte dürfen außerdem die aktuellen Operator-Geltungsbereiche des Aufrufers nicht überschreiten.
    - Problem weiterhin ungelöst: Führen Sie `openclaw status --all` aus und lesen Sie die [Fehlerbehebung](/de/gateway/troubleshooting). Einzelheiten zur Authentifizierung finden Sie unter [Dashboard](/de/web/dashboard).

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es lauscht nur auf Loopback">
    Bei der Bindung `tailnet` wird eine Tailscale-IP von Ihren Netzwerkschnittstellen ausgewählt (100.64.0.0/10). Wenn der Rechner nicht mit Tailscale verbunden ist (oder die Schnittstelle ausgefallen ist), fällt das Gateway auf Loopback zurück, anstatt eine andere Netzwerkschnittstelle freizugeben.

    Behebung: Starten Sie Tailscale auf diesem Host und starten Sie das Gateway neu, oder wechseln Sie ausdrücklich zu `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` ist explizit; `auto` bevorzugt Loopback. Verwenden Sie `gateway.bind: "tailnet"`, um die Nicht-Loopback-Freigabe auf das Tailnet zu beschränken und gleichzeitig den erforderlichen `127.0.0.1`-Listener auf demselben Host beizubehalten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nicht – ein Gateway kann mehrere Messaging-Kanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur für Redundanz (beispielsweise einen Rettungs-Bot) oder eine strikte Isolation und isolieren Sie jedes davon mit eigenen Werten für `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` und einem eindeutigen `gateway.port`.

    Empfohlen: `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`), ein eindeutiger `gateway.port` pro Profilkonfiguration (oder `--port` bei manueller Ausführung) und ein profilbezogener Dienst mit `openclaw --profile <name> gateway install`.

    Profile hängen außerdem Suffixe an Dienstnamen an: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. Die nicht qualifizierte systemd-Unit `openclaw-gateway` existiert nur für das Standardprofil; der frühere systemd-Unit-Name vor der Umbenennung, `clawdbot-gateway`, wird automatisch migriert.

    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet „invalid handshake“ / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als erste Nachricht einen `connect`-Frame. Alles andere schließt die Verbindung mit **Code 1008** (Richtlinienverstoß).

    Häufige Ursachen: Sie haben die **HTTP**-URL in einem Browser statt in einem WS-Client geöffnet, den falschen Port/Pfad verwendet oder ein Proxy/Tunnel hat Authentifizierungs-Header entfernt beziehungsweise eine Nicht-Gateway-Anfrage gesendet.

    Behebung: Verwenden Sie die WS-URL (`ws://<host>:18789` oder `wss://...` über HTTPS), öffnen Sie den WS-Port nicht in einem normalen Browser-Tab und nehmen Sie bei aktivierter Authentifizierung das Token/Passwort in den `connect`-Frame auf. CLI-/TUI-Beispiel:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Protokollierung und Debugging

<AccordionGroup>
  <Accordion title="Wo befinden sich die Protokolle?">
    Dateiprotokolle (strukturiert): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Legen Sie mit `logging.file` einen stabilen Pfad fest, mit `logging.level` die Dateiprotollstufe und mit `--verbose` sowie `logging.consoleLevel` die Ausführlichkeit der Konsolenausgabe.

    Schnellste fortlaufende Anzeige:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Protokolle (wenn das Gateway über launchd/systemd ausgeführt wird):

    - macOS-launchd-Standardausgabe: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`; Standardfehlerausgabe wird unterdrückt).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Weitere Informationen finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Wie starte, stoppe oder starte ich den Gateway-Dienst neu?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückfordern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen – wie starte ich OpenClaw neu?">
    Drei Windows-Installationsmodi:

    **1) Lokale Einrichtung mit Windows Hub**: Die native App verwaltet ein lokales, der App zugeordnetes WSL-Gateway. Öffnen Sie **OpenClaw Companion** über das Startmenü oder den Infobereich und verwenden Sie anschließend **Gateway Setup** oder die Registerkarte „Connections“.

    **2) Manuelles WSL2-Gateway**: Das Gateway wird innerhalb von Linux ausgeführt.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Wenn Sie den Dienst nie installiert haben, starten Sie ihn im Vordergrund: `openclaw gateway run`.

    **3) Native Windows-CLI/native Windows-Gateway**: Wird direkt unter Windows ausgeführt.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Wenn Sie es manuell ausführen (ohne Dienst): `openclaw gateway run`.

    Dokumentation: [Windows](/de/platforms/windows), [Betriebshandbuch für den Gateway-Dienst](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich überprüfen?">
    Schnelle Zustandsprüfung:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen: Die Modellauthentifizierung wurde auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`), die Kanalkopplung/Zulassungsliste blockiert Antworten (prüfen Sie die Kanalkonfiguration und Protokolle) oder WebChat/Dashboard wurde ohne das richtige Token geöffnet. Vergewissern Sie sich bei Remote-Verbindungen, dass die Tunnel-/Tailscale-Verbindung besteht und das Gateway-WebSocket erreichbar ist.

    Dokumentation: [Kanäle](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='„Disconnected from gateway: no reason“ – was nun?'>
    Dies bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie: Wird das Gateway ausgeführt (`openclaw gateway status`)? Ist es funktionsfähig (`openclaw status`)? Verfügt die UI über das richtige Token (`openclaw dashboard`)? Besteht bei einer Remote-Verbindung die Tunnel-/Tailscale-Verbindung?

    Zeigen Sie anschließend die Protokolle fortlaufend an:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/de/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich überprüfen?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie anschließend den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü enthält zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, dennoch können einige Menüeinträge entfallen. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Stellen Sie auf einem VPS oder hinter einem Proxy sicher, dass ausgehendes HTTPS zulässig ist und DNS für `api.telegram.org` funktioniert.

    Wenn der Gateway entfernt ausgeführt wird, prüfen Sie die Protokolle auf dem Gateway-Host.

    Dokumentation: [Telegram](/de/channels/telegram), [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand anzuzeigen. Wenn Sie Antworten in einem Chat-Kanal erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich den Gateway vollständig und starte ihn anschließend neu?">
    Wenn Sie den Dienst installiert haben (launchd unter macOS, systemd unter Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Beenden Sie ihn im Vordergrund mit Ctrl-C und führen Sie anschließend `openclaw gateway run` aus.

    Dokumentation: [Betriebshandbuch für den Gateway-Dienst](/de/gateway).

  </Accordion>

  <Accordion title="Einfach erklärt: openclaw gateway restart im Vergleich zu openclaw gateway">
    `openclaw gateway restart` startet den **Hintergrunddienst** (launchd/systemd) neu. `openclaw gateway` führt den Gateway für diese Terminalsitzung **im Vordergrund** aus. Verwenden Sie die Gateway-Unterbefehle, wenn Sie den Dienst installiert haben; verwenden Sie für eine einmalige Ausführung den einfachen Vordergrundlauf.
  </Accordion>

  <Accordion title="Der schnellste Weg zu weiteren Details bei einem Fehler">
    Starten Sie den Gateway mit `--verbose`, um ausführlichere Konsolendetails zu erhalten, und prüfen Sie anschließend die Protokolldatei auf Fehler bei der Kanalauthentifizierung, beim Modell-Routing und bei RPC-Aufrufen.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge des Agenten müssen strukturierte Medienfelder wie `media`, `mediaUrl`, `path` oder `filePath` verwenden. Siehe [Einrichtung des OpenClaw-Assistenten](/de/start/openclaw) und [Senden durch den Agenten](/de/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Hier ist es" --media /path/to/file.png
    ```

    Prüfen Sie außerdem: Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Positivlisten blockiert; die Datei liegt innerhalb der Größenbeschränkungen des Providers (Bilder werden auf eine maximale Seitenlänge von 2048px skaliert); `tools.fs.workspaceOnly=true` beschränkt das Senden über lokale Pfade auf Dateien im Arbeitsbereich, im temporären Speicher/Medien-Speicher und auf durch die Sandbox validierte Dateien; `tools.fs.workspaceOnly=false` (Standard) ermöglicht strukturierten Versand lokaler Medien mit Dateien auf dem Host, die der Agent bereits lesen kann, und zwar für Medien sowie sichere Dokumenttypen (Bilder, Audio, Video, PDF, Office-Dokumente und validierte Textdokumente wie Markdown/MD, TXT, JSON, YAML/YML). Dies ist kein Scanner für Geheimnisse – eine für den Agenten lesbare Datei `secret.txt` oder `config.json` kann angehängt werden, wenn Erweiterung und Inhaltsvalidierung übereinstimmen. Bewahren Sie sensible Dateien außerhalb der für den Agenten lesbaren Pfade auf oder behalten Sie `tools.fs.workspaceOnly=true` bei, um das Senden über lokale Pfade strenger einzuschränken.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende Direktnachrichten zugänglich zu machen?">
    Behandeln Sie eingehende Direktnachrichten als nicht vertrauenswürdige Eingaben. Die Standardeinstellungen reduzieren das Risiko:

    - Das Standardverhalten auf Kanälen mit Direktnachrichten-Unterstützung ist **Kopplung**: Unbekannte Absender erhalten einen Kopplungscode, und ihre Nachricht wird nicht verarbeitet. Genehmigen Sie sie mit `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code eingegangen ist.
    - Das öffentliche Öffnen von Direktnachrichten erfordert eine ausdrückliche Aktivierung (`dmPolicy: "open"` und Positivliste `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante Richtlinien für Direktnachrichten aufzuzeigen.

  </Accordion>

  <Accordion title="Ist Prompt-Injection nur bei öffentlichen Bots ein Problem?">
    Nein. Bei Prompt-Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot Direktnachrichten senden kann. Wenn Ihr Assistent externe Inhalte liest (Websuche/-abruf, Browserseiten, E-Mails, Dokumentation, Anhänge, eingefügte Protokolle), können diese Inhalte Anweisungen enthalten, die versuchen, das Modell zu übernehmen – selbst wenn Sie der einzige Absender sind.

    Das größte Risiko besteht bei aktivierten Tools: Das Modell kann dazu verleitet werden, Kontext auszuschleusen oder in Ihrem Namen Tools aufzurufen. Begrenzen Sie den möglichen Schaden:

    - Verwenden Sie einen schreibgeschützten oder Tool-deaktivierten „Lese“-Agenten, um nicht vertrauenswürdige Inhalte zusammenzufassen.
    - Deaktivieren Sie `web_search` / `web_fetch` / `browser` für Agenten mit aktivierten Tools.
    - Behandeln Sie auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig: Sowohl OpenResponses `input_file` als auch die Extraktion aus Medienanhängen umschließen extrahierten Text mit expliziten Begrenzungsmarkierungen für externe Inhalte, anstatt unverarbeiteten Dateitext zu übergeben.
    - Verwenden Sie eine Sandbox und strenge Tool-Positivlisten.

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Ist OpenClaw weniger sicher, weil es TypeScript/Node statt Rust/WASM verwendet?">
    Sprache und Laufzeit sind relevant, stellen jedoch nicht das Hauptrisiko für einen persönlichen Agenten dar. Die praktischen Risiken sind die Zugänglichkeit des Gateways, wer dem Bot Nachrichten senden kann, Prompt-Injection, der Tool-Umfang, der Umgang mit Anmeldedaten, Browserzugriff, Ausführungszugriff und das Vertrauen in Skills/Plugins von Drittanbietern.

    Rust und WASM können für einige Codeklassen eine stärkere Isolation bieten, lösen jedoch weder Prompt-Injection noch ungeeignete Positivlisten, die öffentliche Zugänglichkeit des Gateways, zu weitreichende Tools oder ein Browserprofil, das bereits bei sensiblen Konten angemeldet ist. Behandeln Sie Folgendes als primäre Schutzmaßnahmen: Halten Sie den Gateway privat oder authentifiziert, verwenden Sie Kopplung und Positivlisten für Direktnachrichten/Gruppen, verweigern Sie riskante Tools für nicht vertrauenswürdige Eingaben oder führen Sie sie in einer Sandbox aus, installieren Sie nur vertrauenswürdige Plugins und Skills und führen Sie nach Konfigurationsänderungen `openclaw security audit --deep` aus.

    Details: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ich habe Berichte über öffentlich zugängliche OpenClaw-Instanzen gesehen. Was sollte ich prüfen?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Eine sicherere Ausgangskonfiguration: Der Gateway ist an `loopback` gebunden oder nur über authentifizierten privaten Zugriff erreichbar (Tailnet, SSH-Tunnel, Token-/Passwortauthentifizierung oder ein korrekt konfigurierter vertrauenswürdiger Proxy); Direktnachrichten befinden sich im Modus `pairing` oder `allowlist`; Gruppen stehen auf der Positivliste und erfordern Erwähnungen, sofern nicht jedes Mitglied vertrauenswürdig ist; Hochrisiko-Tools (`exec`, `browser`, `gateway`, `cron`) sind für Agenten, die nicht vertrauenswürdige Inhalte lesen, gesperrt oder eng begrenzt; Sandboxing ist aktiviert, wenn die Tool-Ausführung einen kleineren möglichen Schadensumfang erfordert.

    Öffentliche Bindungen ohne Authentifizierung, offene Direktnachrichten/Gruppen mit Tools und eine öffentlich zugängliche Browsersteuerung sind die Befunde, die Sie zuerst beheben sollten. Details: [openclaw security audit](/de/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="Ist die Installation von ClawHub-Skills und Drittanbieter-Plugins sicher?">
    Behandeln Sie Skills und Plugins von Drittanbietern als Code, dem Sie bewusst vertrauen. ClawHub-Skill-Seiten zeigen vor der Installation den Scanstatus an, aber Scans stellen keine vollständige Sicherheitsgrenze dar. OpenClaw führt während der Installation oder Aktualisierung von Plugins/Skills keine integrierte lokale Blockierung gefährlichen Codes aus; verwenden Sie die vom Betreiber verwaltete `security.installPolicy` für lokale Zulassungs-/Sperrentscheidungen.

    Sichereres Vorgehen: Bevorzugen Sie vertrauenswürdige Autoren und festgeschriebene Versionen, lesen Sie den Skill/das Plugin vor der Aktivierung, halten Sie Positivlisten für Plugins/Skills eng gefasst, führen Sie Arbeitsabläufe mit nicht vertrauenswürdigen Eingaben in einer Sandbox mit minimalen Tools aus und vermeiden Sie, Drittanbieter-Code weitreichenden Zugriff auf das Dateisystem, die Befehlsausführung, den Browser oder Geheimnisse zu gewähren.

    Details: [Skills](/de/tools/skills), [Plugins](/de/tools/plugin), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot ein eigenes E-Mail-Konto, GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Konfigurationen. Wenn Sie den Bot durch separate Konten und Telefonnummern isolieren, reduzieren Sie den möglichen Schaden, falls etwas schiefläuft, und können Anmeldedaten leichter austauschen oder den Zugriff widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Beginnen Sie klein: Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie ihn später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Vorgehen: Belassen Sie Direktnachrichten im **Kopplungsmodus** oder verwenden Sie eine eng gefasste Positivliste, nutzen Sie eine **separate Nummer oder ein separates Konto**, wenn der Bot in Ihrem Namen Nachrichten senden soll, und lassen Sie ihn Entwürfe erstellen, die Sie **vor dem Senden genehmigen**.

    Experimentieren Sie auf einem dedizierten, isolierten Konto. Siehe [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent ausschließlich chattet und die Eingabe vertrauenswürdig ist. Kleinere Modellklassen sind anfälliger für die Übernahme durch Anweisungen; vermeiden Sie sie daher für Agenten mit aktivierten Tools oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, schränken Sie die Tools ein und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe in Telegram /start ausgeführt, aber keinen Kopplungscode erhalten">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und `dmPolicy: "pairing"` aktiviert ist; `/start` allein erzeugt keinen Code.

    Prüfen Sie ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Für sofortigen Zugriff fügen Sie Ihre Absender-ID der Positivliste hinzu oder setzen Sie `dmPolicy: "open"` für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Sendet es Nachrichten an meine Kontakte? Wie funktioniert die Kopplung?">
    Nein. Die standardmäßige WhatsApp-Richtlinie für Direktnachrichten ist **Kopplung**. Unbekannte Absender erhalten lediglich einen Kopplungscode; ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf empfangene Chats oder auf explizite Sendevorgänge, die Sie auslösen.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    Die Abfrage der Telefonnummer im Assistenten legt Ihre **Positivliste/Ihren Eigentümer** fest, damit Ihre eigenen Direktnachrichten zulässig sind – sie wird nicht für automatisches Senden verwendet. Verwenden Sie bei Ihrer persönlichen WhatsApp-Nummer diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Abbrechen von Aufgaben und „es lässt sich nicht stoppen“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemmeldungen im Chat angezeigt werden?">
    Die meisten internen/Tool-Meldungen werden nur angezeigt, wenn für diese Sitzung **ausführliche Ausgabe**, **Ablaufverfolgung** oder **Reasoning** aktiviert ist.

    Beheben Sie dies in dem Chat, in dem die Meldungen angezeigt werden:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn weiterhin zu viele Meldungen erscheinen: Prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie die ausführliche Ausgabe auf **inherit**; stellen Sie sicher, dass Sie kein Bot-Profil mit `verboseDefault: "on"` in der Konfiguration verwenden.

    Dokumentation: [Denken und ausführliche Ausgabe](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie einen der folgenden Ausdrücke **als eigenständige Nachricht** (ohne Schrägstrich), um einen Abbruch auszulösen: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Gängige nicht englische Auslöser (Französisch, Deutsch, Spanisch, Chinesisch, Japanisch, Hindi, Arabisch, Russisch) funktionieren ebenfalls.

    Bitten Sie den Agenten bei Hintergrundprozessen, die vom Ausführungs-Tool gestartet wurden, Folgendes auszuführen:

    ```text
    process action:kill sessionId:XXX
    ```

    Die meisten Slash-Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt; einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Positivliste auch innerhalb einer Nachricht. Siehe [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? („Kontextübergreifende Nachrichtenübermittlung verweigert“)'>
    OpenClaw blockiert standardmäßig die Nachrichtenübermittlung **zwischen Providern**. Wenn ein Tool-Aufruf an Telegram gebunden ist, sendet er nicht an Discord, sofern Sie dies nicht ausdrücklich erlauben. Die Änderung wird sofort wirksam; ein Neustart des Gateways ist nicht erforderlich:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[von {channel}] " },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnell aufeinanderfolgende Nachrichten „ignorieren“?'>
    Während eines laufenden Durchlaufs werden Prompts standardmäßig in den aktiven Durchlauf gelenkt. Verwenden Sie `/queue`, um das Verhalten des aktiven Durchlaufs auszuwählen:

    - `steer` (Standard) – lenkt den aktiven Durchlauf an der nächsten Modellgrenze.
    - `followup` – reiht Nachrichten in die Warteschlange ein und verarbeitet sie nacheinander, nachdem der aktuelle Durchlauf beendet ist.
    - `collect` – reiht kompatible Nachrichten in die Warteschlange ein und antwortet einmal, nachdem der aktuelle Durchlauf beendet ist.
    - `interrupt` – bricht den aktuellen Durchlauf ab und startet einen neuen.

    Fügen Sie Warteschlangenmodi Optionen wie `debounce:0.5s cap:25 drop:summarize` hinzu. Weitere Informationen finden Sie unter [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Verschiedenes

<AccordionGroup>
  <Accordion title='Welches Modell ist bei Anthropic mit einem API-Schlüssel standardmäßig eingestellt?'>
    Anmeldedaten und Modellauswahl sind voneinander unabhängig. Durch das Festlegen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Authentifizierungsprofilen) wird die Authentifizierung aktiviert. Das tatsächliche Standardmodell ist jedoch das Modell, das Sie in `agents.defaults.model.primary` konfigurieren (beispielsweise `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` bedeutet, dass das Gateway die Anthropic-Anmeldedaten nicht in der erwarteten Datei `auth-profiles.json` des ausgeführten Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie immer noch nicht weiter? Fragen Sie auf [Discord](https://discord.com/invite/clawd) nach oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) – Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modell-FAQ](/de/help/faq-models) – Modellauswahl, Failover, Authentifizierungsprofile
- [Fehlerbehebung](/de/help/troubleshooting) – symptomorientierte Fehleranalyse
