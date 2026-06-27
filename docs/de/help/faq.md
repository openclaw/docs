---
read_when:
    - Häufige Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support beantworten
    - Triagieren von von Benutzern gemeldeten Problemen vor der tiefergehenden Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: Häufig gestellte Fragen
x-i18n:
    generated_at: "2026-06-27T17:35:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Schnelle Antworten plus tiefere Fehlerbehebung für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Laufzeitdiagnosen finden Sie unter [Fehlerbehebung](/de/gateway/troubleshooting). Die vollständige Konfigurationsreferenz finden Sie unter [Konfiguration](/de/gateway/configuration).

## Erste 60 Sekunden, wenn etwas defekt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: OS + Update, Erreichbarkeit von Gateway/Dienst, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens werden geschwärzt).

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

5. **Neuestes Log verfolgen**

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

   Repariert/migriert Konfiguration/Zustand + führt Health-Prüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt bei Fehlern die Ziel-URL + den Konfigurationspfad
   ```

   Fragt beim laufenden Gateway einen vollständigen Snapshot ab (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

Fragen und Antworten zum ersten Start – Installation, Onboarding, Auth-Routen, Abonnements, anfängliche Fehler –
finden Sie in den [FAQ zum ersten Start](/de/help/faq-first-run).

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw, in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Channel-Plugins wie QQ Bot), und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas nutzen. Das **Gateway** ist die ständig aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **local-first Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** betreiben können, erreichbar über die Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Tools – ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo Sie möchten (Mac, Linux, VPS), und halten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Channels, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/usw.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Nutzen Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit Routing
      und Failover pro Agent.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, damit **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** Separate Agents pro Channel, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und eigenen Defaults.
    - **Open Source und anpassbar:** Prüfen, erweitern und selbst hosten ohne Vendor-Lock-in.

    Docs: [Gateway](/de/gateway), [Channels](/de/channels), [Multi-agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website erstellen (WordPress, Shopify oder eine einfache statische Site).
    - Eine mobile App prototypisieren (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie diese in Phasen aufteilen und
    Sub-Agents für parallele Arbeit nutzen.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten Alltagsanwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meistens so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die für Sie relevant sind.
    - **Recherche und Entwürfe:** Schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Docs.
    - **Erinnerungen und Follow-ups:** Cron- oder Heartbeat-gesteuerte Hinweise und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja, bei **Recherche, Qualifizierung und Entwürfen**. Es kann Websites scannen, Shortlists erstellen,
    Prospects zusammenfassen und Entwürfe für Outreach- oder Anzeigentexte schreiben.

    Bei **Outreach- oder Anzeigenläufen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, beachten Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist, OpenClaw
    entwerfen zu lassen und selbst freizugeben.

    Docs: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile bietet es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsschicht, kein Ersatz für eine IDE. Verwenden Sie
    Claude Code oder Codex für den schnellsten direkten Coding-Loop innerhalb eines Repos. Verwenden Sie OpenClaw, wenn Sie
    dauerhafte Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung wünschen.

    Vorteile:

    - **Persistente Memory + Workspace** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Ständig aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo dirty zu halten?">
    Verwenden Sie verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin Vorrang vor gebündelten Skills haben, ohne git zu berühren. Wenn Sie den Skill global installiert benötigen, er aber nur für einige Agents sichtbar sein soll, halten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur upstream-würdige Änderungen sollten im Repo liegen und als PRs eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle oder Einstellungen für verschiedene Aufgaben verwenden?">
    Die heute unterstützten Muster sind:

    - **Cron-Jobs**: Isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Agents**: Routen Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen, Denkstufen und Stream-Parametern.
    - **On-Demand-Wechsel**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

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

    Legen Sie gemeinsame Defaults pro Modell in `agents.defaults.models["provider/model"].params` ab und agent-spezifische Overrides anschließend in flachem `agents.list[].params`. Definieren Sie keine separaten verschachtelten `agents.list[].models["provider/model"].params`-Einträge für dasselbe Modell; `agents.list[].models` ist für Modellkatalog und Laufzeit-Overrides pro Agent vorgesehen.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent), [Konfiguration](/de/gateway/config-agents) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „spawn a sub-agent for this task“ auszuführen, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten relevant sind, setzen Sie über `agents.defaults.subagents.model` ein
    günstigeres Modell für Sub-Agents.

    Docs: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an ein Subagent- oder Sitzungsziel binden, sodass Folge-Nachrichten in diesem Thread in dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Spawnen mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistentes Follow-up).
    - Oder manuell mit `/focus <target>` binden.
    - Verwenden Sie `/agents`, um den Bindungsstatus zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um automatisches Unfocus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Defaults: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatisches Binden beim Spawn: `channels.discord.threadBindings.spawnSessions` ist standardmäßig `true`; setzen Sie es auf `false`, um threadgebundene Sitzungs-Spawns zu deaktivieren.

    Docs: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung von Subagents im Abschlussmodus bevorzugt jede gebundene Thread- oder Konversationsroute, sofern vorhanden.
    - Wenn der Abschlussursprung nur einen Channel enthält, fällt OpenClaw auf die gespeicherte Route der Anforderer-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), sodass die direkte Zustellung weiterhin gelingen kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route vorhanden ist, kann die direkte Zustellung fehlschlagen, und das Ergebnis fällt auf die Zustellung über die Sitzungswarteschlange zurück, statt sofort im Chat zu posten.
    - Ungültige oder veraltete Ziele können weiterhin einen Warteschlangen-Fallback oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistentenantwort des Childs exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Tool-/toolResult-Ausgabe wird nicht in den Ergebnistext des Childs übernommen; das Ergebnis ist die neueste sichtbare Assistentenantwort des Childs.

    Debugging:

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
    - Prüfen Sie, ob der Gateway rund um die Uhr läuft (kein Ruhezustand/keine Neustarts).
    - Überprüfen Sie die Zeitzoneneinstellungen für den Job (`--tz` gegenüber der Host-Zeitzone).

    Debugging:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber es wurde nichts an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Runner-Fallback-Versand erwartet wird.
    - Ein fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner versucht hat zuzustellen, die Zugangsdaten dies aber blockiert haben.
    - Ein stilles isoliertes Ergebnis (nur `NO_REPLY` / `no_reply`) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die eingereihte Fallback-Zustellung.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem `message`-
    Tool senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den
    Runner-Fallback-Pfad für finalen Text, den der Agent nicht bereits gesendet hat.

    Debugging:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf das Modell gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, keine doppelte Planung.

    Isolierter Cron kann eine Runtime-Modellübergabe persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das Modell bei, und wenn der Wechsel eine neue Auth-Profil-Überschreibung mitgebracht hat, persistiert Cron
    diese ebenfalls vor dem erneuten Versuch.

    Zugehörige Auswahlregeln:

    - Die Gmail-Hook-Modellüberschreibung gewinnt zuerst, wenn sie anwendbar ist.
    - Dann `model` pro Job.
    - Dann jede gespeicherte Cron-Sitzungsmodellüberschreibung.
    - Dann die normale Agent-/Standardmodellauswahl.

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

    Natives `openclaw skills install` schreibt standardmäßig in das aktive Arbeitsbereichsverzeichnis `skills/`.
    Fügen Sie `--global` hinzu, um in das gemeinsam verwaltete
    Skills-Verzeichnis für alle lokalen Agents zu installieren. Installieren Sie die separate `clawhub`-CLI
    nur, wenn Sie Ihre eigenen Skills veröffentlichen oder synchronisieren möchten. Verwenden Sie
    `agents.defaults.skills` oder `agents.list[].skills`, wenn Sie einschränken möchten,
    welche Agents gemeinsame Skills sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Planer:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg bestehen).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills von Linux aus ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien eingeschränkt, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** zulässig sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, Sie überschreiben die Einschränkung.

    Sie haben drei unterstützte Muster:

    **Option A - den Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie den Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (kein SSH).**
    Führen Sie den Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App), und setzen Sie **Node-Ausführungsbefehle** auf dem Mac auf „Immer fragen“ oder „Immer erlauben“. OpenClaw kann macOS-only-Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Immer fragen“ wählen, fügt die Genehmigung von „Immer erlauben“ in der Abfrage diesen Befehl der Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxysieren (fortgeschritten).**
    Behalten Sie den Gateway unter Linux, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien zu SSH-Wrappern aufgelöst werden, die auf einem Mac laufen. Überschreiben Sie dann den Skill, um Linux zu erlauben, damit er zulässig bleibt.

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

  <Accordion title="Gibt es eine Notion- oder HeyGen-Integration?">
    Derzeit nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Kunde behalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Kunde (Kontext + Einstellungen + aktive Arbeit).
    - Bitten Sie den Agent, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, öffnen Sie eine Feature-Anfrage oder erstellen Sie einen Skill,
    der auf diese APIs zielt.

    Skills installieren:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im aktiven Arbeitsbereichsverzeichnis `skills/`. Für gemeinsame Skills über alle lokalen Agents hinweg verwenden Sie `openclaw skills install @owner/<skill-slug> --global` (oder legen Sie sie manuell in `~/.openclaw/skills/<name>/SKILL.md` ab). Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das eingebaute `user`-Browserprofil, das über Chrome DevTools MCP angehängt wird:

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

    Aktuelle Einschränkungen für `existing-session` / `user`:

    - Aktionen sind referenzgesteuert, nicht CSS-Selektor-gesteuert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils eine Datei
    - `responsebody`, PDF-Export, Download-Abfangung und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Speicher

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Sandboxing-Dokumentation?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifisches Setup (vollständiger Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker wirkt eingeschränkt - wie aktiviere ich vollständige Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es keine
    Systempakete, Homebrew oder gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_IMAGE_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistiert wird.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen mit einem Agent öffentlich/sandboxed machen?">
    Ja - wenn Ihr privater Verkehr **DMs** und Ihr öffentlicher Verkehr **Gruppen** sind.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanalsitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann über `tools.sandbox.tools`, welche Tools in sandboxed Sitzungen verfügbar sind.

    Setup-Anleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale und agentenspezifische Bind-Mounts werden zusammengeführt; agentenspezifische Bind-Mounts werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bind-Mounts die Dateisystemwände der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der über den tiefsten vorhandenen Vorfahren aufgelöst wird. Das bedeutet, dass Symlink-Parent-Ausbrüche weiterhin geschlossen fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen weiterhin nach der Symlink-Auflösung gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs. Tool-Richtlinie vs. Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Speicher?">
    OpenClaw-Speicher besteht einfach aus Markdown-Dateien im Arbeitsbereich des Agent:

    - Tägliche Notizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Speicher-Flush vor der Compaction** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor die automatische Compaction erfolgt. Dies läuft nur, wenn der Arbeitsbereich
    beschreibbar ist (schreibgeschützte Sandboxes überspringen es). Siehe [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst immer wieder Dinge. Wie mache ich sie dauerhaft?">
    Bitten Sie den Bot, **die Information in den Speicher zu schreiben**. Langfristige Notizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Dies ist noch ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es Dinge weiterhin vergisst, prüfen Sie, ob der Gateway bei jedem Lauf denselben
    Arbeitsbereich verwendet.

    Dokumentation: [Speicher](/de/concepts/memory), [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Welche Grenzen gibt es?">
    Speicherdateien liegen auf der Festplatte und bleiben bestehen, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, sodass lange Unterhaltungen komprimiert oder abgeschnitten werden können. Deshalb gibt es die
    Speichersuche: Sie holt nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Speicher](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Erfordert die semantische Speichersuche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings. Daher hilft **die Anmeldung mit Codex (OAuth oder
    Codex CLI Login)** nicht für die semantische Speichersuche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, verwendet OpenClaw OpenAI-Embeddings. Legacy-
    Konfigurationen, die noch `memorySearch.provider = "auto"` angeben, werden ebenfalls zu OpenAI aufgelöst.
    Wenn kein OpenAI-API-Schlüssel verfügbar ist, bleibt die semantische Speichersuche nicht verfügbar,
    bis Sie einen Schlüssel konfigurieren oder explizit einen anderen Provider wählen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und stellen Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) bereit. Wir unterstützen **OpenAI, OpenAI-kompatible, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra oder lokale**
    Embedding-Modelle - Details zur Einrichtung finden Sie unter [Speicher](/de/concepts/memory).

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Standardmäßig lokal:** Sitzungen, Speicherdateien, Konfiguration und Arbeitsbereich liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Arbeitsbereichsverzeichnis).
    - **Notwendigerweise remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Umfang:** Lokale Modelle halten Prompts auf Ihrem Rechner, aber Channel-
      Datenverkehr läuft weiterhin über die Server des Channels.

    Verwandt: [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (bei erster Nutzung in Auth-Profile kopiert)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateibasierte geheime Nutzdaten für `file` SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Unterhaltungsverlauf und Zustand (pro Agent)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Pfad für einen einzelnen Agenten: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Arbeitsbereich** (AGENTS.md, Speicherdateien, Skills usw.) ist separat und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Arbeitsbereich**, nicht in `~/.openclaw`.

    - **Arbeitsbereich (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
      `memory.md` in Kleinschreibung im Stammverzeichnis ist nur Legacy-Reparatureingabe; `openclaw doctor --fix`
      kann sie in `MEMORY.md` zusammenführen, wenn beide Dateien vorhanden sind.
    - **Zustandsverzeichnis (`~/.openclaw`)**: Konfiguration, Channel-/Provider-Zustand, Auth-Profile, Sitzungen, Logs
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standardarbeitsbereich ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, ob der Gateway bei jedem Start denselben
    Arbeitsbereich verwendet (und beachten Sie: Der Remote-Modus verwendet den **Arbeitsbereich des Gateway-Hosts**,
    nicht Ihren lokalen Laptop).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, dies **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chatverlauf zu verlassen.

    Siehe [Agent-Arbeitsbereich](/de/concepts/agent-workspace) und [Speicher](/de/concepts/memory).

  </Accordion>

  <Accordion title="Kann ich SOUL.md größer machen?">
    Ja. `SOUL.md` ist eine der Bootstrap-Dateien des Arbeitsbereichs, die in den
    Agentenkontext injiziert werden. Das standardmäßige Injektionslimit pro Datei beträgt `20000` Zeichen,
    und das gesamte Bootstrap-Budget über alle Dateien beträgt `60000` Zeichen.

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

    Oder überschreiben Sie einen Agenten:

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

    Verwenden Sie `/context`, um Rohgrößen im Vergleich zu injizierten Größen zu prüfen und ob eine Kürzung stattgefunden hat.
    Halten Sie `SOUL.md` auf Stimme, Haltung und Persönlichkeit fokussiert; legen Sie Betriebsregeln
    in `AGENTS.md` und dauerhafte Fakten im Speicher ab.

    Siehe [Kontext](/de/concepts/context) und [Agent-Konfiguration](/de/gateway/config-agents).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Arbeitsbereich** in einem **privaten** Git-Repository ab und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub privat). Dadurch werden Speicher + AGENTS/SOUL/USER-
    Dateien erfasst, und Sie können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (Anmeldedaten, Sitzungen, Tokens oder verschlüsselte geheime Nutzdaten).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Arbeitsbereich als auch das Zustandsverzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Arbeitsbereich](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe den eigenen Leitfaden: [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Arbeitsbereichs arbeiten?">
    Ja. Der Arbeitsbereich ist das **standardmäßige cwd** und der Speicheranker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Arbeitsbereichs aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repository das standardmäßige Arbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf das Stammverzeichnis des Repositorys. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Arbeitsbereich getrennt, sofern Sie nicht absichtlich möchten, dass der Agent darin arbeitet.

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

  <Accordion title="Remote-Modus: Wo ist der Sitzungsspeicher?">
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der für Sie relevante Sitzungsspeicher auf dem Remote-Rechner, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo befindet sie sich?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es eher sichere Standardwerte (einschließlich eines Standardarbeitsbereichs von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt, und jetzt lauscht nichts / die UI sagt nicht autorisiert'>
    Nicht-Loopback-Bindings **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Authentifizierung mit gemeinsamem Geheimnis: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten, identitätsbewussten Reverse-Proxy

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Authentifizierung **nicht** allein.
    - Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwortauthentifizierung setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
    - Control-UI-Setups mit gemeinsamem Geheimnis authentifizieren über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätstragende Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie gemeinsame Geheimnisse in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfordern Reverse-Proxies auf demselben Host über Loopback explizit `gateway.auth.trustedProxy.allowLoopback = true` und einen Loopback-Eintrag in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Authentifizierung, einschließlich Loopback. Im normalen Standardpfad bedeutet das Token-Authentifizierung: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird der Gateway-Start in den Token-Modus aufgelöst und erzeugt ein nur für diese Laufzeit gültiges Token für diesen Start, sodass **lokale WS-Clients sich authentifizieren müssen**. Konfigurieren Sie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` oder `OPENCLAW_GATEWAY_PASSWORD` explizit, wenn Clients ein stabiles Geheimnis über Neustarts hinweg benötigen. Dies verhindert, dass andere lokale Prozesse den Gateway aufrufen.

    Wenn Sie einen anderen Authentifizierungspfad bevorzugen, können Sie ausdrücklich den Passwortmodus wählen (oder, für identitätsbewusste Reverse-Proxys, `trusted-proxy`). Wenn Sie **wirklich** offenen Loopback wünschen, setzen Sie `gateway.auth.mode: "none"` ausdrücklich in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach Konfigurationsänderungen neu starten?">
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

    - `off`: blendet den Slogantext aus, behält aber die Banner-Titel-/Versionszeile bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: wechselnde lustige/saisonale Slogans (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Abruf)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
    - Grok kann xAI OAuth aus der Modellauthentifizierung wiederverwenden oder auf `XAI_API_KEY` / die Plugin-Websuche-Konfiguration zurückfallen.
    - Ollama Web Search ist schlüsselfrei, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/selbst gehostet; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Env-Alternativen:

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

    Provider-spezifische Websuche-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Ältere Provider-Pfade `tools.web.search.*` werden vorübergehend noch aus Kompatibilitätsgründen geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Firecrawl-Konfiguration für Web-Fetch-Fallbacks liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht ausdrücklich deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider anhand verfügbarer Zugangsdaten. Das offizielle Firecrawl-Plugin stellt diesen Fallback bereit.
    - Daemons lesen Env-Variablen aus `~/.openclaw/.env` (oder aus der Dienstumgebung).

    Docs: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein Teilobjekt senden, wird alles
    andere entfernt.

    Aktuelles OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - OpenClaw-eigene Konfigurationsschreibvorgänge validieren vor dem Schreiben die vollständige Konfiguration nach der Änderung.
    - Ungültige oder destruktive OpenClaw-eigene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot-Reload beschädigt, schlägt der Gateway geschlossen fehl oder überspringt den Reload; er schreibt `openclaw.json` nicht neu.
    - `openclaw doctor --fix` ist für Reparaturen zuständig und kann die letzte als gut bekannte Konfiguration wiederherstellen, während die abgelehnte Datei als `openclaw.json.clobbered.*` gespeichert wird.

    Wiederherstellen:

    - Prüfen Sie `openclaw logs --follow` auf `Invalid config at`, `Config write rejected:` oder `config reload skipped (invalid config)`.
    - Untersuchen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Führen Sie `openclaw config validate` und `openclaw doctor --fix` aus.
    - Kopieren Sie nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Wenn Sie keine letzte als gut bekannte Konfiguration oder abgelehnte Payload haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre zuletzt bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann häufig aus Logs oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    Vermeiden:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich über einen exakten Pfad oder die Feldstruktur nicht sicher sind; es gibt einen flachen Schemaknoten plus Zusammenfassungen der direkten untergeordneten Elemente für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; verwenden Sie `config.apply` nur für vollständige Konfigurationsersetzung.
    - Wenn Sie das agentenseitige `gateway`-Tool aus einem Agentenlauf verwenden, lehnt es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ab (einschließlich älterer `tools.bash.*`-Aliasse, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Docs: [Konfiguration](/de/cli/config), [Konfigurieren](/de/cli/configure), [Gateway-Fehlerbehebung](/de/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich einen zentralen Gateway mit spezialisierten Workern über mehrere Geräte hinweg?">
    Das gängige Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** verwaltet Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** getrennte Brains/Arbeitsbereiche für besondere Rollen (z. B. „Hetzner ops“, „Personal data“).
    - **Sub-Agents:** starten Hintergrundarbeit von einem Hauptagenten, wenn Sie Parallelität wünschen.
    - **TUI:** mit dem Gateway verbinden und Agenten/Sitzungen wechseln.

    Docs: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [TUI](/de/web/tui).

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

    Standard ist `false` (mit sichtbarem Browser). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet dieselbe **Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die wichtigsten Unterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie visuelle Darstellung benötigen).
    - Manche Websites sind im Headless-Modus strenger gegenüber Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browsersteuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie den Gateway neu.
    Vollständige Konfigurationsbeispiele finden Sie unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Der Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn der Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Node**. Der Gateway läuft anderswo, kann aber
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

    Sicherheitshinweis: Das Koppeln eines macOS-Nodes erlaubt `system.run` auf dieser Maschine. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Docs: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was jetzt?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Zustand: `openclaw status`
    - Kanalzustand: `openclaw channels status`

    Prüfen Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Docs: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine integrierte „Bot-zu-Bot“-Bridge, aber Sie können dies auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chatkanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden und Bot B dann wie üblich antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das den anderen Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    lauscht. Wenn ein Bot auf einem entfernten VPS läuft, richten Sie Ihre CLI über
    SSH/Tailscale auf diesen entfernten Gateway (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einer Maschine ausführen, die den Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Schutzregel hinzu, damit die zwei Bots nicht endlos schleifen (nur Erwähnungen, Kanal-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Docs: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/de/cli/agent), [Agent senden](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Benötige ich separate VPSes für mehrere Agenten?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeweils mit eigenem Arbeitsbereich, Modellstandards
    und Routing. Das ist die normale Einrichtung und deutlich günstiger und einfacher, als
    einen VPS pro Agent zu betreiben.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht teilen möchten. Andernfalls behalten Sie einen Gateway bei und
    verwenden mehrere Agenten oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop zu verwenden, statt SSH von einem VPS?">
    Ja - Nodes sind die erstklassige Methode, um Ihren Laptop von einem entfernten Gateway aus zu erreichen, und sie
    ermöglichen mehr als Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Raspberry Pi-Klasse-Box reicht aus; 4 GB RAM sind reichlich), daher ist ein übliches
    Setup ein dauerhaft eingeschalteter Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Geräte-Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` wird durch Node-Allowlists/Genehmigungen auf diesem Laptop gesteuert.
    - **Mehr Gerätetools.** Nodes stellen zusätzlich zu `system.run` `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Lassen Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus, oder verbinden Sie sich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist für ad-hoc Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Dienst aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, außer Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder macOS-"Node-Modus" in der Menüleisten-App). Für Headless-Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/de/cli/node).

    Für Änderungen an `gateway`, `discovery` und der gehosteten Plugin-Oberfläche ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es eine API-/RPC-Möglichkeit, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: untersucht einen Konfigurations-Teilbaum mit seinem flachen Schemaknoten, passendem UI-Hinweis und Zusammenfassungen der unmittelbaren untergeordneten Elemente vor dem Schreiben
    - `config.get`: ruft den aktuellen Snapshot + Hash ab
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); lädt wenn möglich dynamisch neu und startet neu, wenn erforderlich
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration; lädt wenn möglich dynamisch neu und startet neu, wenn erforderlich
    - Das agentseitige Laufzeittool `gateway` verweigert weiterhin das Umschreiben von `tools.exec.ask` / `tools.exec.security`; Legacy-`tools.bash.*`-Aliase werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine erste Installation">
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
       - Gateway-WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem entfernten Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** am Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Sollte ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie nur **lokale Tools** (Bildschirm/Kamera/Exec) auf dem zweiten Laptop benötigen, fügen Sie ihn als
    **Node** hinzu. So bleibt ein einziges Gateway erhalten und doppelte Konfiguration wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env-vars und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Env-vars aus dem übergeordneten Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`)

    Keine der `.env`-Dateien überschreibt vorhandene Env-vars.
    Provider-Anmeldeinformationsvariablen sind eine Ausnahme für Workspace-`.env`: Schlüssel wie
    `GEMINI_API_KEY`, `XAI_API_KEY` oder `MISTRAL_API_KEY` werden aus Workspace-
    `.env` ignoriert und sollten in der Prozessumgebung, `~/.openclaw/.env` oder Konfiguration `env` liegen.

    Sie können auch Inline-Env-vars in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

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

  <Accordion title="Ich habe das Gateway über den Dienst gestartet und meine Env-vars sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann aufgenommen werden, wenn der Dienst Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie Shell-Import (opt-in Komfortfunktion):

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

    Dies führt Ihre Login-Shell aus und importiert nur fehlende erwartete Schlüssel (überschreibt nie). Entsprechende Env-vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber der Modellstatus zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. "Shell env: off"
    bedeutet **nicht**, dass Ihre Env-vars fehlen - es bedeutet nur, dass OpenClaw Ihre
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Dienst läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das mit einer dieser Optionen:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es dem `env`-Block Ihrer Konfiguration hinzu (wird nur angewendet, wenn es fehlt).

    Starten Sie anschließend das Gateway neu und prüfen Sie erneut:

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
    Sitzungen können nach `session.idleMinutes` ablaufen, aber dies ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie den Wert auf einen positiven Wert, um Ablauf bei Inaktivität zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach der Inaktivitätsperiode eine neue Sitzungs-ID für diesen Chat-Schlüssel.
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

    Trotzdem sollte dies am besten als **unterhaltsames Experiment** betrachtet werden. Es verbraucht viele Tokens und ist oft
    weniger effizient als die Verwendung eines Bots mit getrennten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents CLI](/de/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in der Aufgabe gekürzt? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
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

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie anschließend das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset**, wenn eine vorhandene Konfiguration erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile (`--profile` / `OPENCLAW_PROFILE`) verwendet haben, setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur Dev; löscht Dev-Konfiguration + Anmeldeinformationen + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich erhalte Fehler "context too large" - wie setze ich zurück oder führe Compaction durch?'>
    Verwenden Sie eine dieser Optionen:

    - **Compaction** (behält die Unterhaltung, fasst aber ältere Turns zusammen):

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

    - Aktivieren oder optimieren Sie **Session-Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schemaänderung).

    Lösung: Starten Sie eine neue Sitzung mit `/new` (eigenständige Nachricht).

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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen,
    Markdown-/HTML-Kommentare, Markdown-Überschriften wie `# Heading`, Fence-Marker
    oder leere Checklist-Platzhalter), überspringt OpenClaw den Heartbeat-Lauf, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Überschreibungen pro Agent verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich einem WhatsApp-Gruppenchat ein „Bot-Konto“ hinzufügen?'>
    Nein. OpenClaw läuft über **Ihr eigenes Konto**. Wenn Sie also in der Gruppe sind, kann OpenClaw sie sehen.
    Standardmäßig werden Gruppenantworten blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

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
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkte Chats werden standardmäßig auf die Hauptsitzung zusammengeführt. Gruppen/Kanäle haben eigene Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind separate Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine festen Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Festplattenwachstum:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Betriebsaufwand:** Auth-Profile, Workspaces und Kanalrouting pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (JSONL- oder Store-Einträge löschen), wenn die Festplatte wächst.
    - Verwenden Sie `openclaw doctor`, um verwaiste Workspaces und Profil-Abweichungen zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent Routing**, um mehrere isolierte Agents auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann bestimmten Agents zugeordnet werden.

    Browserzugriff ist leistungsfähig, aber nicht „kann alles tun, was ein Mensch kann“ - Anti-Bot-Mechanismen, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browsersteuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf der Maschine, auf der der Browser tatsächlich läuft.

    Empfohlenes Setup:

    - Immer aktiver Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Kanal/Kanäle an diese Agents gebunden.
    - Lokaler Browser über Chrome MCP oder bei Bedarf über einen Node.

    Dokumentation: [Multi-Agent Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle, Failover und Auth-Profile

Modell-Fragen und -Antworten - Standards, Auswahl, Aliasse, Wechsel, Failover, Auth-Profile -
befinden sich in den [Modell-FAQ](/de/help/faq-models).

## Gateway: Ports, „bereits ausgeführt“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexierten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Warum meldet openclaw gateway status „Runtime: running“, aber „Connectivity probe: failed“?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die Konnektivitätsprüfung ist die CLI, die tatsächlich eine Verbindung zum Gateway-WebSocket herstellt.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die die Prüfung tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Grundursache, wenn der Prozess läuft, der Port aber nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für „Config (cli)“ und „Config (service)“?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Dienst eine andere verwendet (oft eine `--profile`- / `OPENCLAW_STATE_DIR`-Abweichung).

    Behebung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie das aus demselben `--profile` / derselben Umgebung aus, die der Dienst verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet „another gateway instance is already listening“?'>
    OpenClaw erzwingt eine Runtime-Sperre, indem der WebSocket-Listener direkt beim Start gebunden wird (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wird ein `GatewayLockError` ausgelöst, der angibt, dass bereits eine andere Instanz lauscht.

    Behebung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie führe ich OpenClaw im Remote-Modus aus (Client verbindet sich mit einem Gateway an einem anderen Ort)?">
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
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren für sich genommen keine lokale Gateway-Authentifizierung.

  </Accordion>

  <Accordion title='Die Control UI meldet „unauthorized“ (oder verbindet sich ständig neu). Was nun?'>
    Ihr Gateway-Auth-Pfad und die Auth-Methode der UI passen nicht zusammen.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL. Aktualisierungen im selben Tab funktionieren daher weiter, ohne die langlebige Token-Persistenz in localStorage wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten erneuten Versuch mit einem gecachten Gerätetoken starten, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit gecachtem Token verwendet jetzt die gecachten genehmigten Scopes wieder, die mit dem Gerätetoken gespeichert sind. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten weiterhin ihre angeforderte Scope-Menge, statt gecachte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads gilt bei der Verbindungs-Authentifizierung folgende Priorität: explizites gemeinsames Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Der integrierte Setup-Code-Bootstrap ist nur für Nodes. Nach der Genehmigung gibt er ein Node-Gerätetoken mit `scopes: []` zurück und gibt kein übergebenes Operator-Token zurück.

    Behebung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus + kopiert sie, versucht sie zu öffnen; zeigt bei Headless-Betrieb einen SSH-Hinweis).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Bei Remote-Zugriff zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, und fügen Sie dann das passende Geheimnis in den Control-UI-Einstellungen ein.
    - Tailscale Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und Sie die Serve-URL öffnen, nicht eine rohe Loopback-/Tailnet-URL, die Tailscale-Identity-Header umgeht.
    - Trusted-Proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten identitätsbewussten Proxy kommen, nicht über eine rohe Gateway-URL. Loopback-Proxys auf demselben Host benötigen außerdem `gateway.auth.trustedProxy.allowLoopback = true`.
    - Wenn die Abweichung nach dem einen Retry weiterhin besteht, rotieren/genehmigen Sie das gekoppelte Gerätetoken erneut:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotationsaufruf meldet, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen mit gekoppelten Geräten können nur ihr **eigenes** Gerät rotieren, sofern sie nicht zusätzlich `operator.admin` haben
      - explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch blockiert? Führen Sie `openclaw status --all` aus und folgen Sie der [Fehlerbehebung](/de/gateway/troubleshooting). Auth-Details finden Sie unter [Dashboard](/de/web/dashboard).

  </Accordion>

  <Accordion title="Ich habe gateway.bind auf tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    `tailnet`-Bind wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn die Maschine nicht in Tailscale ist (oder die Schnittstelle nicht aktiv ist), gibt es nichts, woran gebunden werden kann.

    Behebung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - Wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt Loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine Bindung nur an das Tailnet möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host ausführen?">
    Normalerweise nein - ein Gateway kann mehrere Messaging-Kanäle und Agents ausführen. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (Konfiguration pro Instanz)
    - `OPENCLAW_STATE_DIR` (Status pro Instanz)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profilkonfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` für manuelle Läufe).
    - Installieren Sie einen Dienst pro Profil: `openclaw --profile <name> gateway install`.

    Profile hängen außerdem Suffixe an Dienstnamen an (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet „invalid handshake“ / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server** und erwartet als allererste Nachricht
    ein `connect`-Frame. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Richtlinienverstoß).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt in einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Behebungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, nehmen Sie das Token/Passwort in das `connect`-Frame auf.

    Wenn Sie die CLI oder TUI verwenden, sollte die URL so aussehen:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging und Debugging

<AccordionGroup>
  <Accordion title="Wo befinden sich die Logs?">
    Datei-Logs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können über `logging.file` einen stabilen Pfad festlegen. Die Log-Stufe für Dateien wird über `logging.level` gesteuert. Die Konsolenausführlichkeit wird über `--verbose` und `logging.consoleLevel` gesteuert.

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
    Verwenden Sie die Gateway-Hilfsbefehle:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie den Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückfordern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen - wie starte ich OpenClaw neu?">
    Es gibt **drei Windows-Installationsmodi**:

    **1) Lokale Windows-Hub-Einrichtung:** Die native App verwaltet einen lokalen, app-eigenen WSL-Gateway.

    Öffnen Sie **OpenClaw Companion** über das Startmenü oder die Taskleiste und verwenden Sie dann
    **Gateway Setup** oder den Tab Connections.

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

    Öffnen Sie PowerShell und führen Sie aus:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie ihn manuell ausführen (ohne Dienst), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows](/de/platforms/windows), [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Der Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einem schnellen Gesundheitscheck:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modellauthentifizierung ist auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Channel-Kopplung/Allowlist blockiert Antworten (prüfen Sie Channel-Konfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote arbeiten, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Channels](/de/channels), [Fehlerbehebung](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Vom Gateway getrennt: kein Grund" - was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft der Gateway? `openclaw gateway status`
    2. Ist der Gateway fehlerfrei? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote: Ist die Tunnel-/Tailscale-Verbindung aktiv?

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

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle, oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy sind, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn der Gateway remote ist, stellen Sie sicher, dass Sie sich die Logs auf dem Gateway-Host ansehen.

    Dokumentation: [Telegram](/de/channels/telegram), [Channel-Fehlerbehebung](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass der Gateway erreichbar ist und der Agent laufen kann:

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

    Dies stoppt/startet den **überwachten Dienst** (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn der Gateway im Hintergrund als Daemon läuft.

    Wenn Sie ihn im Vordergrund ausführen, stoppen Sie mit Ctrl-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Dienst-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrunddienst** neu (launchd/systemd).
    - `openclaw gateway`: führt den Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn Sie den Dienst installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg zu mehr Details, wenn etwas fehlschlägt">
    Starten Sie den Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie anschließend die Log-Datei auf Channel-Authentifizierung, Modellrouting und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agent müssen strukturierte Medienfelder wie `media`, `mediaUrl`, `path` oder `filePath` verwenden. Siehe [OpenClaw-Assistent einrichten](/de/start/openclaw) und [Agent senden](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Ziel-Channel unterstützt ausgehende Medien und wird nicht durch Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048px verkleinert).
    - `tools.fs.workspaceOnly=true` beschränkt Sends mit lokalen Pfaden auf Workspace, temporären/Media-Store und sandbox-validierte Dateien.
    - `tools.fs.workspaceOnly=false` erlaubt strukturierten lokalen Medien-Sends die Verwendung host-lokaler Dateien, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF, Office-Dokumente und validierte Textdokumente wie Markdown/MD, TXT, JSON, YAML und YML). Dies ist kein Geheimnis-Scanner: Eine vom Agent lesbare `secret.txt` oder `config.json` kann angehängt werden, wenn Extension und Inhaltsvalidierung passen. Bewahren Sie sensible Dateien außerhalb agent-lesbarer Pfade auf, oder behalten Sie `tools.fs.workspaceOnly=true` für strengere Sends mit lokalen Pfaden bei.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingaben. Die Standardeinstellungen sind darauf ausgelegt, Risiken zu reduzieren:

    - Standardverhalten auf DM-fähigen Channels ist **Kopplung**:
      - Unbekannte Absender erhalten einen Kopplungscode; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Channel** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur ein Problem für öffentliche Bots?">
    Nein. Bei Prompt Injection geht es um **nicht vertrauenswürdige Inhalte**, nicht nur darum, wer dem Bot eine DM senden kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/-Abruf, Browserseiten, E-Mails,
    Dokumentation, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die versuchen,
    das Modell zu kapern. Das kann selbst dann passieren, wenn **Sie der einzige Absender sind**.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Reduzieren Sie den Wirkungsbereich durch:

    - Verwendung eines schreibgeschützten oder tool-deaktivierten „Reader“-Agent zur Zusammenfassung nicht vertrauenswürdiger Inhalte
    - Deaktivieren von `web_search` / `web_fetch` / `browser` für tool-aktivierte Agenten
    - Behandeln von dekodiertem Datei-/Dokumenttext ebenfalls als nicht vertrauenswürdig: OpenResponses
      `input_file` und Medienanhang-Extraktion umschließen extrahierten Text beide mit
      expliziten Begrenzungsmarkern für externe Inhalte, statt rohen Dateitext weiterzugeben
    - Sandboxing und strikte Tool-Allowlists

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Ist OpenClaw weniger sicher, weil es TypeScript/Node statt Rust/WASM verwendet?">
    Sprache und Runtime sind relevant, aber sie sind nicht das Hauptrisiko für einen persönlichen
    Agent. Die praktischen OpenClaw-Risiken sind Gateway-Exposition, wer dem
    Bot Nachrichten senden kann, Prompt Injection, Tool-Umfang, Umgang mit Anmeldedaten, Browserzugriff, Exec-
    Zugriff und Vertrauen in Skills oder Plugins von Drittanbietern.

    Rust und WASM können für einige Codeklassen stärkere Isolation bieten, aber
    sie lösen keine Prompt Injection, schlechten Allowlists, öffentliche Gateway-Exposition,
    zu weit gefasste Tools oder ein Browserprofil, das bereits bei sensiblen
    Konten angemeldet ist. Behandeln Sie diese als primäre Kontrollen:

    - halten Sie den Gateway privat oder authentifiziert
    - verwenden Sie Kopplung und Allowlists für DMs und Gruppen
    - verweigern oder sandboxen Sie riskante Tools für nicht vertrauenswürdige Eingaben
    - installieren Sie nur vertrauenswürdige Plugins und Skills
    - führen Sie nach Konfigurationsänderungen `openclaw security audit --deep` aus

    Details: [Sicherheit](/de/gateway/security), [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ich habe Berichte über exponierte OpenClaw-Instanzen gesehen. Was sollte ich prüfen?">
    Prüfen Sie zuerst Ihre tatsächliche Bereitstellung:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Eine sicherere Basis ist:

    - Gateway an `loopback` gebunden oder nur über authentifizierten privaten
      Zugriff wie ein Tailnet, SSH-Tunnel, Token-/Passwortauthentifizierung oder einen korrekt
      konfigurierten vertrauenswürdigen Proxy exponiert
    - DMs im Modus `pairing` oder `allowlist`
    - Gruppen auf Allowlist und erwähnungsgesteuert, es sei denn, jedes Mitglied ist vertrauenswürdig
    - Hochrisiko-Tools (`exec`, `browser`, `gateway`, `cron`) verweigert oder eng
      begrenzt für Agenten, die nicht vertrauenswürdige Inhalte lesen
    - Sandboxing aktiviert, wo Tool-Ausführung einen kleineren Wirkungsbereich benötigt

    Öffentliche Bindungen ohne Authentifizierung, offene DMs/Gruppen mit Tools und exponierte Browser-
    Steuerung sind die Befunde, die zuerst behoben werden sollten. Details:
    [Sicherheitsaudit-Checkliste](/de/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Sind ClawHub-Skills und Plugins von Drittanbietern sicher zu installieren?">
    Behandeln Sie Skills und Plugins von Drittanbietern als Code, dem Sie vertrauen möchten.
    ClawHub-Skill-Seiten zeigen vor der Installation den Scan-Status an, aber Scans sind keine
    vollständige Sicherheitsgrenze. OpenClaw führt während Plugin- oder Skill-Installations-/Update-Flows keine integrierte lokale
    Blockierung gefährlichen Codes aus; verwenden Sie
    betreiberverwaltete `security.installPolicy` für lokale Allow-/Block-Entscheidungen.

    Sichereres Muster:

    - bevorzugen Sie vertrauenswürdige Autoren und gepinnte Versionen
    - lesen Sie den Skill oder das Plugin, bevor Sie ihn bzw. es aktivieren
    - halten Sie Plugin- und Skill-Allowlists eng
    - führen Sie Workflows mit nicht vertrauenswürdigen Eingaben in einer Sandbox mit minimalen Tools aus
    - vermeiden Sie, Drittanbieter-Code breiten Dateisystem-, Exec-, Browser- oder Geheimniszugriff zu geben

    Details: [Skills](/de/tools/skills), [Plugins](/de/tools/plugin),
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot eine eigene E-Mail-Adresse, ein eigenes GitHub-Konto oder eine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolierung des Bots mit separaten Konten und Telefonnummern
    reduziert den Schadensradius, falls etwas schiefgeht. Dadurch ist es auch einfacher,
    Zugangsdaten zu rotieren oder Zugriff zu widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Gewähren Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern
    Sie ihn später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Kopplung](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben, und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Belassen Sie Direktnachrichten im **Kopplungsmodus** oder in einer engen Allowlist.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn er in Ihrem Namen Nachrichten senden soll.
    - Lassen Sie ihn einen Entwurf erstellen und **genehmigen Sie ihn vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie dies mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für Aufgaben eines persönlichen Assistenten verwenden?">
    Ja, **wenn** der Agent nur chattet und die Eingabe vertrauenswürdig ist. Kleinere Stufen sind
    anfälliger für Instruction Hijacking. Vermeiden Sie sie daher für Agents mit aktivierten Tools
    oder beim Lesen nicht vertrauenswürdiger Inhalte. Wenn Sie ein kleineres Modell verwenden müssen, sperren Sie
    Tools ab und führen Sie es in einer Sandbox aus. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Kopplungscode erhalten">
    Kopplungscodes werden **nur** gesendet, wenn ein unbekannter Absender dem Bot eine Nachricht sendet und
    `dmPolicy: "pairing"` aktiviert ist. `/start` allein erzeugt keinen Code.

    Ausstehende Anfragen prüfen:

    ```bash
    openclaw pairing list telegram
    ```

    Wenn Sie sofortigen Zugriff möchten, nehmen Sie Ihre Absender-ID in die Allowlist auf oder setzen Sie `dmPolicy: "open"`
    für dieses Konto.

  </Accordion>

  <Accordion title="WhatsApp: Wird es meinen Kontakten Nachrichten senden? Wie funktioniert die Kopplung?">
    Nein. Die Standardrichtlinie für WhatsApp-Direktnachrichten ist **Kopplung**. Unbekannte Absender erhalten nur einen Kopplungscode, und ihre Nachricht wird **nicht verarbeitet**. OpenClaw antwortet nur auf Chats, die es empfängt, oder auf explizite Sendevorgänge, die Sie auslösen.

    Kopplung genehmigen mit:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Ausstehende Anfragen auflisten:

    ```bash
    openclaw pairing list whatsapp
    ```

    Telefonnummernabfrage im Assistenten: Sie wird verwendet, um Ihre **Allowlist/Ihren Eigentümer** festzulegen, damit Ihre eigenen Direktnachrichten zugelassen sind. Sie wird nicht zum automatischen Senden verwendet. Wenn Sie Ihre persönliche WhatsApp-Nummer verwenden, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Abbrechen von Aufgaben und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemmeldungen im Chat angezeigt werden?">
    Die meisten internen Meldungen oder Tool-Meldungen erscheinen nur, wenn **verbose**, **trace** oder **reasoning**
    für diese Sitzung aktiviert ist.

    Beheben Sie es in dem Chat, in dem Sie es sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin zu ausführlich ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Vergewissern Sie sich außerdem, dass Sie kein Bot-Profil verwenden, bei dem `verboseDefault` in der Konfiguration
    auf `on` gesetzt ist.

    Dokumentation: [Denken und verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security/index#reasoning-and-verbose-output-in-groups).

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

    Für Hintergrundprozesse (aus dem exec-Tool) können Sie den Agent bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht der Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für zugelassene Absender auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram aus? („Cross-context messaging denied“)'>
    OpenClaw blockiert **Provider-übergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf
    an Telegram gebunden ist, sendet er nicht an Discord, es sei denn, Sie erlauben dies ausdrücklich.

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

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnell aufeinanderfolgende Nachrichten „ignorieren“?'>
    Prompts während eines laufenden Runs werden standardmäßig in den aktiven Run gelenkt. Verwenden Sie `/queue`, um das Verhalten des aktiven Runs auszuwählen:

    - `steer` - den aktiven Run an der nächsten Modellgrenze steuern
    - `followup` - Nachrichten einreihen und nach dem Ende des aktuellen Runs nacheinander ausführen
    - `collect` - kompatible Nachrichten einreihen und nach dem Ende des aktuellen Runs einmal antworten
    - `interrupt` - aktuellen Run abbrechen und neu starten

    Der Standardmodus ist `steer`. Für eingereihte Modi können Sie Optionen wie `debounce:0.5s cap:25 drop:summarize` hinzufügen. Siehe [Befehlswarteschlange](/de/concepts/queue) und [Steuerungswarteschlange](/de/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Verschiedenes

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API-Schlüssel?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic-API-Schlüssels in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet dies, dass der Gateway keine Anthropic-Anmeldedaten in der erwarteten `auth-profiles.json` für den ausgeführten Agent finden konnte.
  </Accordion>
</AccordionGroup>

---

Kommen Sie immer noch nicht weiter? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).

## Verwandte Themen

- [FAQ zum ersten Start](/de/help/faq-first-run) — Installation, Onboarding, Authentifizierung, Abonnements, frühe Fehler
- [Modelle-FAQ](/de/help/faq-models) — Modellauswahl, Failover, Auth-Profile
- [Fehlerbehebung](/de/help/troubleshooting) — symptomorientierte Triage
