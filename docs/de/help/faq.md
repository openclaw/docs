---
read_when:
    - Antworten auf häufige Supportfragen zu Einrichtung, Installation, Onboarding oder Laufzeitumgebung
    - Triage von benutzergemeldeten Problemen vor einer eingehenderen Fehlerbehebung
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Verwendung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-07-24T05:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7bddbf851a0e25323aa7e7cfc3882b33cc0d33a2aa223cccf00328af477ab4c4
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten sowie ausführlichere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Informationen zur Laufzeitdiagnose finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas nicht funktioniert

<Steps>
  <Step title="Schnellstatus">
    ```bash
    openclaw status
    ```
    Schnelle lokale Zusammenfassung: Betriebssystem und Update, Erreichbarkeit von Gateway/Dienst, Agenten/Sitzungen, Provider-Konfiguration und Laufzeitprobleme (wenn das Gateway erreichbar ist).
  </Step>
  <Step title="Einfügbarer Bericht (kann sicher geteilt werden)">
    ```bash
    openclaw status --all
    ```
    Schreibgeschützte Diagnose mit einem Auszug der neuesten Protokolleinträge (Tokens unkenntlich gemacht).
  </Step>
  <Step title="Daemon- und Portstatus">
    ```bash
    openclaw gateway status
    ```
    Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Dienst wahrscheinlich verwendet hat.
  </Step>
  <Step title="Ausführliche Prüfungen">
    ```bash
    openclaw status --deep
    ```
    Live-Zustandsprüfung des Gateways einschließlich Kanalprüfungen, sofern unterstützt (erfordert ein erreichbares Gateway). Siehe [Zustand](/de/gateway/health).
  </Step>
  <Step title="Neuestes Protokoll fortlaufend anzeigen">
    ```bash
    openclaw logs --follow
    ```
    Wenn RPC nicht verfügbar ist, verwenden Sie ersatzweise:
    ```bash
    tail -f "/tmp/openclaw/openclaw-$(date +%F).log"
    # Beispiel für ein benanntes Profil:
    tail -f "/tmp/openclaw/openclaw-dev-$(date +%F).log"
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
    openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL und den Konfigurationspfad
    ```
    Fordert vom laufenden Gateway eine vollständige Momentaufnahme an. Siehe [Zustand](/de/gateway/health).
  </Step>
</Steps>

## Schnellstart und Ersteinrichtung

Fragen und Antworten zum ersten Start – Installation, Onboarding, Authentifizierungswege, Abonnements, anfängliche Fehler – finden Sie in den [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw, kurz zusammengefasst?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet über die Messaging-Oberflächen, die Sie bereits verwenden (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp und gebündelte Kanal-Plugins wie QQ Bot), und unterstützt auf kompatiblen Plattformen außerdem Sprache sowie ein Live-Canvas. Das **Gateway** ist die ständig aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Nutzenversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **Local-First-Steuerungsebene**, die einen leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführt, über die von Ihnen bereits verwendeten Chat-Apps erreichbar ist und zustandsbehaftete Sitzungen, Speicher und Werkzeuge bietet – ohne Ihre Arbeitsabläufe einem gehosteten SaaS zu überlassen.

    - **Ihre Geräte, Ihre Daten**: Führen Sie das Gateway an einem beliebigen Ort aus (Mac, Linux, VPS) und speichern Sie Arbeitsbereich und Sitzungsverlauf lokal.
    - **Echte Kanäle statt einer Web-Sandbox**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp usw. sowie mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellunabhängig**: Verwenden Sie Anthropic, MiniMax, OpenAI, OpenRouter usw. mit agentenspezifischem Routing und Failover.
    - **Nur-lokal-Option**: Führen Sie lokale Modelle aus, damit alle Daten auf Ihrem Gerät verbleiben können.
    - **Multi-Agent-Routing**: Separate Agenten pro Kanal, Konto oder Aufgabe, jeweils mit eigenem Arbeitsbereich und eigenen Standardwerten.
    - **Open Source und anpassbar**: Prüfen, erweitern und selbst hosten – ohne Bindung an einen Anbieter.

    Dokumentation: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte: eine Website erstellen (WordPress, Shopify oder eine statische Website); einen Prototyp für eine mobile App entwickeln (Konzept, Bildschirme, API-Plan); Dateien und Ordner organisieren; Gmail verbinden und Zusammenfassungen oder Nachfassaktionen automatisieren.

    OpenClaw kann große Aufgaben bewältigen, funktioniert jedoch am besten, wenn diese in Phasen unterteilt und für parallele Arbeit Sub-Agenten eingesetzt werden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    - **Persönliche Briefings**: Zusammenfassungen von Posteingang, Kalender und Nachrichten, die für Sie relevant sind.
    - **Recherche und Entwürfe**: schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Nachfassaktionen**: durch Cron oder Heartbeat gesteuerte Hinweise und Checklisten.
    - **Browserautomatisierung**: Formulare ausfüllen, Daten erfassen und wiederkehrende Webaufgaben erledigen.
    - **Geräteübergreifende Koordination**: Senden Sie eine Aufgabe von Ihrem Smartphone, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Leadgenerierung, Kontaktaufnahme, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, bei **Recherche, Qualifizierung und Entwurfserstellung**: Websites durchsuchen, Auswahllisten erstellen, potenzielle Kunden zusammenfassen sowie Entwürfe für Kontaktaufnahmen oder Anzeigentexte verfassen.

    Bei **Kontaktaufnahme oder Anzeigenkampagnen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, halten Sie lokale Gesetze und Plattformrichtlinien ein und prüfen Sie alles vor dem Versand. Lassen Sie OpenClaw Entwürfe erstellen; Sie genehmigen sie.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile bietet OpenClaw gegenüber Claude Code bei der Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinierungsebene, kein Ersatz für eine IDE. Verwenden Sie Claude Code oder Codex für den schnellsten direkten Entwicklungszyklus innerhalb eines Repositorys. Verwenden Sie OpenClaw für dauerhaften Speicher, geräteübergreifenden Zugriff und Werkzeugorchestrierung.

    - Dauerhafter Speicher und Arbeitsbereich über Sitzungen hinweg.
    - Plattformübergreifender Zugriff (Telegram, WhatsApp, TUI, WebChat).
    - Werkzeugorchestrierung (Browser, Dateien, Zeitplanung, Hooks).
    - Ständig aktives Gateway (auf einem VPS ausführen und von überall darauf zugreifen).
    - Nodes für lokale Browser-, Bildschirm-, Kamera- und Ausführungsfunktionen.

    Beispiele: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie kann ich Skills anpassen, ohne das Repository zu verändern?">
    Verwenden Sie verwaltete Überschreibungen, statt die Repository-Kopie zu bearbeiten. Legen Sie Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Priorität: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> gebündelt -> `skills.load.extraDirs`. Dadurch haben verwaltete Überschreibungen Vorrang vor gebündelten Skills, ohne Git zu verändern. Um Skills global zu installieren, ihre Sichtbarkeit jedoch auf bestimmte Agenten zu beschränken, bewahren Sie die gemeinsame Kopie in `~/.openclaw/skills` auf und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` / `agents.entries.*.skills`. Nur Änderungen, die für das Upstream-Projekt geeignet sind, sollten als PRs für die Repository-Kopie eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja: Fügen Sie Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität in der oben genannten Reihenfolge). `clawhub` installiert standardmäßig in `./skills`, das OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Um die Sichtbarkeit auf bestimmte Agenten zu beschränken, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.entries.*.skills`.
  </Accordion>

  <Accordion title="Wie kann ich für verschiedene Aufgaben unterschiedliche Modelle oder Einstellungen verwenden?">
    Unterstützte Muster:

    - **Cron-Aufträge**: Isolierte Aufträge können pro Auftrag eine `model`-Überschreibung festlegen.
    - **Agenten**: Leiten Sie Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen, Denkstufen und Streaming-Parametern weiter.
    - **Wechsel bei Bedarf**: `/model` wechselt jederzeit das Modell der aktuellen Sitzung.

    Beispiel – dasselbe Modell mit unterschiedlichen agentenspezifischen Einstellungen:

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

    Legen Sie gemeinsame modellspezifische Standardwerte in `agents.defaults.models["provider/model"].params` ab und anschließend agentenspezifische Überschreibungen im flachen `agents.entries.*.params`. Duplizieren Sie dasselbe Modell nicht unter dem verschachtelten `agents.entries.*.models["provider/model"].params`; dieser Pfad ist für den agentenspezifischen Modellkatalog und Laufzeitüberschreibungen vorgesehen.

    Siehe [Cron-Aufträge](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent), [Konfiguration](/de/gateway/config-agents), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot reagiert bei aufwendigen Aufgaben nicht mehr. Wie kann ich diese auslagern?">
    Verwenden Sie **Sub-Agenten** für lange oder parallele Aufgaben: Sie werden in einer eigenen Sitzung ausgeführt, geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig. Bitten Sie den Bot, „einen Sub-Agenten für diese Aufgabe zu starten“, oder verwenden Sie `/subagents`. Mit `/status` können Sie prüfen, ob das Gateway derzeit ausgelastet ist.

    Sowohl lange Aufgaben als auch Sub-Agenten verbrauchen Tokens; legen Sie über `agents.defaults.subagents.model` ein günstigeres Modell für Sub-Agenten fest, wenn die Kosten relevant sind.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren an Threads gebundene Sub-Agent-Sitzungen auf Discord?">
    Binden Sie einen Discord-Thread an einen Sub-Agenten oder ein Sitzungsziel, damit nachfolgende Nachrichten dort in der gebundenen Sitzung verbleiben.

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (optional `mode: "session"` für dauerhafte Nachfragen).
    - Oder binden Sie ihn manuell mit `/focus <target>`.
    - `/agents` prüft den Bindungsstatus.
    - `/session idle <duration|off>` und `/session max-age <duration|off>` steuern das automatische Aufheben des Fokus.
    - `/unfocus` trennt den Thread.

    Konfiguration: `session.threadBindings.enabled` (globaler Schalter), `session.threadBindings.idleHours` (Standardwert `24`, `0` deaktiviert), `session.threadBindings.maxAgeHours` (Standardwert `0` = keine feste Obergrenze) und `session.threadBindings.spawnSessions` für die automatische Bindung beim Starten (Standardwert `true`).

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent wurde abgeschlossen, aber die Abschlussmeldung wurde an der falschen Stelle oder gar nicht veröffentlicht. Was sollte ich prüfen?">
    Prüfen Sie die aufgelöste Route des Anforderers:

    - Bei der Zustellung von Sub-Agent-Ergebnissen im Abschlussmodus wird ein gebundener Thread oder eine gebundene Konversationsroute bevorzugt, sofern vorhanden.
    - Wenn der Abschlussursprung nur einen Kanal enthält, greift OpenClaw auf die gespeicherte Route der Anforderersitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass die direkte Zustellung weiterhin erfolgreich sein kann.
    - Ohne gebundene Route und ohne nutzbare gespeicherte Route kann die direkte Zustellung fehlschlagen; das Ergebnis wird dann der Warteschlange für die Sitzungszustellung hinzugefügt, statt sofort veröffentlicht zu werden.
    - Ungültige oder veraltete Ziele können ebenfalls einen Rückfall auf die Warteschlange oder ein endgültiges Zustellungsversagen verursachen.
    - Wenn die letzte sichtbare Assistentenantwort des untergeordneten Agenten exakt `NO_REPLY` / `no_reply` oder `ANNOUNCE_SKIP` lautet, unterdrückt OpenClaw die Ankündigung absichtlich, statt einen veralteten früheren Fortschritt zu veröffentlichen.

    Debugging: `openclaw tasks show <lookup>`, wobei `<lookup>` eine Aufgaben-ID, Ausführungs-ID oder ein Sitzungsschlüssel ist.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungswerkzeuge](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron wird innerhalb des Gateway-Prozesses ausgeführt; es wird nicht ausgelöst, wenn das Gateway nicht kontinuierlich ausgeführt wird.

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Bestätigen Sie, dass der Gateway durchgehend ausgeführt wird 24/7 (kein Ruhezustand/keine Neustarts).
    - Überprüfen Sie die Zeitzone des Jobs (`--tz` im Vergleich zur Zeitzone des Hosts).

    Debugging:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber es wurde nichts an den Kanal gesendet. Warum?">
    Überprüfen Sie den Zustellungsmodus:

    - `--no-deliver` / `delivery.mode: "none"`: Es wird kein ersatzweises Senden durch den Runner erwartet.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`): Der Runner hat die ausgehende Zustellung übersprungen.
    - Fehler bei der Kanalauthentifizierung (`unauthorized`, `Forbidden`): Der Runner hat die Zustellung versucht, aber die Anmeldedaten haben sie verhindert.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher wird auch die in die Warteschlange eingereihte Ersatzzustellung unterdrückt.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem Tool `message` senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur die Ersatzzustellung durch den Runner für abschließenden Text, den der Agent nicht bereits selbst gesendet hat.

    Debugging:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einen Wiederholungsversuch durchgeführt?">
    Das ist der Pfad für den Modellwechsel im laufenden Betrieb und keine doppelte Zeitplanung. Isoliertes Cron speichert eine Übergabe des Laufzeitmodells dauerhaft und wiederholt den Versuch, wenn der aktive Lauf `LiveSessionModelSwitchError` auslöst. Dabei werden der gewechselte Provider und das gewechselte Modell (sowie eine etwaige gewechselte Überschreibung des Authentifizierungsprofils) vor dem Wiederholungsversuch beibehalten.

    Priorität der Modellauswahl: zuerst die Modellüberschreibung des Gmail-Hooks (`hooks.gmail.model`), dann `model` pro Job, danach eine gespeicherte Modellüberschreibung der Cron-Sitzung und schließlich die normale Agenten-/Standardmodellauswahl.

    Die Wiederholungsschleife ist auf den ersten Versuch plus 2 Wiederholungsversuche nach einem Wechsel begrenzt; anschließend bricht Cron ab, statt endlos weiterzulaufen.

    Debugging:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Cron-CLI](/de/cli/cron).

  </Accordion>

  <Accordion title="Wie installiere ich Skills unter Linux?">
    Verwenden Sie native `openclaw skills`-Befehle oder legen Sie Skills in Ihrem Arbeitsbereich ab; die macOS-Benutzeroberfläche für Skills ist unter Linux nicht verfügbar. Durchsuchen Sie Skills unter [https://clawhub.ai](https://clawhub.ai).

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

    Native `openclaw skills install` schreibt standardmäßig in das Verzeichnis `skills/` des aktiven Arbeitsbereichs. Fügen Sie `--global` hinzu, um die Installation in das gemeinsam verwaltete Skills-Verzeichnis für alle lokalen Agenten vorzunehmen. Installieren Sie die separate CLI `clawhub` nur, um eigene Skills zu veröffentlichen oder zu synchronisieren. Verwenden Sie `agents.defaults.skills` oder `agents.entries.*.skills`, um einzuschränken, welche Agenten gemeinsame Skills sehen.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach einem Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja, über den Gateway-Zeitplaner:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für regelmäßige Prüfungen der Hauptsitzung.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen veröffentlichen oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation), [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich ausschließlich für Apple macOS vorgesehene Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` und erforderliche Binärdateien eingeschränkt und nur geladen, wenn sie auf dem **Gateway-Host** berechtigt sind. Unter Linux werden ausschließlich für `darwin` vorgesehene Skills (`apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie die Einschränkung nicht überschreiben.

    Drei unterstützte Varianten:

    **Option A – den Gateway auf einem Mac ausführen (am einfachsten)**. Führen Sie den Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und stellen Sie dann von Linux aus im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale eine Verbindung her. Skills werden normal geladen, da der Gateway-Host macOS verwendet.

    **Option B – einen macOS-Node verwenden (ohne SSH)**. Führen Sie den Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf dem Mac auf "Always Ask" oder "Always Allow". OpenClaw behandelt ausschließlich für macOS vorgesehene Skills als berechtigt, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind; der Agent führt sie über das Tool `nodes` aus. Wenn "Always Ask" festgelegt ist, wird durch die Genehmigung von "Always Allow" in der Eingabeaufforderung dieser Befehl zur Positivliste hinzugefügt.

    **Option C – macOS-Binärdateien über SSH weiterleiten (fortgeschritten)**. Lassen Sie den Gateway unter Linux, sorgen Sie jedoch dafür, dass die erforderlichen CLI-Binärdateien in SSH-Wrapper aufgelöst werden, die auf einem Mac ausgeführt werden, und überschreiben Sie anschließend den Skill so, dass Linux zulässig ist und er berechtigt bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Legen Sie den Wrapper auf dem Linux-Host unter `PATH` ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (im Arbeitsbereich oder unter `~/.openclaw/skills`), um Linux zuzulassen:
       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI unter macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Starten Sie eine neue Sitzung, damit die Momentaufnahme der Skills aktualisiert wird.

  </Accordion>

  <Accordion title="Gibt es eine Integration für Notion oder HeyGen?">
    Derzeit nicht integriert. Optionen:

    - **Benutzerdefinierter Skill / benutzerdefiniertes Plugin**: am besten für zuverlässigen API-Zugriff (beide verfügen über APIs).
    - **Browserautomatisierung**: funktioniert ohne Code, ist jedoch langsamer und störungsanfälliger.

    Für einen agenturartigen Kontext pro Kunde: Verwenden Sie eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit) und weisen Sie den Agenten an, diese Seite zu Beginn einer Sitzung abzurufen.

    Für eine native Integration können Sie eine Funktionsanfrage erstellen oder einen Skill auf Grundlage dieser APIs entwickeln.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native Installationen werden im Verzeichnis `skills/` des aktiven Arbeitsbereichs abgelegt; verwenden Sie `--global` für alle lokalen Agenten oder konfigurieren Sie `agents.defaults.skills` / `agents.entries.*.skills`, um die Sichtbarkeit einzuschränken. Einige Skills setzen über Homebrew installierte Binärdateien voraus; unter Linux bedeutet das Linuxbrew.

    Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich meine bestehende angemeldete Chrome-Sitzung mit OpenClaw?">
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

    Dafür kann der Browser des lokalen Hosts oder ein verbundener Browser-Node verwendet werden. Wenn der Gateway an einem anderen Ort ausgeführt wird, führen Sie einen Node-Host auf dem Computer mit dem Browser aus oder verwenden Sie stattdessen Remote-CDP.

    Derzeitige Einschränkungen der Profile `existing-session` / `user` im Vergleich zum verwalteten Profil `openclaw`:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` und `select` erfordern Referenzen aus Momentaufnahmen, keine CSS-Selektoren.
    - Upload-Hooks erfordern `ref` oder `inputRef`, jeweils eine Datei, und unterstützen kein CSS-`element`.
    - `responsebody`, PDF-Export, Abfangen von Downloads und Stapelaktionen erfordern weiterhin den verwalteten Browserpfad.

    Die vollständige Gegenüberstellung finden Sie unter [Browser](/de/tools/browser#existing-session-via-chrome-devtools-mcp).

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Dokumentation zum Sandboxing?">
    Ja: [Sandboxing](/de/gateway/sandboxing). Informationen zur Docker-spezifischen Einrichtung (vollständiger Gateway in Docker oder Sandbox-Images) finden Sie unter [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt – wie aktiviere ich den vollständigen Funktionsumfang?">
    Das Standard-Image priorisiert Sicherheit und wird als Benutzer `node` ausgeführt. Daher enthält es keine Systempakete, kein Homebrew und keine gebündelten Browser. Für eine umfassendere Einrichtung:

    - Machen Sie `/home/node` mit `OPENCLAW_HOME_VOLUME` persistent, damit Caches erhalten bleiben.
    - Integrieren Sie Systemabhängigkeiten mit `OPENCLAW_IMAGE_APT_PACKAGES` in das Image.
    - Installieren Sie Playwright-Browser über die gebündelte CLI: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Legen Sie `PLAYWRIGHT_BROWSERS_PATH` fest und machen Sie diesen Pfad persistent.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich Direktnachrichten persönlich halten, aber Gruppen mit einem Agenten öffentlich bzw. in einer Sandbox ausführen?">
    Ja, wenn der private Datenverkehr aus **Direktnachrichten** und der öffentliche Datenverkehr aus **Gruppen** besteht. Legen Sie `agents.defaults.sandbox.mode: "non-main"` fest, damit Gruppen-/Kanalsitzungen (Schlüssel, die nicht zur Hauptsitzung gehören) im konfigurierten Sandbox-Backend ausgeführt werden, während die Hauptsitzung für Direktnachrichten auf dem Host verbleibt. Docker ist das Standard-Backend, sobald Sandboxing aktiviert ist. Beschränken Sie die in Sandbox-Sitzungen verfügbaren Tools über `tools.sandbox.tools`.

    Einrichtungsanleitung: [Gruppen: persönliche Direktnachrichten + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent). Wichtige Referenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:container:mode"]` (zum Beispiel `"/home/user/src:/src:ro"`). Globale und agentenspezifische Einbindungen werden zusammengeführt; agentenspezifische Einbindungen werden ignoriert, wenn `scope: "shared"`. Verwenden Sie `:ro` für alle sensiblen Daten; Einbindungen umgehen die Dateisystemgrenzen der Sandbox.

    OpenClaw validiert die Quellen von Einbindungen sowohl anhand des normalisierten Pfads als auch anhand des kanonischen Pfads, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Dadurch werden Ausbrüche über übergeordnete symbolische Verknüpfungen nach dem Fail-Closed-Prinzip verhindert, selbst wenn das letzte Pfadsegment noch nicht vorhanden ist.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox im Vergleich zu Tool-Richtlinie und erhöhten Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Wie funktioniert der Speicher?">
    Der OpenClaw-Speicher besteht aus Markdown-Dateien im Arbeitsbereich des Agenten: tägliche Notizen in `memory/YYYY-MM-DD.md`, kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen).

    OpenClaw führt außerdem vor der Compaction eine stille **Speicherleerung vor der Compaction** aus, bevor die Compaction die Unterhaltung zusammenfasst. Dadurch wird das Modell daran erinnert, zuerst dauerhafte Notizen zu speichern. Sie wird nur ausgeführt, wenn der Arbeitsbereich beschreibbar ist (schreibgeschützte Sandboxes überspringen sie); deaktivieren Sie sie mit `agents.defaults.compaction.memoryFlush.enabled: false`. Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Der Speicher vergisst ständig Dinge. Wie kann ich dafür sorgen, dass sie erhalten bleiben?">
    Weisen Sie den Bot an, **die Information in den Speicher zu schreiben**: Langzeitnotizen werden in `MEMORY.md`, kurzfristiger Kontext in `memory/YYYY-MM-DD.md` gespeichert. Das Modell daran zu erinnern, Erinnerungen zu speichern, behebt das Problem normalerweise. Wenn es weiterhin Dinge vergisst, überprüfen Sie, ob der Gateway bei jedem Lauf denselben Arbeitsbereich verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agentenarbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt der Speicher dauerhaft bestehen? Welche Grenzen gibt es?">
    Speicherdateien befinden sich auf der Festplatte und bleiben erhalten, bis sie gelöscht werden; die Grenze bildet Ihr Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells begrenzt, sodass lange Unterhaltungen komprimiert oder gekürzt werden können – deshalb gibt es die Speichersuche, die nur die relevanten Teile wieder in den Kontext lädt.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden, den standardmäßigen Provider. Codex OAuth deckt Chat/Completions ab und gewährt **keinen** Zugriff auf Embeddings. Daher aktiviert die Anmeldung mit Codex (über OAuth oder die Anmeldung der Codex CLI) nicht die semantische Speichersuche. OpenAI-Embeddings benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Für eine rein lokale Nutzung legen Sie `memory.search.provider: "local"` (GGUF/llama.cpp) fest. Weitere unterstützte Provider: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` oder `memory.search.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI-kompatible Provider und Voyage. Einzelheiten zur Einrichtung finden Sie unter [Speicher](/de/concepts/memory) und [Speichersuche](/de/concepts/memory-search).

  </Accordion>
</AccordionGroup>

## Speicherorte auf der Festplatte

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein: **Der eigene Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal**: Sitzungen, Speicherdateien, Konfiguration und Arbeitsbereich befinden sich auf dem Gateway-Host (`~/.openclaw` sowie Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote**: An Modell-Provider (Anthropic/OpenAI usw.) gesendete Nachrichten werden an deren APIs übermittelt, und Chatplattformen (Slack/Telegram/WhatsApp usw.) speichern Nachrichtendaten auf ihren Servern.
    - **Sie bestimmen den Umfang**: Lokale Modelle behalten Prompts auf Ihrem Rechner, der Kanalverkehr läuft jedoch weiterhin über die Server des jeweiligen Kanals.

    Weitere Informationen: [Agentenarbeitsbereich](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles befindet sich unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                               | Zweck                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Hauptkonfiguration (JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Veralteter OAuth-Import (wird bei der ersten Verwendung in Authentifizierungsprofile kopiert)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Authentifizierungsprofile (OAuth, API-Schlüssel, optional `keyRef`/`tokenRef`)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Optionale dateibasierte Secret-Nutzlast für `file`-SecretRef-Provider   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Veraltete Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Provider-Zustand (zum Beispiel `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Agentenspezifischer Zustand (agentDir sowie veraltete/archivierte Sitzungsartefakte)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Agentenspezifischer SQLite-Zustand einschließlich Sitzungszeilen und Transkripten      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Quellen für die Migration veralteter Sitzungen sowie Archiv-/Supportartefakte      |

    Der veraltete Einzelagentenpfad `~/.openclaw/agent/*` wird durch `openclaw doctor` migriert.

    Ihr **Arbeitsbereich** (AGENTS.md, Speicherdateien, Skills usw.) ist davon getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten sich AGENTS.md / SOUL.md / USER.md / MEMORY.md befinden?">
    Diese Dateien befinden sich im **Agentenarbeitsbereich**, nicht unter `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`. Die kleingeschriebene Stammdatei `memory.md` dient nur als Eingabe für die Reparatur veralteter Daten; `openclaw doctor --fix` kann sie mit `MEMORY.md` zusammenführen, wenn beide vorhanden sind.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Authentifizierungsprofile, Sitzungen, Protokolle, gemeinsam genutzte Skills (`~/.openclaw/skills`).

    Der standardmäßige Arbeitsbereich ist `~/.openclaw/workspace` und kann konfiguriert werden:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart etwas „vergisst“, prüfen Sie, ob das Gateway bei jedem Start denselben Arbeitsbereich verwendet (im Remote-Modus wird der Arbeitsbereich des **Gateway-Hosts** verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Bitten Sie den Bot bei dauerhaft gewünschtem Verhalten oder dauerhaften Präferenzen, diese **in AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chatverlauf zu verlassen.

    Siehe [Agentenarbeitsbereich](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Kann ich SOUL.md vergrößern?">
    Ja. `SOUL.md` ist eine der Bootstrap-Dateien des Arbeitsbereichs, die in den Agentenkontext eingefügt werden. Die standardmäßige Einfügungsgrenze pro Datei beträgt `20000` Zeichen; das gesamte Bootstrap-Budget für alle Dateien beträgt `60000` Zeichen.

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

    Oder überschreiben Sie einen einzelnen Agenten unter `agents.entries.*.bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Verwenden Sie `/context`, um die Rohgröße mit der eingefügten Größe zu vergleichen und festzustellen, ob eine Kürzung erfolgt ist. Beschränken Sie `SOUL.md` auf Stimme, Haltung und Persönlichkeit; legen Sie Betriebsregeln in `AGENTS.md` und dauerhafte Fakten im Speicher ab.

    Siehe [Kontext](/de/concepts/context) und [Agentenkonfiguration](/de/gateway/config-agents).

  </Accordion>

  <Accordion title="Empfohlene Sicherungsstrategie">
    Legen Sie Ihren **Agentenarbeitsbereich** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem privaten Ort (zum Beispiel in einem privaten GitHub-Repository). Dadurch werden der Speicher sowie die Dateien AGENTS/SOUL/USER erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Token, verschlüsselte Secret-Nutzlasten). Sichern Sie für eine vollständige Wiederherstellung den Arbeitsbereich und das Zustandsverzeichnis getrennt.

    Dokumentation: [Agentenarbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **standardmäßige Arbeitsverzeichnis** und der Speicheranker, keine strikte Sandbox. Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst; absolute Pfade können auf andere Orte des Hosts zugreifen, sofern Sandboxing nicht aktiviert ist. Verwenden Sie zur Isolation [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Damit ein Repository zum standardmäßigen Arbeitsverzeichnis wird, richten Sie `workspace` dieses Agenten auf das Stammverzeichnis des Repositorys – das OpenClaw-Repository selbst enthält lediglich Quellcode. Halten Sie den Arbeitsbereich daher davon getrennt, sofern der Agent nicht absichtlich darin arbeiten soll.

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
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`). Wenn die Datei fehlt, verwendet OpenClaw einigermaßen sichere Standardwerte, darunter `~/.openclaw/workspace` als Standardarbeitsbereich.
  </Accordion>

  <Accordion title='Ich habe gateway.bind auf "lan" (oder "tailnet") gesetzt, und jetzt lauscht nichts mehr / die Benutzeroberfläche meldet „nicht autorisiert“'>
    Bindungen außerhalb der Loopback-Schnittstelle **erfordern einen gültigen Gateway-Authentifizierungspfad**: Authentifizierung mit einem gemeinsamen Secret (Token oder Passwort) oder `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Reverse-Proxy.

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

    - `gateway.remote.token` / `.password` aktivieren die lokale Gateway-Authentifizierung **nicht** von selbst; lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Legen Sie für die Passwortauthentifizierung `gateway.auth.mode: "password"` zusammen mit `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`) fest.
    - Wenn `gateway.auth.token` / `.password` explizit über SecretRef konfiguriert ist und nicht aufgelöst werden kann, schlägt die Auflösung sicher geschlossen fehl (kein verschleiernder Remote-Fallback).
    - Control-UI-Konfigurationen mit gemeinsamem Secret authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (in den App-/UI-Einstellungen gespeichert). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Anfrage-Header – vermeiden Sie gemeinsame Secrets in URLs.
    - Bei `gateway.auth.mode: "trusted-proxy"` erfordern Loopback-Reverse-Proxys auf demselben Host ein explizites `gateway.auth.trustedProxy.allowLoopback = true` und einen Loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum benötige ich jetzt auf localhost einen Token?">
    OpenClaw erzwingt standardmäßig die Gateway-Authentifizierung, einschließlich Loopback. Wenn kein expliziter Authentifizierungspfad konfiguriert ist, wird beim Start der Token-Modus verwendet und für diesen Start ein nur zur Laufzeit gültiger Token generiert. Daher müssen sich lokale WS-Clients authentifizieren. Dadurch werden andere lokale Prozesse daran gehindert, das Gateway aufzurufen.

    Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients über Neustarts hinweg ein stabiles Secret benötigen. Sie können auch den Passwortmodus oder `trusted-proxy` für identitätsbewusste Reverse-Proxys auswählen. Legen Sie für einen offenen Loopback-Zugriff `gateway.auth.mode: "none"` explizit fest. `openclaw doctor --generate-gateway-token` generiert jederzeit einen Token.

  </Accordion>

  <Accordion title="Muss ich OpenClaw nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload: `gateway.reload.mode: "hybrid"` (Standard) wendet sichere Änderungen im laufenden Betrieb an und führt bei kritischen Änderungen einen Neustart durch. `hot`, `restart` und `off` werden ebenfalls unterstützt. Die meisten Änderungen an `tools.*`, der Richtlinie `agents.*`, `session.*` und `messages.*` werden sofort angewendet, ohne dass überhaupt ein Neuladevorgang erforderlich ist; Änderungen an Bindung/Port von `gateway.*` erfordern einen Neustart.
  </Accordion>

  <Accordion title="Wie aktiviere ich die Websuche (und den Webabruf)?">
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
    | Ollama Web Search | Ja (benötigt `ollama signin`) | - |
    | Perplexity | Nein | `PERPLEXITY_API_KEY` oder `OPENROUTER_API_KEY` |
    | SearXNG | Ja (selbst gehostet) | `SEARXNG_BASE_URL` |
    | Tavily | Nein | `TAVILY_API_KEY` |

    Grok kann außerdem xAI OAuth aus der Modellauthentifizierung wiederverwenden (`openclaw onboard --auth-choice xai-oauth`).

    **Empfohlen**: `openclaw configure --section web` und wählen Sie einen Provider aus.

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
            provider: "firecrawl", // optional; für automatische Erkennung weglassen
          },
        },
      },
    }
    ```

    Die providerspezifische Websuchkonfiguration befindet sich unter `plugins.entries.<plugin>.config.webSearch.*`. Ältere Providerpfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen weiterhin geladen, sollten aber nicht in neuen Konfigurationen verwendet werden. Die Firecrawl-Fallback-Konfiguration für den Webabruf befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    - Zulassungslisten: Fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` für alle drei hinzu.
    - `web_fetch` ist standardmäßig aktiviert.
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw anhand der verfügbaren Zugangsdaten automatisch den ersten einsatzbereiten Fallback-Provider für den Abruf; das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Dienstumgebung).

    Dokumentation: [Webtools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie kann ich sie wiederherstellen und dies vermeiden?">
    `config.apply` ersetzt die **gesamte Konfiguration**; ein unvollständiges Objekt entfernt alles Übrige.

    Die aktuelle OpenClaw-Version schützt vor den meisten versehentlichen Überschreibungen:

    - Von OpenClaw vorgenommene Konfigurationsänderungen validieren vor dem Schreiben die vollständige resultierende Konfiguration.
    - Ungültige oder destruktive, von OpenClaw vorgenommene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Eine direkte Bearbeitung, die den Start oder das Hot-Reload verhindert, führt dazu, dass das Gateway den Vorgang sicher abbricht oder das Neuladen überspringt; `openclaw.json` wird dabei nicht neu geschrieben.
    - `openclaw doctor --fix` ist für die Reparatur zuständig, kann die letzte als funktionsfähig bekannte Version wiederherstellen und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.

    Wiederherstellung:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Prüfen Sie die neueste Datei `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie mit `openclaw config set` oder `config.patch` nur die gewünschten Schlüssel zurück.
    - Wenn weder eine letzte als funktionsfähig bekannte Version noch abgelehnte Nutzdaten vorhanden sind, stellen Sie eine Sicherung wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle und Modelle neu.
    - Bei unerwartetem Verlust melden Sie einen Fehler und fügen Sie Ihre letzte bekannte Konfiguration oder eine Sicherung bei. Ein lokaler Programmieragent kann häufig anhand von Protokollen oder des Verlaufs eine funktionsfähige Konfiguration rekonstruieren.

    So vermeiden Sie dies: Verwenden Sie `openclaw config set` für kleine Änderungen, `openclaw configure` für interaktive Bearbeitungen, `config.schema.lookup` zum Prüfen eines unbekannten Pfads (gibt einen flachen Schemaknoten sowie Zusammenfassungen der unmittelbar untergeordneten Elemente zurück) und `config.patch` für partielle RPC-Bearbeitungen. Reservieren Sie `config.apply` für das Ersetzen der vollständigen Konfiguration. Das agentenseitige Laufzeittool `gateway` verweigert selbst über ältere `tools.bash.*`-Aliasse das Neuschreiben von `tools.exec.ask` / `tools.exec.security`.

    Dokumentation: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern auf mehreren Geräten?">
    Gängiges Muster: **ein Gateway** (beispielsweise ein Raspberry Pi) sowie **Nodes** und **Agenten**.

    - **Gateway (zentral)**: Verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte)**: Macs sowie iOS- und Android-Geräte stellen als Peripheriegeräte eine Verbindung her und bieten lokale Tools (`system.run`, `canvas`, `camera`) an.
    - **Agenten (Worker)**: Separate Denk- und Arbeitsbereiche für besondere Rollen (beispielsweise Betrieb und persönliche Daten).
    - **Unteragenten**: Starten Hintergrundarbeit von einem Hauptagenten aus, um Aufgaben parallel auszuführen.
    - **TUI**: Stellt eine Verbindung zum Gateway her und ermöglicht den Wechsel zwischen Agenten und Sitzungen.

    Dokumentation: [Nodes](/de/nodes), [Fernzugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Unteragenten](/de/tools/subagents), [TUI](/de/web/tui).

  </Accordion>

  <Accordion title="Kann der OpenClaw-Browser headless ausgeführt werden?">
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

    Standardmäßig ist `false` eingestellt (mit sichtbarer Oberfläche). Der Headless-Modus löst auf einigen Websites mit höherer Wahrscheinlichkeit Anti-Bot-Prüfungen aus (X/Twitter blockiert häufig Headless-Sitzungen). Er verwendet dieselbe Chromium-Engine und eignet sich für die meisten Automatisierungen; der Hauptunterschied besteht darin, dass kein Browserfenster sichtbar ist (verwenden Sie Screenshots für die visuelle Darstellung). Siehe [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie das Gateway neu. Siehe [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Entfernte Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergeleitet?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet, das den Agenten ausführt und erst danach Nodes über den **Gateway-WebSocket** aufruft, wenn ein Node-Tool benötigt wird:

    Telegram -> Gateway -> Agent -> `node.*` -> Node -> Gateway -> Telegram

    Nodes sehen keinen eingehenden Provider-Datenverkehr; sie empfangen ausschließlich Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway entfernt gehostet wird?">
    Koppeln Sie Ihren Computer als **Node**. Das Gateway wird an einem anderen Ort ausgeführt, kann jedoch über den Gateway-WebSocket `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Computer aufrufen.

    1. Führen Sie das Gateway auf dem permanent eingeschalteten Host aus (VPS/Heimserver).
    2. Nehmen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet auf.
    3. Stellen Sie sicher, dass der Gateway-WebSocket erreichbar ist (Bindung an das Tailnet oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und stellen Sie im Modus **Remote over SSH** (oder direkt über das Tailnet) eine Verbindung her, damit sie als Node registriert wird.
    5. Genehmigen Sie den Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Eine separate TCP-Bridge ist nicht erforderlich; Nodes stellen die Verbindung über den Gateway-WebSocket her.

    Sicherheitshinweis: Durch das Koppeln eines macOS-Nodes wird `system.run` auf diesem Computer ermöglicht. Koppeln Sie nur Geräte, denen Sie vertrauen, und lesen Sie den Abschnitt [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was nun?">
    Prüfen Sie zunächst die Grundlagen:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Überprüfen Sie anschließend die Authentifizierung und das Routing: Wenn Sie Tailscale Serve verwenden, vergewissern Sie sich, dass `gateway.auth.allowTailscale` korrekt gesetzt ist. Wenn Sie die Verbindung über einen SSH-Tunnel herstellen, prüfen Sie, ob der Tunnel aktiv ist und auf den richtigen Port verweist. Vergewissern Sie sich außerdem, dass Ihr Konto in den Zulassungslisten für Direktnachrichten und Gruppen enthalten ist.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Fernzugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander kommunizieren (lokal + VPS)?">
    Ja, allerdings gibt es keine integrierte Bot-zu-Bot-Bridge.

    **Am einfachsten**: Verwenden Sie einen normalen Chatkanal, auf den beide Bots zugreifen können (Slack/Telegram/WhatsApp). Lassen Sie Bot A eine Nachricht an Bot B senden, woraufhin Bot B wie gewohnt antwortet.

    **CLI-Bridge (generisch)**: Führen Sie ein Skript aus, das das andere Gateway mit `openclaw agent --message ... --deliver` aufruft und dabei einen Chat angibt, in dem der andere Bot Nachrichten empfängt. Wenn sich ein Bot auf einem entfernten VPS befindet, richten Sie Ihre CLI über SSH/Tailscale auf dieses entfernte Gateway aus (siehe [Fernzugriff](/de/gateway/remote)):

    ```bash
    openclaw agent --message "Hallo vom lokalen Bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Fügen Sie eine Schutzmaßnahme hinzu, damit die beiden Bots keine Endlosschleife erzeugen (nur auf Erwähnungen reagieren, Kanal-Zulassungslisten oder eine Regel wie „Nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Fernzugriff](/de/gateway/remote), [Agenten-CLI](/de/cli/agent), [Agentenversand](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Benötige ich für mehrere Agenten separate VPS-Instanzen?">
    Nein. Ein Gateway hostet mehrere Agenten, jeweils mit eigenem Arbeitsbereich, eigenen Modellstandards und eigenem Routing. Dies ist die übliche Einrichtung und wesentlich günstiger und einfacher als ein VPS pro Agent. Verwenden Sie separate VPS-Instanzen nur für eine strikte Isolation (Sicherheitsgrenzen) oder für stark unterschiedliche Konfigurationen, die nicht gemeinsam genutzt werden sollen.
  </Accordion>

  <Accordion title="Bietet ein Node auf meinem persönlichen Laptop Vorteile gegenüber SSH von einem VPS aus?">
    Ja: Nodes sind die bevorzugte Möglichkeit, über ein entferntes Gateway auf Ihren Laptop zuzugreifen, und bieten mehr als reinen Shell-Zugriff. Das Gateway läuft unter macOS/Linux (Windows über WSL2) und ist ressourcenschonend (ein kleiner VPS oder ein System der Raspberry-Pi-Klasse genügt; 4 GB RAM sind ausreichend). Eine gängige Einrichtung besteht daher aus einem permanent eingeschalteten Host und Ihrem Laptop als Node.

    - **Kein eingehender SSH-Zugriff erforderlich** – Nodes stellen über die Gerätekopplung ausgehend eine Verbindung zum Gateway-WebSocket her.
    - **Sicherere Ausführungssteuerung** – `system.run` wird auf diesem Laptop durch Node-Zulassungslisten und Genehmigungen beschränkt.
    - **Mehr Gerätetools** – Zusätzlich zu `system.run` stellen Nodes `canvas`, `camera` und `screen` bereit.
    - **Lokale Browserautomatisierung** – Betreiben Sie das Gateway auf einem VPS, führen Sie Chrome jedoch lokal über einen Node-Host aus, oder stellen Sie über Chrome MCP eine Verbindung zu einer lokalen Chrome-Instanz her.

    SSH eignet sich für gelegentlichen Shell-Zugriff; Nodes sind für fortlaufende Agenten-Workflows und Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** ausgeführt werden, sofern Sie nicht bewusst isolierte Profile betreiben (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die eine Verbindung zum Gateway herstellen (iOS-/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Informationen zu Headless-Node-Hosts und zur CLI-Steuerung finden Sie unter [Node-Host-CLI](/de/cli/node).

    Für `gateway`, `discovery` und Änderungen an gehosteten Plugin-Oberflächen ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit zum Anwenden der Konfiguration?">
    Ja:

    - `config.schema.lookup`: Prüft vor dem Schreiben einen Konfigurationsunterbaum mit seinem flachen Schemaknoten, dem zugehörigen UI-Hinweis und Zusammenfassungen der unmittelbar untergeordneten Elemente.
    - `config.get`: Ruft den aktuellen Snapshot einschließlich Hash ab.
    - `config.patch`: Sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); führt nach Möglichkeit ein Hot-Reload und bei Bedarf einen Neustart durch.
    - `config.apply`: Validiert und ersetzt die vollständige Konfiguration; führt nach Möglichkeit ein Hot-Reload und bei Bedarf einen Neustart durch.
    - Das agentenseitige Laufzeittool `gateway` verweigert weiterhin das Neuschreiben von `tools.exec.ask` / `tools.exec.security`; ältere `tools.bash.*`-Aliasse werden auf dieselben geschützten Pfade normalisiert.

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

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und stelle von meinem Mac eine Verbindung her?">
    1. **Auf dem VPS installieren und anmelden**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Auf Ihrem Mac installieren und anmelden** – mit der Tailscale-App im selben Tailnet.
    3. **MagicDNS aktivieren** – in der Tailscale-Administrationskonsole, damit der VPS einen stabilen Namen erhält.
    4. **Den Tailnet-Hostnamen verwenden**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; Gateway-WS `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Für die Control UI ohne SSH verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an die Loopback-Schnittstelle gebunden und HTTPS wird über Tailscale bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI und WS** bereit; Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    1. Stellen Sie sicher, dass sich VPS und Mac im selben Tailnet befinden.
    2. Verwenden Sie die macOS-App im Remote-Modus (das SSH-Ziel kann der Tailnet-Hostname sein) – sie tunnelt den Gateway-Port und verbindet sich als Node.
    3. Genehmigen Sie den Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Erkennung](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich OpenClaw auf einem zweiten Laptop installieren oder nur einen Node hinzufügen?">
    Für **ausschließlich lokale Tools** (Bildschirm/Kamera/Exec) auf dem zweiten Laptop fügen Sie ihn als **Node** hinzu – ein Gateway, keine duplizierte Konfiguration. Lokale Node-Tools sind derzeit nur unter macOS verfügbar. Installieren Sie ein zweites Gateway nur für **strikte Isolation** oder zwei vollständig getrennte Bots.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und Laden von .env

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis.
    - einen globalen Fallback `.env` aus `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Keine der beiden `.env`-Dateien überschreibt vorhandene Umgebungsvariablen. Eine Ausnahme bilden Schlüssel für Provider-Zugangsdaten und Endpunkt-Routing in der Workspace-Datei `.env`: Schlüssel wie `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` oder alle auf `_ENDPOINT` endenden Schlüssel (sowie andere Authentifizierungs- oder Endpunkt-Umgebungsvariablen gebündelter Provider) werden aus der Workspace-Datei `.env` ignoriert und sollten in der Prozessumgebung, in `~/.openclaw/.env` oder in der Konfiguration `env` hinterlegt werden.

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

    1. Hinterlegen Sie die fehlenden Schlüssel in `~/.openclaw/.env`, damit sie auch geladen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
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
       Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (vorhandene werden niemals überschrieben). Entsprechende Umgebungsvariablen: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt „Shell env: off.“ Warum?'>
    `openclaw models status` gibt an, ob der **Shell-Umgebungsimport** aktiviert ist. „Shell env: off“ bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen – es bedeutet lediglich, dass OpenClaw Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst ausgeführt wird (launchd/systemd), erbt es Ihre Shell-Umgebung nicht. Hinterlegen Sie das Token zur Behebung in `~/.openclaw/.env`, aktivieren Sie `env.shellEnv.enabled: true` oder fügen Sie es der Konfiguration `env` hinzu (wird nur angewendet, wenn es fehlt). Starten Sie anschließend das Gateway neu und prüfen Sie den Status erneut:

    ```bash
    openclaw models status
    ```

    Copilot-Token werden in dieser Reihenfolge aufgelöst: `OPENCLAW_GITHUB_TOKEN`, dann `COPILOT_GITHUB_TOKEN`, dann `GH_TOKEN`, dann `GITHUB_TOKEN`.

    Siehe [/concepts/model-providers](/de/concepts/model-providers) und [/environment](/de/help/environment).

  </Accordion>
</AccordionGroup>

## Sitzungen und mehrere Chats

<AccordionGroup>
  <Accordion title="Wie beginne ich eine neue Unterhaltung?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Nein, standardmäßig nicht. Sitzungen behalten dieselbe `sessionId`, und Compaction begrenzt den aktiven Modellkontext, während Unterhaltungen länger werden. `/new` und `/reset` bleiben verfügbar. Alternativ können Sie automatische Zurücksetzungen mit `mode: "daily"` oder `mode: "idle"` aktivieren. Der tägliche Modus wechselt auf dem Gateway-Host um `session.reset.atHour` (Standard `4`, 0-23); der Inaktivitätsmodus verwendet `session.reset.idleMinutes` seit der letzten echten Interaktion, nicht seit Heartbeat-/Cron-/Exec-Systemereignissen.

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

    `resetByType` unterstützt `direct`, `group` und `thread`. Doctor migriert veraltete `dm`-Einträge zu `direct`; das Schema lehnt `dm` ab. Das veraltete `session.idleMinutes` auf oberster Ebene funktioniert weiterhin als Kompatibilitätsalias für einen Standardwert im Inaktivitätsmodus, wenn kein `session.reset`-/`resetByType`-Block festgelegt ist. Den vollständigen Lebenszyklus finden Sie unter [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title="Kann ich ein Team aus OpenClaw-Instanzen erstellen (einen CEO und viele Agenten)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agenten**: einen koordinierenden Agenten sowie mehrere Arbeitsagenten mit eigenen Workspaces und Modellen.

    Dies ist am besten als interessantes Experiment zu betrachten – es verbraucht viele Token und ist häufig weniger effizient als ein Bot mit getrennten Sitzungen. Das typische Modell besteht aus einem Bot, mit dem Sie kommunizieren, verschiedenen Sitzungen für parallele Arbeit und bei Bedarf gestarteten Sub-Agenten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agenten-CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe gekürzt? Wie kann ich das verhindern?">
    Der Sitzungskontext wird durch das Kontextfenster des Modells begrenzt. Lange Chats, umfangreiche Tool-Ausgaben oder viele Dateien können Compaction oder Kürzung auslösen.

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

    Vollständige nicht interaktive Zurücksetzung:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Das Onboarding bietet außerdem **Zurücksetzen** an, wenn es eine vorhandene Konfiguration erkennt; siehe [Onboarding (CLI)](/de/start/wizard). Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes Zustandsverzeichnis zurück (Standard `~/.openclaw-<profile>`). Nur für die Entwicklung vorgesehene Zurücksetzung: `openclaw gateway --dev --reset` löscht Entwicklungskonfiguration, Zugangsdaten, Sitzungen und Workspace.

  </Accordion>

  <Accordion title='Ich erhalte „context too large“-Fehler – wie kann ich zurücksetzen oder eine Compaction durchführen?'>
    - **Compaction** (behält die Unterhaltung bei und fasst ältere Gesprächsrunden zusammen): `/compact` oder `/compact <instructions>`, um die Zusammenfassung anzuleiten.
    - **Zurücksetzen** (neue Sitzungs-ID für denselben Chat-Schlüssel): `/new` oder `/reset`.

    Wenn dies weiterhin auftritt, passen Sie die **Sitzungsbereinigung** (`agents.defaults.contextPruning`) an, um alte Tool-Ausgaben zu kürzen, oder verwenden Sie ein Modell mit einem größeren Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Sitzungsbereinigung](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum wird „LLM request rejected: messages.content.tool_use.input field required“ angezeigt?'>
    Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche `input` ausgegeben. Dies bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (häufig nach langen Threads oder einer Tool-/Schemaänderung).

    Lösung: Beginnen Sie mit `/new` eine neue Sitzung (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum erhalte ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats werden standardmäßig alle **30m** ausgeführt oder alle **1h**, wenn der ermittelte Authentifizierungsmodus Anthropic-OAuth-/Token-Authentifizierung verwendet (einschließlich der Wiederverwendung der Claude-CLI) und `heartbeat.every` nicht gesetzt ist. Passen Sie das Intervall an oder deaktivieren Sie Heartbeats:

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

    Wenn `HEARTBEAT.md` vorhanden, aber effektiv leer ist (nur Leerzeilen, Markdown-/HTML-Kommentare, ATX-Überschriften, Fence-Markierungen oder leere Listenelement-Platzhalter), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe zu sparen. Wenn die Datei fehlt, wird der Heartbeat dennoch ausgeführt und das Modell entscheidet, was zu tun ist.

    Agentenspezifische Überschreibungen verwenden `agents.entries.*.heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einer WhatsApp-Gruppe ein „Bot-Konto“ hinzufügen?'>
    Nein. OpenClaw wird mit **Ihrem eigenen Konto** ausgeführt – wenn Sie Mitglied der Gruppe sind, kann OpenClaw sie sehen. Standardmäßig sind Gruppenantworten blockiert, bis Sie Absender zulassen (`groupPolicy: "allowlist"`).

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

  <Accordion title="Wie erhalte ich die JID einer WhatsApp-Gruppe?">
    Am schnellsten geht es, indem Sie die Logs fortlaufend anzeigen und eine Testnachricht in der Gruppe senden.

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`) mit der Endung `@g.us`, beispielsweise `1234567890-1234567890@g.us`.

    Wenn die Gruppe bereits konfiguriert oder in der Zulassungsliste enthalten ist, listen Sie die Gruppen aus der Konfiguration auf:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Verzeichnis](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen: Die Erwähnungsbeschränkung ist standardmäßig aktiviert (Sie müssen den Bot mit @ erwähnen oder `mentionPatterns` erfüllen), oder Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe befindet sich nicht in der Zulassungsliste.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads ihren Kontext mit Direktnachrichten?">
    Direkte Chats werden standardmäßig in der Hauptsitzung zusammengeführt. Gruppen/Kanäle haben eigene Sitzungsschlüssel, und Telegram-Themen bzw. Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Es gibt keine festen Grenzen – Dutzende oder sogar Hunderte sind möglich, achten Sie jedoch auf:

    - **Speicherplatzwachstum**: Aktive Sitzungen und Transkripte befinden sich in der agentenspezifischen SQLite-Datenbank; Legacy-/Archivartefakte können sich weiterhin unter `~/.openclaw/agents/<agentId>/sessions/` ansammeln.
    - **Token-Kosten**: Mehr Agenten bedeuten eine höhere gleichzeitige Modellnutzung.
    - **Betriebsaufwand**: agentenspezifische Authentifizierungsprofile, Arbeitsbereiche und Kanal-Routing.

    Behalten Sie pro Agent einen **aktiven** Arbeitsbereich (`agents.defaults.workspace`) bei, bereinigen Sie alte Sitzungen mit `openclaw sessions cleanup`, wenn der Speicherbedarf wächst (bearbeiten Sie den aktiven SQLite-Zustand nicht manuell), und verwenden Sie `openclaw doctor`, um verwaiste Arbeitsbereiche und nicht übereinstimmende Profile zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja, über **Multi-Agent-Routing**: Führen Sie mehrere isolierte Agenten aus und leiten Sie eingehende Nachrichten nach Kanal/Konto/Gegenstelle weiter. Slack wird als Kanal unterstützt und kann bestimmten Agenten zugeordnet werden.

    Der Browserzugriff ist leistungsfähig, kann aber nicht „alles tun, was ein Mensch kann“ – Anti-Bot-Maßnahmen, CAPTCHAs und MFA können die Automatisierung weiterhin blockieren. Für eine möglichst zuverlässige Steuerung verwenden Sie lokales Chrome MCP auf dem Host oder CDP auf dem Rechner, auf dem der Browser tatsächlich ausgeführt wird.

    Empfohlene Einrichtung: ein ständig verfügbarer Gateway-Host (VPS/Mac mini), ein Agent pro Rolle (Zuordnungen), diesen Agenten zugeordnete Slack-Kanäle und bei Bedarf ein lokaler Browser über Chrome MCP oder eine Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack), [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Authentifizierungsprofile

Fragen und Antworten zu Modellen – Standardwerte, Auswahl, Aliasse, Wechsel, Failover und Authentifizierungsprofile – finden Sie in den [Modell-FAQ](/de/help/faq-models).

## Gateway: Ports, „bereits ausgeführt“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen Multiplex-Port für WebSocket + HTTP (Control UI, Hooks usw.). Priorität:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standardwert 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status „Runtime: running“, aber „Connectivity probe: failed“?'>
    „Running“ ist die Sicht des **Supervisors** (launchd/systemd/schtasks); bei der Konnektivitätsprüfung stellt die CLI tatsächlich eine Verbindung zum Gateway-WebSocket her. Maßgeblich sind diese Zeilen aus `openclaw gateway status`: `Probe target:` (die von der Prüfung verwendete URL), `Listening:` (was tatsächlich an den Port gebunden ist), `Last gateway error:` (häufige Ursache, wenn der Prozess aktiv ist, der Port aber nicht lauscht).
  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für „Config (cli)“ und „Config (service)“ an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere verwendet (häufig stimmt `--profile` nicht mit `OPENCLAW_STATE_DIR` überein).

    Führen Sie zur Behebung den folgenden Befehl mit derselben `--profile` / Umgebung aus, die der Dienst verwenden soll:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='Was bedeutet „another gateway instance is already listening“?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem der WebSocket-Listener unmittelbar beim Start gebunden wird (standardmäßig `ws://127.0.0.1:18789`). Wenn die Bindung mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` („another gateway instance is already listening“) ausgelöst.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder führen Sie OpenClaw mit `openclaw gateway --port <port>` aus.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (der Client verbindet sich mit einem anderen Gateway)?">
    Setzen Sie `gateway.mode: "remote"` und geben Sie eine Remote-WebSocket-URL an, optional mit Remote-Anmeldedaten für ein gemeinsames Geheimnis:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` den Wert `local` hat (oder Sie ein Überschreibungs-Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt bei Änderungen dieser Werte im laufenden Betrieb den Modus.
    - `gateway.remote.token` / `.password` sind ausschließlich clientseitige Remote-Anmeldedaten; sie aktivieren nicht selbstständig die lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet „unauthorized“ (oder stellt ständig erneut eine Verbindung her). Was nun?'>
    Der Authentifizierungspfad Ihres Gateways stimmt nicht mit der Authentifizierungsmethode der UI überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage`, beschränkt auf den aktuellen Browser-Tab und die ausgewählte Gateway-URL. Dadurch funktionieren Aktualisierungen im selben Tab weiterhin, ohne dass das Token langfristig in localStorage gespeichert wird.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen einmaligen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Geräte-Token durchführen, wenn das Gateway entsprechende Wiederholungshinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Wiederholungsversuch mit dem zwischengespeicherten Token verwendet erneut die mit dem Geräte-Token gespeicherten genehmigten Geltungsbereiche; Aufrufer mit explizitem `deviceToken` / explizitem `scopes` behalten ihre angeforderten Geltungsbereiche bei, statt die zwischengespeicherten Geltungsbereiche zu übernehmen.
    - Außerhalb dieses Wiederholungspfads gilt für die Verbindungs­authentifizierung folgende Priorität: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, danach das gespeicherte Geräte-Token und schließlich das Bootstrap-Token.
    - Das integrierte Setup-Code-Bootstrap gibt ein Node-Geräte-Token mit `scopes: []` sowie ein zeitlich begrenztes Operator-Übergabe-Token für das vertrauenswürdige mobile Onboarding zurück. Die Operator-Übergabe kann während der Einrichtung native Konfigurationen lesen, gewährt jedoch weder Geltungsbereiche zum Ändern der Kopplung noch `operator.admin`.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus und kopiert sie, versucht sie zu öffnen; zeigt in einer Headless-Umgebung einen SSH-Hinweis an).
    - Noch kein Token: `openclaw doctor --generate-gateway-token`.
    - Remote: Richten Sie zunächst mit `ssh -N -L 18789:127.0.0.1:18789 user@host` einen Tunnel ein und öffnen Sie anschließend `http://127.0.0.1:18789/`.
    - Modus mit gemeinsamem Geheimnis: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und fügen Sie anschließend das entsprechende Geheimnis in den Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Vergewissern Sie sich, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine direkte Loopback-/Tailnet-URL, die die Tailscale-Identitätsheader umgeht.
    - Trusted-Proxy-Modus: Vergewissern Sie sich, dass die Verbindung über den konfigurierten identitätsbewussten Proxy erfolgt. Loopback-Proxys auf demselben Host benötigen ebenfalls `gateway.auth.trustedProxy.allowLoopback = true`.
    - Besteht die Abweichung nach dem einmaligen Wiederholungsversuch weiterhin, rotieren bzw. genehmigen Sie das gekoppelte Geräte-Token erneut:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Rotation verweigert: Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich über `operator.admin` verfügen. Explizite `--scope`-Werte dürfen die aktuellen Operator-Geltungsbereiche des Aufrufers nicht überschreiten.
    - Weiterhin blockiert: `openclaw status --all` sowie [Fehlerbehebung](/de/gateway/troubleshooting). Einzelheiten zur Authentifizierung finden Sie unter [Dashboard](/de/web/dashboard).

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es lauscht nur auf Loopback">
    Die Bindung `tailnet` wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn der Rechner nicht mit Tailscale verbunden ist (oder die Schnittstelle inaktiv ist), fällt das Gateway auf Loopback zurück, statt eine andere Netzwerkschnittstelle freizugeben.

    Behebung: Starten Sie Tailscale auf diesem Host und starten Sie das Gateway neu oder wechseln Sie explizit zu `gateway.bind: "loopback"` / `"lan"`.

    `tailnet` ist explizit; `auto` bevorzugt Loopback. Verwenden Sie `gateway.bind: "tailnet"`, um die Nicht-Loopback-Freigabe auf das Tailnet zu beschränken und gleichzeitig den erforderlichen `127.0.0.1`-Listener auf demselben Host beizubehalten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nicht – ein Gateway kann mehrere Nachrichtenkanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur für Redundanz (beispielsweise einen Rettungs-Bot) oder eine strikte Isolation und isolieren Sie jedes mit einem eigenen `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` und einem eindeutigen `gateway.port`.

    Empfohlen: `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`), ein eindeutiges `gateway.port` pro Profilkonfiguration (oder `--port` für manuelle Ausführungen) und ein profilbezogener Dienst mit `openclaw --profile <name> gateway install`.

    Profile ergänzen außerdem Dienstnamen um ein Suffix: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. Die nicht näher qualifizierte systemd-Unit `openclaw-gateway` ist nur für das Standardprofil vorhanden; der alte systemd-Unit-Name `clawdbot-gateway` aus der Zeit vor der Umbenennung wird automatisch migriert.

    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet „invalid handshake“ / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als erste Nachricht einen `connect`-Frame. Bei allen anderen Nachrichten wird die Verbindung mit **Code 1008** (Richtlinienverstoß) geschlossen.

    Häufige Ursachen: Sie haben die **HTTP**-URL in einem Browser statt in einem WS-Client geöffnet, den falschen Port/Pfad verwendet oder ein Proxy/Tunnel hat Authentifizierungsheader entfernt bzw. eine Anfrage gesendet, die nicht für das Gateway bestimmt war.

    Behebung: Verwenden Sie die WS-URL (`ws://<host>:18789` oder `wss://...` über HTTPS), öffnen Sie den WS-Port nicht in einem normalen Browser-Tab und fügen Sie bei aktivierter Authentifizierung das Token/Passwort in den `connect`-Frame ein. CLI-/TUI-Beispiel:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Protokollierung und Debugging

<AccordionGroup>
  <Accordion title="Wo befinden sich die Protokolle?">
    Dateiprotokolle (strukturiert): `/tmp/openclaw/openclaw-YYYY-MM-DD.log` für das Standardprofil oder `/tmp/openclaw/openclaw-<profile>-YYYY-MM-DD.log` für ein benanntes Profil. Legen Sie über `logging.file` einen stabilen Pfad, über `logging.level` die Dateiprotollstufe und über `--verbose` sowie `logging.consoleLevel` die Ausführlichkeit der Konsolenausgabe fest.

    Schnellste Live-Anzeige:

    ```bash
    openclaw logs --follow
    ```

    Dienst-/Supervisor-Protokolle (wenn das Gateway über launchd/systemd ausgeführt wird):

    - macOS-launchd-Standardausgabe: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`; die Standardfehlerausgabe wird unterdrückt).
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

    **1) Lokale Einrichtung mit Windows Hub**: Die native App verwaltet ein lokales, App-eigenes WSL-Gateway. Öffnen Sie **OpenClaw Companion** über das Startmenü oder den Infobereich und verwenden Sie anschließend **Gateway Setup** oder die Registerkarte „Connections“.

    **2) Manuelles WSL2-Gateway**: Das Gateway wird unter Linux ausgeführt.
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
    Bei manueller Ausführung (ohne Dienst): `openclaw gateway run`.

    Dokumentation: [Windows](/de/platforms/windows), [Betriebshandbuch für den Gateway-Dienst](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway ist aktiv, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Schnelle Zustandsprüfung:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen: Die Modellauthentifizierung wurde auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`), die Kanalkopplung/Zulassungsliste blockiert Antworten (prüfen Sie die Kanalkonfiguration und die Protokolle) oder WebChat/Dashboard ist ohne das richtige Token geöffnet. Bei Remote-Betrieb vergewissern Sie sich, dass die Tunnel-/Tailscale-Verbindung aktiv und der Gateway-WebSocket erreichbar ist.

    Docs: [Kanäle](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Verbindung zum Gateway getrennt: kein Grund" – was nun?'>
    Dies bedeutet normalerweise, dass die Benutzeroberfläche die WebSocket-Verbindung verloren hat. Prüfen Sie: Läuft das Gateway (`openclaw gateway status`)? Ist es funktionsfähig (`openclaw status`)? Verfügt die Benutzeroberfläche über das richtige Token (`openclaw dashboard`)? Falls der Zugriff remote erfolgt: Ist die Tunnel-/Tailscale-Verbindung aktiv?

    Verfolgen Sie anschließend die Logs:

    ```bash
    openclaw logs --follow
    ```

    Docs: [Dashboard](/de/web/dashboard), [Remotezugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie anschließend den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü enthält zu viele Einträge. OpenClaw kürzt es bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, dennoch können einige Menüeinträge entfallen. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Prüfen Sie auf einem VPS oder hinter einem Proxy, ob ausgehendes HTTPS zulässig ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ausgeführt wird, prüfen Sie die Logs auf dem Gateway-Host.

    Docs: [Telegram](/de/channels/telegram), [Fehlerbehebung für Kanäle](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand anzuzeigen. Wenn Sie Antworten in einem Chatkanal erwarten, vergewissern Sie sich, dass die Zustellung aktiviert ist (`/deliver on`).

    Docs: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es anschließend neu?">
    Wenn Sie den Dienst installiert haben (launchd unter macOS, systemd unter Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Beenden Sie die Ausführung im Vordergrund mit Ctrl-C und führen Sie anschließend `openclaw gateway run` aus.

    Docs: [Runbook für den Gateway-Dienst](/de/gateway).

  </Accordion>

  <Accordion title="Einfach erklärt: openclaw gateway restart gegenüber openclaw gateway">
    `openclaw gateway restart` startet den **Hintergrunddienst** (launchd/systemd) neu. `openclaw gateway` führt das Gateway für diese Terminalsitzung **im Vordergrund** aus. Verwenden Sie die Gateway-Unterbefehle, wenn Sie den Dienst installiert haben; verwenden Sie für eine einmalige Ausführung den einfachen Vordergrundbefehl.
  </Accordion>

  <Accordion title="Schnellster Weg zu weiteren Details bei einem Fehler">
    Starten Sie das Gateway mit `--verbose`, um ausführlichere Konsolendetails zu erhalten, und prüfen Sie anschließend die Logdatei auf Fehler bei der Kanalauthentifizierung, beim Modell-Routing und bei RPC-Aufrufen.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge des Agenten müssen strukturierte Medienfelder wie `media`, `mediaUrl`, `path` oder `filePath` verwenden. Siehe [Einrichtung des OpenClaw-Assistenten](/de/start/openclaw) und [Senden durch Agenten](/de/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Hier ist es" --media /path/to/file.png
    ```

    Prüfen Sie außerdem: Der Zielkanal unterstützt ausgehende Medien und wird nicht durch Positivlisten blockiert; die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf eine maximale Seitenlänge von 2048px skaliert); `tools.fs.workspaceOnly=true` beschränkt das Senden über lokale Pfade auf Dateien im Workspace, im temporären Speicher/Medienspeicher sowie auf durch die Sandbox validierte Dateien; `tools.fs.workspaceOnly=false` (Standard) erlaubt strukturierten Sendungen lokaler Medien, Dateien vom Host zu verwenden, die der Agent bereits lesen kann. Dies gilt für Medien sowie sichere Dokumenttypen (Bilder, Audio, Video, PDF, Office-Dokumente und validierte Textdokumente wie Markdown/MD, TXT, JSON, YAML/YML). Dies ist kein Scanner für Geheimnisse – eine für den Agenten lesbare `secret.txt` oder `config.json` kann angehängt werden, wenn Erweiterung und Inhaltsvalidierung übereinstimmen. Bewahren Sie vertrauliche Dateien außerhalb der für Agenten lesbaren Pfade auf oder behalten Sie `tools.fs.workspaceOnly=true` bei, um das Senden über lokale Pfade strenger einzuschränken.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende Direktnachrichten zugänglich zu machen?">
    Behandeln Sie eingehende Direktnachrichten als nicht vertrauenswürdige Eingaben. Die Standardeinstellungen reduzieren das Risiko:

    - Das Standardverhalten auf Kanälen, die Direktnachrichten unterstützen, ist **Kopplung**: Unbekannte Absender erhalten einen Kopplungscode, und ihre Nachricht wird nicht verarbeitet. Genehmigen Sie sie mit `openclaw pairing approve --channel <channel> [--account <id>] <code>`. Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, falls kein Code eingegangen ist.
    - Das öffentliche Öffnen von Direktnachrichten erfordert eine ausdrückliche Aktivierung (`dmPolicy: "open"` und Positivliste `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante Richtlinien für Direktnachrichten anzuzeigen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur bei öffentlichen Bots problematisch?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot Direktnachrichten senden kann. Wenn Ihr Assistent externe Inhalte liest (Websuche/-abruf, Browserseiten, E-Mails, Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen, das Modell zu übernehmen – selbst wenn Sie der einzige Absender sind.

    Das größte Risiko besteht bei aktivierten Tools: Das Modell kann dazu verleitet werden, Kontext nach außen zu übertragen oder in Ihrem Namen Tools aufzurufen. Begrenzen Sie den möglichen Schaden:

    - Verwenden Sie einen schreibgeschützten „Lese“-Agenten oder einen Agenten ohne Tools, um nicht vertrauenswürdige Inhalte zusammenzufassen.
    - Deaktivieren Sie `web_search` / `web_fetch` / `browser` für Agenten mit aktivierten Tools.
    - Behandeln Sie auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig: OpenResponses `input_file` und die Extraktion von Medienanhängen umschließen extrahierten Text mit expliziten Begrenzungsmarkierungen für externe Inhalte, statt unverarbeiteten Dateitext zu übergeben.
    - Verwenden Sie eine Sandbox und strenge Positivlisten für Tools.

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Ist OpenClaw weniger sicher, weil es TypeScript/Node statt Rust/WASM verwendet?">
    Sprache und Laufzeit sind relevant, stellen jedoch nicht das Hauptrisiko für einen persönlichen Agenten dar. Die praktischen Risiken sind die Zugänglichkeit des Gateways, wer dem Bot Nachrichten senden kann, Prompt Injection, der Umfang der Tools, der Umgang mit Anmeldedaten, Browserzugriff, Ausführungszugriff sowie das Vertrauen in Skills/Plugins von Drittanbietern.

    Rust und WASM können für einige Codeklassen eine stärkere Isolierung bieten, lösen jedoch weder Prompt Injection noch ungeeignete Positivlisten, die öffentliche Zugänglichkeit des Gateways, zu weitreichende Tools oder ein Browserprofil, das bereits bei vertraulichen Konten angemeldet ist. Behandeln Sie folgende Maßnahmen als primäre Kontrollen: Halten Sie das Gateway privat oder sichern Sie es durch Authentifizierung, verwenden Sie Kopplung und Positivlisten für Direktnachrichten/Gruppen, verweigern Sie riskante Tools für nicht vertrauenswürdige Eingaben oder führen Sie diese in einer Sandbox aus, installieren Sie nur vertrauenswürdige Plugins und Skills und führen Sie nach Konfigurationsänderungen `openclaw security audit --deep` aus.

    Details: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ich habe Berichte über offen zugängliche OpenClaw-Instanzen gesehen. Was sollte ich prüfen?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Eine sicherere Ausgangskonfiguration: Das Gateway ist an `loopback` gebunden oder nur über authentifizierten privaten Zugriff erreichbar (Tailnet, SSH-Tunnel, Token-/Passwortauthentifizierung oder einen korrekt konfigurierten vertrauenswürdigen Proxy); Direktnachrichten befinden sich im Modus `pairing` oder `allowlist`; Gruppen stehen auf der Positivliste und erfordern eine Erwähnung, sofern nicht jedes Mitglied vertrauenswürdig ist; Tools mit hohem Risiko (`exec`, `browser`, `gateway`, `cron`) werden für Agenten, die nicht vertrauenswürdige Inhalte lesen, verweigert oder eng begrenzt; Sandboxing ist aktiviert, wenn die Toolausführung einen kleineren möglichen Schadensumfang erfordert.

    Öffentliche Bindungen ohne Authentifizierung, offene Direktnachrichten/Gruppen mit Tools und eine offen zugängliche Browsersteuerung sind die zuerst zu behebenden Befunde. Details: [openclaw security audit](/de/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="Können ClawHub-Skills und Plugins von Drittanbietern sicher installiert werden?">
    Behandeln Sie Skills und Plugins von Drittanbietern als Code, dem Sie bewusst vertrauen. ClawHub-Seiten für Skills zeigen vor der Installation den Scanstatus an, Scans stellen jedoch keine vollständige Sicherheitsgrenze dar. OpenClaw führt während der Installation oder Aktualisierung eines Plugins/Skills keine integrierte lokale Blockierung gefährlichen Codes aus; verwenden Sie für lokale Entscheidungen zum Zulassen oder Blockieren die vom Betreiber verwaltete Datei `security.installPolicy`.

    Sichereres Vorgehen: Bevorzugen Sie vertrauenswürdige Autoren und fest angegebene Versionen, lesen Sie den Skill/das Plugin vor der Aktivierung, halten Sie Positivlisten für Plugins/Skills eng, führen Sie Workflows mit nicht vertrauenswürdigen Eingaben in einer Sandbox mit minimalen Tools aus und vermeiden Sie, Drittanbietercode umfassenden Zugriff auf das Dateisystem, die Ausführung, den Browser oder Geheimnisse zu gewähren.

    Details: [Skills](/de/tools/skills), [Plugins](/de/tools/plugin), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot über eine eigene E-Mail-Adresse, ein eigenes GitHub-Konto oder eine eigene Telefonnummer verfügen?">
    Ja, bei den meisten Konfigurationen. Die Isolierung des Bots durch separate Konten und Telefonnummern begrenzt den möglichen Schaden, falls etwas schiefgeht, und erleichtert es, Anmeldedaten auszutauschen oder den Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Beginnen Sie mit wenig Zugriff: Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie ihn später bei Bedarf.

    Docs: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Vorgehen: Belassen Sie Direktnachrichten im **Kopplungsmodus** oder verwenden Sie eine enge Positivliste, verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn der Agent in Ihrem Namen Nachrichten senden soll, und lassen Sie ihn Entwürfe erstellen, die Sie **vor dem Senden genehmigen**.

    Führen Sie Experimente mit einem dedizierten, isolierten Konto durch. Siehe [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent ausschließlich für Chats verwendet wird und die Eingaben vertrauenswürdig sind. Kleinere Modellklassen sind anfälliger für die Übernahme durch Anweisungen. Vermeiden Sie sie daher für Agenten mit aktivierten Tools oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, schränken Sie die Tools stark ein und führen Sie es innerhalb einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Kopplungscode erhalten">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und `dmPolicy: "pairing"` aktiviert ist; `/start` allein erzeugt keinen Code.

    Prüfen Sie ausstehende Anfragen:

    ```bash
    openclaw pairing list telegram
    ```

    Um sofortigen Zugriff zu erhalten, nehmen Sie Ihre Absender-ID in die Positivliste auf oder legen Sie für dieses Konto `dmPolicy: "open"` fest.

  </Accordion>

  <Accordion title="WhatsApp: Sendet es Nachrichten an meine Kontakte? Wie funktioniert die Kopplung?">
    Nein. Die standardmäßige WhatsApp-Richtlinie für Direktnachrichten ist **Kopplung**. Unbekannte Absender erhalten lediglich einen Kopplungscode; ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf empfangene Chats oder führt von Ihnen ausdrücklich ausgelöste Sendungen aus.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    Die Abfrage der Telefonnummer im Assistenten legt Ihre **Positivliste/den Eigentümer** fest, damit Ihre eigenen Direktnachrichten zulässig sind – sie wird nicht zum automatischen Senden verwendet. Verwenden Sie bei Ihrer persönlichen WhatsApp-Nummer diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chatbefehle, Abbrechen von Aufgaben und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemmeldungen im Chat angezeigt werden?">
    Die meisten internen Meldungen und Toolmeldungen werden nur angezeigt, wenn für diese Sitzung **ausführliche Ausgabe**, **Trace** oder **Reasoning** aktiviert ist.

    Beheben Sie dies in dem Chat, in dem die Meldungen angezeigt werden:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Falls die Ausgabe weiterhin zu ausführlich ist: Prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie die ausführliche Ausgabe auf **inherit**; vergewissern Sie sich, dass Sie kein Botprofil verwenden, dessen Konfiguration `verboseDefault: "on"` enthält.

    Docs: [Denken und ausführliche Ausgabe](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine der folgenden Angaben **als eigenständige Nachricht** (ohne Schrägstrich), um einen Abbruch auszulösen: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Gängige nicht englischsprachige Auslöser (Französisch, Deutsch, Spanisch, Chinesisch, Japanisch, Hindi, Arabisch, Russisch) funktionieren ebenfalls.

    Bitten Sie bei Hintergrundprozessen, die vom exec-Tool gestartet wurden, den Agenten, Folgendes auszuführen:

    ```text
    process action:kill sessionId:XXX
    ```

    Die meisten Slash-Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt. Einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Zulassungsliste jedoch auch innerhalb einer Nachricht. Siehe [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram aus? („Kontextübergreifendes Messaging verweigert“)'>
    OpenClaw blockiert **Provider-übergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf an Telegram gebunden ist, sendet er nichts an Discord, sofern Sie dies nicht ausdrücklich zulassen – und die Änderung wird sofort wirksam, ohne dass ein Neustart des Gateways erforderlich ist:

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

  </Accordion>

  <Accordion title='Warum wirkt es, als würde der Bot schnell aufeinanderfolgende Nachrichten „ignorieren“?'>
    Prompts während eines laufenden Durchlaufs werden standardmäßig in den aktiven Durchlauf eingespeist. Verwenden Sie `/queue`, um das Verhalten des aktiven Durchlaufs auszuwählen:

    - `steer` (Standard) – den aktiven Durchlauf an der nächsten Modellgrenze steuern.
    - `followup` – Nachrichten in die Warteschlange stellen und nach Ende des aktuellen Durchlaufs einzeln ausführen.
    - `collect` – kompatible Nachrichten in die Warteschlange stellen und nach Ende des aktuellen Durchlaufs einmal antworten.
    - `interrupt` – den aktuellen Durchlauf abbrechen und neu beginnen.

    Fügen Sie Warteschlangenmodi Optionen wie `debounce:0.5s cap:25 drop:summarize` hinzu. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Welches Modell ist bei Anthropic mit einem API-Schlüssel standardmäßig eingestellt?'>
    Anmeldedaten und Modellauswahl sind voneinander getrennt. Das Festlegen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Authentifizierungsprofilen) ermöglicht die Authentifizierung, das tatsächliche Standardmodell ist jedoch dasjenige, das Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` bedeutet, dass das Gateway für den laufenden Agenten keine Anthropic-Anmeldedaten in der erwarteten `auth-profiles.json` finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie weiterhin nicht weiter? Fragen Sie in [Discord](https://discord.com/invite/clawd) nach oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) – Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modell-FAQ](/de/help/faq-models) – Modellauswahl, Failover, Authentifizierungsprofile
- [Fehlerbehebung](/de/help/troubleshooting) – symptomorientierte Triage
