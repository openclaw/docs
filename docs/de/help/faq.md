---
read_when:
    - Beantwortung häufiger Supportfragen zu Einrichtung, Installation, Onboarding oder Laufzeit
    - Triagieren von nutzergemeldeten Problemen vor einer tiefergehenden Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-07-03T13:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten plus tiefere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Laufzeitdiagnosen finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Erste 60 Sekunden, wenn etwas nicht funktioniert

1. **Schneller Status (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Dienst, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Auszug (Token redigiert).

3. **Daemon- und Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Ziel-URL der Prüfung und welche Konfiguration der Dienst wahrscheinlich verwendet hat.

4. **Tiefe Prüfungen**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Integritätsprüfung aus, einschließlich Channel-Prüfungen, sofern unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Integrität](/de/gateway/health).

5. **Aktuellstes Log verfolgen**

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

   Repariert/migriert Konfiguration/Zustand + führt Integritätsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Integrität](/de/gateway/health).

## Schnellstart und Ersteinrichtung

Fragen und Antworten zum ersten Start - Installation, Onboarding, Authentifizierungsrouten, Abonnements, anfängliche Fehler -
finden Sie in der [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot), und kann auf unterstützten Plattformen außerdem Sprache + ein Live-Canvas nutzen. Das **Gateway** ist die ständig aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **local-first Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Speicher und Tools - ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo immer Sie möchten (Mac, Linux, VPS), und halten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw., mit Routing
      und Failover pro Agent.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, damit **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie möchten.
    - **Multi-Agent-Routing:** Separate Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Standardwerten.
    - **Open Source und anpassbar:** Prüfen, erweitern und selbst hosten ohne Anbieterbindung.

    Doku: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Erstellen Sie eine Website (WordPress, Shopify oder eine einfache statische Website).
    - Prototypisieren Sie eine mobile App (Gliederung, Screens, API-Plan).
    - Organisieren Sie Dateien und Ordner (Bereinigung, Benennung, Tagging).
    - Verbinden Sie Gmail und automatisieren Sie Zusammenfassungen oder Nachfassaktionen.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die Sie interessieren.
    - **Recherche und Entwurf:** Schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Nachfassaktionen:** Cron- oder Heartbeat-gesteuerte Hinweise und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen, und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Auswahllisten erstellen,
    potenzielle Kunden zusammenfassen und Entwürfe für Outreach- oder Anzeigentexte schreiben.

    Bei **Outreach- oder Anzeigenläufen** sollten Sie einen Menschen in der Schleife behalten. Vermeiden Sie Spam, beachten Sie lokale Gesetze und
    Plattformrichtlinien, und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist, OpenClaw
    entwerfen zu lassen und Sie genehmigen.

    Doku: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhaften Speicher, geräteübergreifenden Zugriff und Tool-Orchestrierung wünschen.

    Vorteile:

    - **Persistenter Speicher + Workspace** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo verändert zu halten?">
    Verwenden Sie verwaltete Überschreibungen, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin Vorrang vor gebündelten Skills haben, ohne git anzufassen. Wenn der Skill global installiert, aber nur für einige Agents sichtbar sein soll, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur upstream-taugliche Änderungen sollten im Repo liegen und als PRs veröffentlicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie dies mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle oder Einstellungen für verschiedene Aufgaben verwenden?">
    Die heute unterstützten Muster sind:

    - **Cron-Jobs**: Isolierte Jobs können pro Job eine `model`-Überschreibung setzen.
    - **Agents**: Leiten Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen, Denkstufen und Stream-Parametern weiter.
    - **Wechsel bei Bedarf**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Verwenden Sie zum Beispiel dasselbe Modell mit unterschiedlichen Einstellungen pro Agent:

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

    Legen Sie gemeinsame Standardwerte pro Modell in `agents.defaults.models["provider/model"].params` ab und agent-spezifische Überschreibungen anschließend in flachem `agents.list[].params`. Definieren Sie keine separaten verschachtelten `agents.list[].models["provider/model"].params`-Einträge für dasselbe Modell; `agents.list[].models` ist für den Modellkatalog pro Agent und Laufzeitüberschreibungen gedacht.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent), [Konfiguration](/de/gateway/config-agents) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „spawn a sub-agent for this task“ auszuführen, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Token. Wenn Kosten ein Thema sind, setzen Sie über `agents.defaults.subagents.model` ein
    günstigeres Modell für Sub-Agents.

    Doku: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an einen Subagent oder ein Sitzungsziel binden, sodass Folgemeldungen in diesem Thread in dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Spawnen Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Folgemeldungen).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Bindungsstatus zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um automatisches Unfocus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Überschreibungen: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisch beim Spawnen binden: `channels.discord.threadBindings.spawnSessions` ist standardmäßig `true`; setzen Sie es auf `false`, um threadgebundene Sitzungsspawns zu deaktivieren.

    Doku: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig geworden, aber die Abschlussmeldung ging an den falschen Ort oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung von Subagents im Abschlussmodus bevorzugt einen gebundenen Thread oder eine Konversationsroute, sofern vorhanden.
    - Wenn der Abschlussursprung nur einen Channel enthält, fällt OpenClaw auf die gespeicherte Route der Anforderer-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), damit direkte Zustellung weiterhin gelingen kann.
    - Wenn weder eine gebundene Route noch eine verwendbare gespeicherte Route vorhanden ist, kann die direkte Zustellung fehlschlagen, und das Ergebnis fällt auf Warteschlangen-Sitzungszustellung zurück, statt sofort in den Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Warteschlangen-Fallback oder endgültigen Zustellfehler erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Kindes exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt früheren veralteten Fortschritt zu posten.
    - Tool/toolResult-Ausgabe wird nicht in den Ergebnistext des Kindes übernommen; das Ergebnis ist die neueste sichtbare Assistentenantwort des Kindes.

    Debuggen:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungstools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn der Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass der Gateway rund um die Uhr läuft (kein Ruhezustand/keine Neustarts).
    - Überprüfen Sie die Zeitzoneneinstellungen für den Job (`--tz` gegenüber der Host-Zeitzone).

    Debuggen:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Fallback-Senden durch den Runner erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Fehler bei der Kanalauthentifizierung (`unauthorized`, `Forbidden`) bedeuten, dass der Runner zuzustellen versucht hat, die Anmeldedaten dies aber blockiert haben.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Zustellung über den Warteschlangen-Fallback.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem Tool `message`
    senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den Runner-
    Fallback-Pfad für finalen Text, den der Agent nicht bereits gesendet hat.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Pfad zum Modellwechsel, keine doppelte Planung.

    Isolierter Cron kann eine Laufzeit-Modellübergabe persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und wenn der Wechsel eine neue Auth-Profil-Überschreibung mitgebracht hat, persistiert Cron
    auch diese vor dem erneuten Versuch.

    Zugehörige Auswahlregeln:

    - Die Modellüberschreibung des Gmail-Hooks gewinnt zuerst, wenn sie anwendbar ist.
    - Danach `model` pro Job.
    - Danach jede gespeicherte Modellüberschreibung der Cron-Sitzung.
    - Danach die normale Agent-/Standardmodellauswahl.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen
    bricht Cron ab, statt endlos zu laufen.

    Debuggen:

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
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Native `openclaw skills install` schreibt standardmäßig in das Verzeichnis `skills/`
    des aktiven Arbeitsbereichs. Fügen Sie `--global` hinzu, um in das gemeinsam verwaltete
    Skills-Verzeichnis für alle lokalen Agenten zu installieren. Installieren Sie die separate `clawhub`-CLI
    nur, wenn Sie Ihre eigenen Skills veröffentlichen oder synchronisieren möchten. Verwenden Sie
    `agents.defaults.skills` oder `agents.list[].skills`, wenn Sie einschränken möchten,
    welche Agenten gemeinsame Skills sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für regelmäßige Prüfungen der "Hauptsitzung".
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-exklusive Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien eingeschränkt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** berechtigt sind. Unter Linux werden ausschließlich für `darwin` vorgesehene Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie das Gating nicht überschreiben.

    Sie haben drei unterstützte Muster:

    **Option A - führen Sie den Gateway auf einem Mac aus (am einfachsten).**
    Führen Sie den Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - verwenden Sie einen macOS-Node (kein SSH).**
    Führen Sie den Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App), und setzen Sie **Node-Ausführungsbefehle** auf dem Mac auf "Immer fragen" oder "Immer erlauben". OpenClaw kann macOS-exklusive Skills als berechtigt behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie "Immer fragen" wählen, fügt die Genehmigung von "Immer erlauben" in der Eingabeaufforderung diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxyn (fortgeschritten).**
    Behalten Sie den Gateway unter Linux, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Überschreiben Sie dann den Skill, um Linux zu erlauben, damit er berechtigt bleibt.

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
    Derzeit nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browserautomatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Kunde beibehalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration wünschen, öffnen Sie eine Funktionsanfrage oder erstellen Sie einen Skill,
    der auf diese APIs zielt.

    Skills installieren:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im Verzeichnis `skills/` des aktiven Arbeitsbereichs. Für gemeinsame Skills über alle lokalen Agenten hinweg verwenden Sie `openclaw skills install @owner/<skill-slug> --global` (oder legen Sie sie manuell in `~/.openclaw/skills/<name>/SKILL.md` ab). Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten über Homebrew installierte Binärdateien; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das integrierte Browserprofil `user`, das über Chrome DevTools MCP verbunden wird:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad kann den lokalen Host-Browser oder einen verbundenen Browser-Node verwenden. Wenn der Gateway anderswo läuft, führen Sie entweder einen Node-Host auf dem Browser-Rechner aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen bei `existing-session` / `user`:

    - Aktionen sind referenzgesteuert, nicht CSS-Selector-gesteuert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils eine Datei
    - `responsebody`, PDF-Export, Download-Intercepting und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine dedizierte Dokumentation zu Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiger Gateway in Docker oder Sandbox-Images), siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt - wie aktiviere ich den vollen Funktionsumfang?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es keine
    Systempakete, Homebrew oder gebündelten Browser. Für eine vollständigere Einrichtung:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_IMAGE_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, Gruppen aber mit einem Agenten öffentlich/sandboxed machen?">
    Ja - wenn Ihr privater Verkehr **DMs** und Ihr öffentlicher Verkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann über `tools.sandbox.tools`, welche Tools in Sandboxed-Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und agentenspezifische Bind-Mounts werden zusammengeführt; agentenspezifische Bind-Mounts werden ignoriert, wenn `scope: "shared"` gilt. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bind-Mounts die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin geschlossen fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen weiterhin nach der Symlink-Auflösung gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Speicher?">
    OpenClaw-Speicher besteht einfach aus Markdown-Dateien im Agent-Arbeitsbereich:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Speicher-Flush vor der Compaction** aus, um das Modell daran zu erinnern,
    dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft nur, wenn der Arbeitsbereich
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie sorge ich dafür, dass es haften bleibt?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langfristige Notizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Dies ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin Dinge vergisst, prüfen Sie, ob der Gateway bei jedem Lauf denselben
    Arbeitsbereich verwendet.

    Dokumentation: [Memory](/de/concepts/memory), [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Wo liegen die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Unterhaltungen komprimiert oder abgeschnitten werden. Deshalb gibt es die
    Memory-Suche - sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Memory](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Memory-Suche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder der
    Codex CLI-Anmeldung)** nicht für die semantische Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, verwendet OpenClaw OpenAI-Embeddings. Legacy-
    Konfigurationen, in denen noch `memorySearch.provider = "auto"` steht, werden ebenfalls zu OpenAI aufgelöst.
    Wenn kein OpenAI-API-Schlüssel verfügbar ist, bleibt die semantische Memory-Suche nicht verfügbar,
    bis Sie einen Schlüssel konfigurieren oder explizit einen anderen Provider auswählen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) bereit. Wir unterstützen Embedding-Modelle von **OpenAI, OpenAI-kompatibel, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra oder lokal** -
    Details zur Einrichtung finden Sie unter [Memory](/de/concepts/memory).

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Arbeitsbereich liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Fußabdruck:** Die Verwendung lokaler Modelle hält Prompts auf Ihrem Rechner, aber Channel-
      Traffic läuft weiterhin über die Server des Channels.

    Verwandt: [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (wird bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateibasierte Secret-Payload für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Unterhaltungsverlauf und Zustand (pro Agent)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für Einzel-Agenten: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Arbeitsbereich** (AGENTS.md, Memory-Dateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Arbeitsbereich**, nicht in `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      Die kleingeschriebene Root-Datei `memory.md` ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann sie in `MEMORY.md` zusammenführen, wenn beide Dateien existieren.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standardarbeitsbereich ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart "vergisst", prüfen Sie, ob der Gateway bei jedem Start denselben
    Arbeitsbereich verwendet (und denken Sie daran: Der Remote-Modus verwendet den **Arbeitsbereich des Gateway-Hosts**,
    nicht Ihren lokalen Laptop).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, **es in
    AGENTS.md oder MEMORY.md zu schreiben**, anstatt sich auf den Chatverlauf zu verlassen.

    Siehe [Agent-Arbeitsbereich](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Kann ich SOUL.md größer machen?">
    Ja. `SOUL.md` ist eine der Workspace-Bootstrap-Dateien, die in den
    Agent-Kontext eingefügt werden. Das standardmäßige Einfügelimit pro Datei beträgt `20000` Zeichen,
    und das gesamte Bootstrap-Budget über alle Dateien hinweg beträgt `60000` Zeichen.

    Ändern Sie die gemeinsamen Standardwerte in Ihrer OpenClaw-Konfiguration:

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

    Oder überschreiben Sie einen Agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Verwenden Sie `/context`, um rohe vs. eingefügte Größen zu prüfen und ob eine Kürzung erfolgt ist.
    Halten Sie `SOUL.md` auf Stimme, Haltung und Persönlichkeit fokussiert; legen Sie Betriebsregeln
    in `AGENTS.md` und dauerhafte Fakten in Memory ab.

    Siehe [Kontext](/de/concepts/context) und [Agent-Konfiguration](/de/gateway/config-agents).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Arbeitsbereich** in einem **privaten** Git-Repo ab und sichern Sie ihn an einem privaten Ort
    (zum Beispiel GitHub privat). Das erfasst Memory + AGENTS/SOUL/USER-
    Dateien und ermöglicht Ihnen, den "Geist" des Assistenten später wiederherzustellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Arbeitsbereich als auch das Zustandsverzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die eigene Anleitung: [Deinstallieren](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repo das Standardarbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf den Repo-Root. Das OpenClaw-Repo ist nur Quellcode; halten Sie den
    Arbeitsbereich separat, sofern Sie nicht ausdrücklich möchten, dass der Agent darin arbeitet.

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

  <Accordion title="Remote-Modus: Wo befindet sich der Sitzungsspeicher?">
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
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

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt lauscht nichts / die UI meldet unautorisiert'>
    Nicht-Loopback-Bindings **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Auth **nicht** eigenständig.
    - Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Auth setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
    - Shared-Secret-Setups der Control UI authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätsführende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` benötigen Same-Host-Loopback-Reverse-Proxys explizit `gateway.auth.trustedProxy.allowLoopback = true` und einen Loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Auth, einschließlich Loopback. Im normalen Standardpfad bedeutet das Token-Auth: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird der Gateway-Start in den Token-Modus aufgelöst und erzeugt für diesen Start ein nur zur Laufzeit gültiges Token, daher **müssen sich lokale WS-Clients authentifizieren**. Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients ein stabiles Secret über Neustarts hinweg benötigen. Das verhindert, dass andere lokale Prozesse den Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie den Passwortmodus explizit auswählen (oder, für identitätsbewusste Reverse-Proxys, `trusted-proxy`). Wenn Sie **wirklich** offenen loopback möchten, setzen Sie `gateway.auth.mode: "none"` explizit in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie generieren: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen im laufenden Betrieb anwenden, bei kritischen Änderungen neu starten
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
    - `random`: wechselnde lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web Fetch)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity und Tavily benötigen ihre normale API-Schlüssel-Einrichtung.
    - Grok kann xAI OAuth aus der Modell-Authentifizierung wiederverwenden oder auf `XAI_API_KEY` / die Websuche-Konfiguration des Plugins zurückfallen.
    - Ollama Web Search ist schlüsselfrei, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/selbst gehostet; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Alternativen über Umgebungsvariablen:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
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
    Alte `tools.web.search.*`-Provider-Pfade werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Die Firecrawl-Web-Fetch-Fallback-Konfiguration befindet sich unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Zulassungslisten verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` ausgelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider aus den verfügbaren Zugangsdaten. Das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Dienstumgebung).

    Docs: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Das aktuelle OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - Von OpenClaw vorgenommene Konfigurationsschreibvorgänge validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive von OpenClaw vorgenommene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot-Reload beschädigt, schlägt Gateway geschlossen fehl oder überspringt das Neuladen; es schreibt `openclaw.json` nicht neu.
    - `openclaw doctor --fix` ist für Reparaturen zuständig und kann den letzten bekannten guten Zustand wiederherstellen, während die abgelehnte Datei als `openclaw.json.clobbered.*` gespeichert wird.

    Wiederherstellen:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Prüfen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Wenn Sie keinen letzten bekannten guten Zustand oder keine abgelehnte Nutzlast haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Fehler und fügen Sie Ihre letzte bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann oft aus Protokollen oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    Vermeiden:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich über einen genauen Pfad oder eine Feldform nicht sicher sind; es gibt einen flachen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; behalten Sie `config.apply` nur für den vollständigen Austausch der Konfiguration bei.
    - Wenn Sie das agentenseitige `gateway`-Tool aus einem Agentenlauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich alter `tools.bash.*`-Aliase, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Docs: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Knoten** und **Agenten**:

    - **Gateway (zentral):** verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Knoten (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** separate Gehirne/Arbeitsbereiche für Spezialrollen (z. B. „Hetzner-Betrieb“, „Persönliche Daten“).
    - **Sub-Agenten:** starten Hintergrundarbeit von einem Hauptagenten, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und Agenten/Sitzungen wechseln.

    Docs: [Knoten](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/de/web/tui).

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

    Standard ist `false` (headful). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet dieselbe **Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Ausgabe benötigen).
    - Einige Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      X/Twitter blockiert beispielsweise häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave für Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Knoten

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Knoten weitergeleitet?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Knoten über den **Gateway-WebSocket** auf, wenn ein Knoten-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Knoten → Gateway → Telegram

    Knoten sehen keinen eingehenden Provider-Datenverkehr; sie erhalten nur Knoten-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Knoten**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrem lokalen Rechner über den Gateway-WebSocket aufrufen.

    Typische Einrichtung:

    1. Führen Sie das Gateway auf dem immer eingeschalteten Host aus (VPS/Home-Server).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass Gateway WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sich im Modus **Remote über SSH** (oder direktes Tailnet),
       damit sie sich als Knoten registrieren kann.
    5. Genehmigen Sie den Knoten auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Keine separate TCP-Bridge ist erforderlich; Knoten verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Knotens erlaubt `system.run` auf diesem Rechner. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Docs: [Knoten](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich erhalte keine Antworten. Was jetzt?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Zustand: `openclaw status`
    - Kanalzustand: `openclaw channels status`

    Prüfen Sie anschließend Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Zulassungslisten (DM oder Gruppe) Ihr Konto enthalten.

    Docs: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können sie auf einige
    zuverlässige Arten verbinden:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und lassen Sie Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und einen Chat adressiert, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem entfernten VPS läuft, richten Sie Ihre CLI über SSH/Tailscale
    auf dieses Remote-Gateway (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (ausgeführt von einem Rechner, der das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Schutzregel hinzu, damit die beiden Bots nicht endlos schleifen (nur bei Erwähnung, Kanal-
    Zulassungslisten oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Docs: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent Send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Benötige ich separate VPSes für mehrere Agenten?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeder mit eigenem Arbeitsbereich, Modellstandards
    und Routing. Das ist die normale Einrichtung und deutlich günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht teilen möchten. Andernfalls behalten Sie ein Gateway bei und
    verwenden mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, eine Node auf meinem persönlichen Laptop zu verwenden, statt SSH von einem VPS?">
    Ja - Nodes sind der erstklassige Weg, Ihren Laptop von einem entfernten Gateway aus zu erreichen, und sie
    ermöglichen mehr als Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Box der Raspberry Pi-Klasse reicht aus; 4 GB RAM sind mehr als genug), daher ist ein übliches
    Setup ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Geräte-Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlists/Genehmigungen auf diesem Laptop geschützt.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Lassen Sie das Gateway auf einem VPS laufen, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus, oder hängen Sie sich über Chrome MCP an lokales Chrome auf dem Host an.

    SSH ist für Ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer Sie führen bewusst isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder macOS-„Node-Modus“ in der Menüleisten-App). Für Headless-Node-
    Hosts und CLI-Steuerung siehe [Node-Host-CLI](/de/cli/node).

    Ein vollständiger Neustart ist für Änderungen an `gateway`, `discovery` und gehosteten Plugin-Oberflächen erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Node, passendem UI-Hinweis und unmittelbaren Zusammenfassungen der Kindknoten vor dem Schreiben prüfen
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere Teilaktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); lädt wenn möglich hot nach und startet neu, wenn erforderlich
    - `config.apply`: die vollständige Konfiguration validieren + ersetzen; lädt wenn möglich hot nach und startet neu, wenn erforderlich
    - Das agentenseitige `gateway`-Runtime-Tool verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-Aliase `tools.bash.*` werden auf dieselben geschützten Exec-Pfade normalisiert

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

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac?">
    Minimale Schritte:

    1. **Auf dem VPS installieren + anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Auf Ihrem Mac installieren + anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich im selben Tailnet an.
    3. **MagicDNS aktivieren (empfohlen)**
       - Aktivieren Sie MagicDNS in der Tailscale-Admin-Konsole, damit der VPS einen stabilen Namen hat.
    4. **Den Tailnet-Hostnamen verwenden**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway-WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH verwenden möchten, nutzen Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an Loopback gebunden und HTTPS wird über Tailscale bereitgestellt. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich eine Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass der VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie die Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Doku: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach eine Node hinzufügen?">
    Wenn Sie nur **lokale Tools** (Bildschirm/Kamera/Exec) auf dem zweiten Laptop benötigen, fügen Sie ihn als
    **Node** hinzu. So behalten Sie ein einzelnes Gateway und vermeiden doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur, wenn Sie **strikte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Keine der `.env`-Dateien überschreibt vorhandene Umgebungsvariablen.
    Provider-Anmeldedatenvariablen sind eine Ausnahme für Workspace-`.env`: Schlüssel wie
    `GEMINI_API_KEY`, `XAI_API_KEY` oder `MISTRAL_API_KEY` werden aus der Workspace-
    `.env` ignoriert und sollten in der Prozessumgebung, `~/.openclaw/.env` oder in der Konfiguration `env` liegen.

    Sie können Inline-Umgebungsvariablen auch in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vollständige Priorität und Quellen finden Sie unter [/environment](/de/help/environment).

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Dienst gestartet und meine Umgebungsvariablen sind verschwunden. Was jetzt?">
    Zwei gängige Lösungen:

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Entsprechende Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt „Shell env: off.“ Warum?'>
    `openclaw models status` meldet, ob der **Shell-Umgebungsimport** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen - es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie dies auf eine der folgenden Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es dem `env`-Block Ihrer Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie dann das Gateway neu und prüfen Sie erneut:

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
    Sitzungen können nach `session.idleMinutes` ablaufen, dies ist aber **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie den Wert auf eine positive Zahl, um den Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Leerlaufzeit eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dies löscht keine Transkripte - es startet nur eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team von OpenClaw-Instanzen zu erstellen (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Sie können einen Koordinator-
    Agent und mehrere Worker-Agents mit eigenen Workspaces und Modellen erstellen.

    Das sollte allerdings am besten als **unterhaltsames Experiment** verstanden werden. Es verbraucht viele Tokens und ist oft
    weniger effizient als ein Bot mit getrennten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Doku: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in der Aufgabe gekürzt? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Das hilft:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeiten, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn dies häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, lasse es aber installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Zurücksetzen** an, wenn eine vorhandene Konfiguration erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Dev; löscht Dev-Konfiguration + Anmeldedaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich erhalte Fehler „context too large“ - wie setze ich zurück oder komprimiere?'>
    Verwenden Sie eine dieser Optionen:

    - **Compaction** (behält die Unterhaltung bei, fasst aber ältere Durchläufe zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Zurücksetzen** (frische Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder justieren Sie **Sitzungsbereinigung** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Doku: [Compaction](/de/concepts/compaction), [Sitzungsbereinigung](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich „LLM request rejected: messages.content.tool_use.input field required“?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet in der Regel, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starten Sie mit `/new` eine neue Sitzung (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen,
    Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Fence-Marker
    oder leere Checklisten-Stubs), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Agent-spezifische Überschreibungen verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einem WhatsApp-Gruppenchat ein „Bot-Konto“ hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**. Wenn Sie also in der Gruppe sind, kann OpenClaw sie sehen.
    Standardmäßig sind Gruppenantworten blockiert, bis Sie Absender zulassen (`groupPolicy: "allowlist"`).

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

    Suchen Sie nach `chatId` (oder `from`) mit der Endung `@g.us`, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (falls bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Verzeichnis](/de/cli/directory), [Logs](/de/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot @erwähnen (oder `mentionPatterns` erfüllen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe ist nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direktchats werden standardmäßig auf die Hauptsitzung zusammengeführt. Gruppen/Kanäle haben eigene Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Speicherzuwachs:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Agent-spezifische Auth-Profile, Workspaces und Kanal-Routing.

    Tipps:

    - Behalten Sie pro Agent einen **aktiven** Workspace (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL-Dateien oder Store-Einträge löschen), wenn der Speicherbedarf wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profilkonflikte zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann an bestimmte Agenten gebunden werden.

    Browserzugriff ist leistungsstark, aber nicht „kann alles tun, was ein Mensch kann“ - Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf der Maschine, auf der der Browser tatsächlich läuft.

    Empfohlene Einrichtung:

    - Ständig verfügbarer Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindungen).
    - Slack-Kanal/Kanäle an diese Agenten gebunden.
    - Lokaler Browser über Chrome MCP oder bei Bedarf über einen Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Modell-Fragen und -Antworten — Standards, Auswahl, Aliasse, Wechsel, Failover, Auth-Profile —
finden Sie in der [Modell-FAQ](/de/help/faq-models).

## Gateway: Ports, „läuft bereits“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Vorrang:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status „Runtime: running“, aber „Connectivity probe: failed“?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Der Connectivity Probe ist die CLI, die tatsächlich eine Verbindung zum Gateway-WebSocket herstellt.

    Verwenden Sie `openclaw gateway status` und vertrauen Sie diesen Zeilen:

    - `Probe target:` (die URL, die der Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Grundursache, wenn der Prozess läuft, der Port aber nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für „Config (cli)“ und „Config (service)“ an?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere verwendet (oft ein `--profile`- / `OPENCLAW_STATE_DIR`-Konflikt).

    Lösung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie dies aus derselben `--profile`- / Umgebung heraus aus, die der Dienst verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet „another gateway instance is already listening“?'>
    OpenClaw erzwingt eine Runtime-Sperre, indem der WebSocket-Listener sofort beim Start gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird `GatewayLockError` ausgelöst und zeigt an, dass bereits eine andere Instanz lauscht.

    Lösung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway anderswo)?">
    Setzen Sie `gateway.mode: "remote"` und verweisen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Anmeldedaten über ein gemeinsames Secret:

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
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren nicht von sich aus lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet „unauthorized“ (oder verbindet sich ständig neu). Was jetzt?'>
    Ihr Gateway-Authentifizierungspfad und die Auth-Methode der UI stimmen nicht überein.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL in `sessionStorage`, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne langlebige `localStorage`-Token-Persistenz wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Wiederholungsversuch mit einem gecachten Geräte-Token versuchen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Cached-Token-Retry verwendet jetzt die gecachten genehmigten Scopes wieder, die mit dem Geräte-Token gespeichert sind. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihr angefordertes Scope-Set, statt gecachte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads hat die Verbindungs-Authentifizierung folgenden Vorrang: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Der integrierte Setup-Code-Bootstrap gibt ein Node-Geräte-Token mit `scopes: []` sowie ein begrenztes Operator-Handoff-Token für vertrauenswürdiges mobiles Onboarding zurück. Das Operator-Handoff kann native Konfiguration zur Einrichtungszeit lesen, gewährt aber keine Pairing-Mutations-Scopes oder `operator.admin`.

    Lösung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus + kopiert sie, versucht sie zu öffnen; zeigt bei Headless-Betrieb einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und fügen Sie dann das passende Secret in den Control-UI-Einstellungen ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe Loopback-/Tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Proxy kommen, nicht über eine rohe Gateway-URL. Same-Host-Loopback-Proxys benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Wenn der Konflikt nach dem einen Retry weiterhin besteht, rotieren/genehmigen Sie das gekoppelte Geräte-Token erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotationsaufruf als verweigert gemeldet wird, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich `operator.admin` besitzen
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie [Fehlerbehebung](/de/gateway/troubleshooting). Auth-Details finden Sie unter [Dashboard](/de/web/dashboard).

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bind wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn die Maschine nicht bei Tailscale ist (oder die Schnittstelle ausgefallen ist), gibt es nichts, woran gebunden werden kann.

    Lösung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt Loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine nur für Tailnet gebundene Schnittstelle wünschen.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    In der Regel nein - ein Gateway kann mehrere Messaging-Kanäle und Agenten ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (State pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelle Einrichtung (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Ausführungen).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile ergänzen außerdem Dienstnamen um ein Suffix (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet „invalid handshake“ / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als allererste Nachricht
    einen `connect`-Frame. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Richtlinienverstoß).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Lösungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...`, wenn HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, schließen Sie Token/Passwort im `connect`-Frame ein.

    Wenn Sie die CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Protokollierung und Debugging

<AccordionGroup>
  <Accordion title="Wo sind Logs?">
    Datei-Logs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können über `logging.file` einen stabilen Pfad festlegen. Die Logstufe für Dateien wird über `logging.level` gesteuert. Die Konsolenausführlichkeit wird über `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellstes Log-Tailing:

    ```bash
    openclaw logs --follow
    ```

    Service-/Supervisor-Logs (wenn der Gateway über launchd/systemd läuft):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (Profile verwenden `gateway-<profile>.log`; stderr wird unterdrückt)
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

    Wenn Sie den Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückfordern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **drei Windows-Installationsmodi**:

    **1) Lokales Windows-Hub-Setup:** Die native App verwaltet einen lokalen, app-eigenen WSL-Gateway.

    Öffnen Sie **OpenClaw Companion** über das Startmenü oder die Taskleiste und verwenden Sie dann
    **Gateway Setup** oder den Tab „Verbindungen“.

    **2) Manueller WSL2-Gateway:** Der Gateway läuft innerhalb von Linux.

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

    **3) Nativer Windows-CLI/Gateway:** Der Gateway läuft direkt in Windows.

    Öffnen Sie PowerShell und führen Sie Folgendes aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie ihn manuell ausführen (kein Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows](/de/platforms/windows), [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Der Gateway ist aktiv, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Gesundheitscheck:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modellauthentifizierung ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Channel-Pairing/Allowlist blockiert Antworten (prüfen Sie Channel-Konfiguration und Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote arbeiten, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Channels](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Vom Gateway getrennt: kein Grund" - was jetzt?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft der Gateway? `openclaw gateway status`
    2. Ist der Gateway fehlerfrei? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote, ist die Tunnel-/Tailscale-Verbindung aktiv?

    Danach Logs verfolgen:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/de/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlerbehebung](/de/gateway/troubleshooting).

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

    Wenn der Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host ansehen.

    Dokumentation: [Telegram](/de/channels/telegram), [Channel-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass der Gateway erreichbar ist und der Agent ausgeführt werden kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Channel erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/de/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich den Gateway vollständig und starte ihn dann wieder?">
    Wenn Sie den Dienst installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Dienst** gestoppt/gestartet (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn der Gateway im Hintergrund als Daemon läuft.

    Wenn Sie ihn im Vordergrund ausführen, stoppen Sie mit Ctrl-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** neu (launchd/systemd).
    - `openclaw gateway`: führt den Gateway **im Vordergrund** für diese Terminalsitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Vordergrundlauf möchten.

  </Accordion>

  <Accordion title="Schnellster Weg zu mehr Details, wenn etwas fehlschlägt">
    Starten Sie den Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie dann die Logdatei auf Channel-Authentifizierung, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agent müssen strukturierte Medienfelder wie `media`, `mediaUrl`, `path` oder `filePath` verwenden. Siehe [OpenClaw-Assistent einrichten](/de/start/openclaw) und [Agent senden](/de/tools/agent-send).

    CLI-Versand:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048 px verkleinert).
    - `tools.fs.workspaceOnly=true` beschränkt das Senden lokaler Pfade auf Workspace-, Temp-/Media-Store- und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt strukturierten lokalen Medienversand mit host-lokalen Dateien, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF, Office-Dokumente und validierte Textdokumente wie Markdown/MD, TXT, JSON, YAML und YML). Dies ist kein Geheimnis-Scanner: Eine vom Agent lesbare `secret.txt` oder `config.json` kann angehängt werden, wenn Erweiterung und Inhaltsvalidierung übereinstimmen. Halten Sie sensible Dateien außerhalb von Pfaden, die der Agent lesen kann, oder behalten Sie `tools.fs.workspaceOnly=true` für strengeren lokalen Pfadversand bei.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingabe. Die Standardwerte sind darauf ausgelegt, Risiken zu reduzieren:

    - Das Standardverhalten auf DM-fähigen Channels ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert ein explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur bei öffentlichen Bots ein Problem?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/Abruf, Browserseiten, E-Mails,
    Dokumentation, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann auch passieren, wenn **Sie der einzige Absender sind**.

    Das größte Risiko entsteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Schadensradius durch:

    - Verwendung eines schreibgeschützten oder tool-deaktivierten „Reader“-Agents zum Zusammenfassen nicht vertrauenswürdiger Inhalte
    - Deaktivieren von `web_search` / `web_fetch` / `browser` für tool-aktivierte Agents
    - Behandlung von dekodiertem Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig: OpenResponses
      `input_file` und Medienanhang-Extraktion kapseln extrahierten Text beide in
      explizite Grenzmarkierungen für externe Inhalte, anstatt rohen Dateitext zu übergeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Ist OpenClaw weniger sicher, weil es TypeScript/Node statt Rust/WASM verwendet?">
    Sprache und Laufzeitumgebung sind wichtig, aber sie sind nicht das Hauptrisiko für einen persönlichen
    Agent. Die praktischen OpenClaw-Risiken sind Gateway-Freigabe, wer dem
    Bot Nachrichten senden kann, Prompt Injection, Tool-Umfang, Umgang mit Anmeldedaten, Browser-Zugriff, Exec-
    Zugriff und das Vertrauen in Drittanbieter-Skills oder -Plugins.

    Rust und WASM können für einige Codeklassen stärkere Isolation bieten, aber
    sie lösen Prompt Injection, schlechte Allowlists, öffentliche Gateway-Freigabe,
    zu weit gefasste Tools oder ein Browserprofil, das bereits bei sensiblen
    Konten angemeldet ist, nicht. Behandeln Sie diese als primäre Kontrollen:

    - Gateway privat oder authentifiziert halten
    - Pairing und Allowlists für DMs und Gruppen verwenden
    - riskante Tools für nicht vertrauenswürdige Eingaben verweigern oder sandboxen
    - nur vertrauenswürdige Plugins und Skills installieren
    - nach Konfigurationsänderungen `openclaw security audit --deep` ausführen

    Details: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ich habe Berichte über offengelegte OpenClaw-Instanzen gesehen. Was sollte ich prüfen?">
    Prüfen Sie zuerst Ihre tatsächliche Bereitstellung:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Eine sicherere Basislinie ist:

    - Gateway an `loopback` gebunden oder nur über authentifizierten privaten
      Zugriff offengelegt, z. B. über ein Tailnet, einen SSH-Tunnel, Token-/Passwortauthentifizierung oder einen korrekt
      konfigurierten vertrauenswürdigen Proxy
    - DMs im Modus `pairing` oder `allowlist`
    - Gruppen per Allowlist zugelassen und mention-gated, sofern nicht jedes Mitglied vertrauenswürdig ist
    - Hochrisiko-Tools (`exec`, `browser`, `gateway`, `cron`) für Agents, die nicht vertrauenswürdige Inhalte lesen, verweigert oder eng
      begrenzt
    - Sandboxing aktiviert, wenn Tool-Ausführung einen kleineren Schadensradius benötigt

    Öffentliche Bindungen ohne Authentifizierung, offene DMs/Gruppen mit Tools und offengelegte Browser-
    Steuerung sind die Befunde, die Sie zuerst beheben sollten. Details:
    [Checkliste für Sicherheitsaudit](/de/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Sind ClawHub-Skills und Drittanbieter-Plugins sicher zu installieren?">
    Behandeln Sie Drittanbieter-Skills und -Plugins als Code, dem Sie vertrauen möchten.
    ClawHub-Skill-Seiten zeigen den Scanstatus vor der Installation an, aber Scans sind keine
    vollständige Sicherheitsgrenze. OpenClaw führt während Plugin- oder Skill-Installations-/Update-Abläufen keine integrierte lokale
    Blockierung gefährlichen Codes aus; verwenden Sie
    die betreiberseitige `security.installPolicy` für lokale Allow-/Block-Entscheidungen.

    Sichereres Muster:

    - vertrauenswürdige Autoren und festgelegte Versionen bevorzugen
    - den Skill oder das Plugin vor der Aktivierung lesen
    - Plugin- und Skill-Allowlists eng halten
    - Workflows mit nicht vertrauenswürdigen Eingaben in einer Sandbox mit minimalen Tools ausführen
    - Drittanbieter-Code keinen breiten Dateisystem-, Exec-, Browser- oder Geheimniszugriff geben

    Details: [Skills](/de/tools/skills), [Plugins](/de/tools/plugin),
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail-Adresse, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolierung des Bots mit separaten Konten und Telefonnummern
    reduziert den Schadensradius, falls etwas schiefläuft. Außerdem wird es dadurch einfacher,
    Zugangsdaten zu rotieren oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen,
    und erweitern Sie ihn später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Lassen Sie DMs im **Kopplungsmodus** oder verwenden Sie eine enge Zulassungsliste.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn er in Ihrem Namen Nachrichten senden soll.
    - Lassen Sie ihn entwerfen und **bestätigen Sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent nur chattet und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Instruction Hijacking. Vermeiden Sie sie daher für Agenten mit Tool-Zugriff
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, schränken Sie
    Tools strikt ein und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Kopplungscode erhalten">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Ausstehende Anfragen prüfen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, setzen Sie Ihre Absender-ID auf die Zulassungsliste oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten Nachrichten senden? Wie funktioniert die Kopplung?">
    Nein. Die standardmäßige WhatsApp-DM-Richtlinie ist **Kopplung**. Unbekannte Absender erhalten nur einen Kopplungscode, und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendevorgänge, die Sie auslösen.

    Kopplung bestätigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Eingabeaufforderung für die Telefonnummer im Assistenten: Sie wird verwendet, um Ihre **Zulassungsliste/Ihren Owner** festzulegen, damit Ihre eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie OpenClaw mit Ihrer persönlichen WhatsApp-Nummer ausführen, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

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
    auf **inherit**. Stellen Sie außerdem sicher, dass Sie kein Bot-Profil verwenden, bei dem `verboseDefault` in der Konfiguration
    auf `on` gesetzt ist.

    Dokumentation: [Denken und ausführliche Ausgabe](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine dieser Nachrichten **als eigenständige Nachricht** (ohne Slash):

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

    Für Hintergrundprozesse (aus dem exec-Tool) können Sie den Agenten bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Zulassungsliste auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht aus Telegram? („Cross-context messaging denied“)'>
    OpenClaw blockiert **Provider-übergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet er nicht an Discord, es sei denn, Sie erlauben es ausdrücklich.

    Aktivieren Sie Provider-übergreifendes Messaging für den Agenten:

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

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnell aufeinanderfolgende Nachrichten „ignorieren“?'>
    Prompts während eines laufenden Runs werden standardmäßig in den aktiven Run geleitet. Verwenden Sie `/queue`, um das Verhalten des aktiven Runs auszuwählen:

    - `steer` - den aktiven Run an der nächsten Modellgrenze steuern
    - `followup` - Nachrichten in die Warteschlange stellen und nach Ende des aktuellen Runs einzeln ausführen
    - `collect` - kompatible Nachrichten in die Warteschlange stellen und nach Ende des aktuellen Runs einmal antworten
    - `interrupt` - aktuellen Run abbrechen und neu starten

    Der Standardmodus ist `steer`. Sie können für Warteschlangenmodi Optionen wie `debounce:0.5s cap:25 drop:summarize` hinzufügen. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Verschiedenes

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Zugangsdaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet dies, dass der Gateway keine Anthropic-Zugangsdaten in der erwarteten `auth-profiles.json` für den laufenden Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Noch nicht weitergekommen? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder öffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modelle-FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Fehlerbehebung](/de/help/troubleshooting) — symptomorientierte Triage
