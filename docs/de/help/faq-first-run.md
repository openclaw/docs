---
read_when:
    - Neuinstallation, festgefahrenes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-07-24T04:36:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e1c93b89da625ae5f092db854c9b74adc005be75dd913af4bf89ed1a4f35396a
    source_path: help/faq-first-run.md
    workflow: 16
---

Schnellstart und Fragen und Antworten zur Ersteinrichtung. Informationen zum täglichen Betrieb, zu Modellen, Authentifizierung, Sitzungen
und Fehlerbehebung finden Sie in den zentralen [FAQ](/de/help/faq).

## Schnellstart und Ersteinrichtung

<AccordionGroup>
  <Accordion title="Ich komme nicht weiter – wie erhalte ich am schnellsten Hilfe?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. In den meisten Fällen, in denen jemand nicht weiterkommt,
    liegt ein **lokales Konfigurations- oder Umgebungsproblem** vor, das eine entfernte Hilfsperson nicht untersuchen kann. Daher ist dies effektiver
    als eine Frage in Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Stellen Sie dem Agenten über die anpassbare Git-Installation den vollständigen Quellcode-Checkout bereit, damit er
    Code und Dokumentation lesen und die von Ihnen ausgeführte genaue Version berücksichtigen kann:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bitten Sie den Agenten, die Fehlerbehebung schrittweise zu planen und zu überwachen und anschließend nur die
    erforderlichen Befehle auszuführen – kleinere Diffs lassen sich leichter prüfen.

    Geben Sie diese Ausgaben an, wenn Sie um Hilfe bitten (in Discord oder einem GitHub-Issue):

    | Befehl | Zeigt |
    | --- | --- |
    | `openclaw status` | Zustand von Gateway und Agent sowie grundlegende Konfigurationsübersicht |
    | `openclaw status --all` | Vollständige schreibgeschützte Diagnose, die eingefügt werden kann |
    | `openclaw models status` | Provider-Authentifizierung und Modellverfügbarkeit |
    | `openclaw doctor` | Prüft und repariert häufige Konfigurations- und Statusprobleme |
    | `openclaw logs --follow` | Live-Protokollausgabe |
    | `openclaw gateway status --deep` | Eingehende Zustandsprüfung von Gateway, Konfiguration und Plugins |
    | `openclaw health --verbose` | Ausführlicher Zustandsbericht |

    Haben Sie einen echten Fehler oder eine Lösung gefunden? Erstellen Sie ein Issue oder senden Sie einen PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull Requests](https://github.com/openclaw/openclaw/pulls).

    Schnelle Debugging-Schleife: [Die ersten 60 Sekunden, wenn etwas nicht funktioniert](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Gründe dafür?">
    | Grund für das Überspringen | Bedeutung |
    | --- | --- |
    | `quiet-hours` | Außerhalb des konfigurierten Zeitfensters für aktive Stunden |
    | `empty-heartbeat-file` | Das Arbeitsdokument des Heartbeat-Monitors ist vorhanden, enthält aber nur leere Inhalte, Kommentare, Überschriften, Codeblöcke oder eine leere Checklistenstruktur |
    | `alerts-disabled` | Die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle deaktiviert) |

    Ältere Heartbeat-Blöcke vom Typ `tasks:` werden mit `openclaw doctor --fix` zu unabhängig geplanten Cron-Aufträgen migriert.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zur Installation und Einrichtung von OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Noch keine globale Installation? Führen Sie stattdessen `pnpm openclaw onboard` aus. Wenn Assets der Control UI
    fehlen, versucht die Ersteinrichtung, sie selbst zu erstellen, und greift andernfalls auf `pnpm ui:build` zurück.

  </Accordion>

  <Accordion title="Wie öffne ich nach der Ersteinrichtung das Dashboard?">
    Die Ersteinrichtung öffnet unmittelbar nach der Einrichtung im Browser eine saubere Dashboard-URL ohne Token
    und gibt den Link in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet. Falls er nicht geöffnet wurde,
    kopieren Sie die ausgegebene URL und fügen Sie sie auf demselben Rechner ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost beziehungsweise aus der Ferne?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn eine Authentifizierung mit einem gemeinsamen Geheimnis angefordert wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwortquelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Noch kein gemeinsames Geheimnis konfiguriert? Führen Sie `openclaw doctor --generate-gateway-token` (oder `openclaw doctor --fix --generate-gateway-token`) aus.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie die Bindung an Loopback bei, führen Sie `openclaw gateway --tailscale serve` aus und öffnen Sie `https://<magicdns>/`. Mit `gateway.auth.allowTailscale: true` erfüllen Identitätsheader die Authentifizierungsanforderungen der Control UI und von WebSocket (kein Einfügen eines gemeinsamen Geheimnisses; setzt einen vertrauenswürdigen Gateway-Host voraus). HTTP-APIs benötigen weiterhin eine Authentifizierung mit einem gemeinsamen Geheimnis, sofern Sie nicht bewusst Private-Ingress über `none` oder HTTP-Authentifizierung über einen vertrauenswürdigen Proxy verwenden.
      Gleichzeitig stattfindende fehlgeschlagene Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor die Begrenzung fehlgeschlagener Authentifizierungen sie erfasst. Daher kann bereits bei einem zweiten fehlerhaften Versuch `retry later` angezeigt werden.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie die Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie das zugehörige gemeinsame Geheimnis in die Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse-Proxy**: Lassen Sie das Gateway hinter einem vertrauenswürdigen Proxy, setzen Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie die Proxy-URL. Loopback-Proxys auf demselben Host benötigen ausdrücklich `gateway.auth.trustedProxy.allowLoopback: true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`; öffnen Sie anschließend `http://127.0.0.1:18789/`. Die Authentifizierung mit einem gemeinsamen Geheimnis gilt auch über den Tunnel. Fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Weitere Informationen zu Bindungsmodi und Authentifizierung finden Sie unter [Dashboard](/de/web/dashboard) und [Weboberflächen](/de/web).

  </Accordion>

  <Accordion title="Warum gibt es für Genehmigungen im Chat zwei Konfigurationen für Ausführungsgenehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec` – leitet Genehmigungsaufforderungen an Chat-Ziele weiter.
    - `channels.<channel>.execApprovals` – macht diesen Kanal zu einem nativen Genehmigungsclient für Ausführungsgenehmigungen.

    Die Ausführungsrichtlinie des Hosts bleibt die eigentliche Genehmigungsschranke. Die Chat-Konfiguration steuert lediglich, wo
    Aufforderungen erscheinen und wie Personen darauf antworten.

    Beide werden nur selten benötigt:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal die genehmigenden Personen sicher ermitteln kann, aktiviert OpenClaw automatisch native Genehmigungen mit Vorrang für Direktnachrichten, sofern `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder `"auto"` lautet.
    - Wenn native Genehmigungskarten oder -schaltflächen verfügbar sind, hat diese UI Vorrang. Erwähnen Sie einen manuellen Befehl vom Typ `/approve` nur, wenn das Werkzeugergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch andere Chats oder ausdrücklich angegebene Betriebsräume erreichen müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Genehmigungsaufforderungen im ursprünglichen Raum beziehungsweise Thema veröffentlicht werden sollen.
    - Plugin-Genehmigungen sind davon getrennt: standardmäßig `/approve` im selben Chat, optional eine Weiterleitung über `approvals.plugin`; nur einige native Kanäle behalten auch dafür die native Verarbeitung bei.

    Kurz gesagt: Die Weiterleitung dient dem Routing, die Konfiguration als nativer Client einer umfangreicheren kanalspezifischen Benutzerführung.
    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung benötige ich?">
    Node **22.22.3+**, **24.15+** oder **25.9+** ist erforderlich (Node 24 wird empfohlen). `pnpm` ist der Paketmanager des Repositorys.
    Bun kann Abhängigkeiten installieren und Paketskripte ausführen, jedoch weder die OpenClaw-CLI noch das Gateway ausführen, da `node:sqlite` fehlt.
  </Accordion>

  <Accordion title="Läuft OpenClaw auf Raspberry Pi?">
    Ja, prüfen Sie jedoch zuerst den Arbeitsspeicher: Pi 5 und Pi 4 (ab 2 GB) sind optimal; Pi 3B+ (1 GB) funktioniert, ist aber langsam; Pi Zero 2 W (512 MB) wird nicht empfohlen.

    | Modell | RAM | Eignung |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Am besten |
    | Pi 4 | 4 GB | Gut |
    | Pi 4 | 2 GB | Ausreichend, Auslagerungsspeicher hinzufügen |
    | Pi 4 | 1 GB | Knapp |
    | Pi 3B+ | 1 GB | Langsam |
    | Pi Zero 2 W | 512 MB | Nicht empfohlen |

    Absolutes Minimum: 1 GB RAM, 1 Kern, 500 MB freier Speicherplatz und ein 64-Bit-Betriebssystem. Da auf dem Pi nur
    das Gateway ausgeführt wird und die Modelle Cloud-APIs aufrufen, bewältigt selbst ein einfacher Pi die Last.

    Ein kleiner Pi oder VPS kann auch ausschließlich das Gateway hosten, während Sie **Nodes** auf Ihrem
    Laptop oder Smartphone für lokale Bildschirm-, Kamera- und Canvas-Funktionen oder die Befehlsausführung koppeln. Siehe [Nodes](/de/nodes).

    Vollständige Einrichtungsanleitung: [Raspberry Pi](/de/install/raspberry-pi).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    - Verwenden Sie ein **64-Bit**-Betriebssystem und nicht die 32-Bit-Version von Raspberry Pi OS.
    - Fügen Sie bei Boards mit höchstens 2 GB Auslagerungsspeicher hinzu.
    - Verwenden Sie für bessere Leistung und längere Lebensdauer vorzugsweise eine **USB-SSD** statt einer SD-Karte.
    - Bevorzugen Sie die anpassbare Git-Installation, damit Sie Protokolle einsehen und schnell aktualisieren können.
    - Beginnen Sie ohne Kanäle und Skills und fügen Sie sie einzeln hinzu.
    - Ungewöhnliche Binärdateifehler („exec format error“) entstehen normalerweise dadurch, dass für ein optionales Skill-Werkzeug kein ARM64-Build vorhanden ist.

    Vollständige Anleitung: [Raspberry Pi](/de/install/raspberry-pi). Siehe auch [Linux](/de/platforms/linux).

  </Accordion>

  <Accordion title="Die Anzeige bleibt bei „Weck auf, mein Freund“ hängen oder die Ersteinrichtung schlüpft nicht. Was nun?">
    Diese Anzeige setzt voraus, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet beim ersten Schlüpfen außerdem automatisch
    „Weck auf, mein Freund!“, wenn ein Modell-Provider konfiguriert ist. Wenn Sie die Modell- oder Authentifizierungseinrichtung
    übersprungen haben, zeigt die Ersteinrichtung einen Hinweis „Modellauthentifizierung fehlt“ an und öffnet die
    TUI, ohne etwas zu senden. Fügen Sie mit `openclaw configure --section model` einen Provider hinzu.
    Wenn die Wecknachricht **ohne Antwort** angezeigt wird und die Token-Anzahl bei 0 bleibt, wurde der Agent nie ausgeführt.

    1. Starten Sie das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status und Authentifizierung:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hängt der Vorgang weiterhin? Führen Sie Folgendes aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway entfernt ausgeführt wird, vergewissern Sie sich, dass die Tunnel- beziehungsweise Tailscale-Verbindung aktiv ist und die UI
    auf das richtige Gateway verweist. Siehe [Fernzugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich meine Einrichtung auf einen neuen Rechner migrieren, ohne die Ersteinrichtung zu wiederholen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Arbeitsbereich** und führen Sie anschließend einmal Doctor aus:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Arbeitsbereich (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Anmeldedaten, Sitzungen und Speicher erhalten. Ihr Bot bleibt
    exakt derselbe, sofern Sie **beide** Speicherorte kopieren. Im Remote-Modus verwaltet der
    Gateway-Host den Sitzungsspeicher und den Arbeitsbereich.

    **Wichtig:** Wenn Sie nur Ihren Arbeitsbereich an GitHub committen und pushen, sichern Sie
    **Speicher und Bootstrap-Dateien**, jedoch weder den Sitzungsverlauf noch die Authentifizierung. Diese befinden sich unter
    `~/.openclaw/` (beispielsweise `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Verwandte Themen: [Migration](/de/install/migrating), [Speicherorte auf dem Datenträger](/de/help/faq#where-things-live-on-disk),
    [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo kann ich sehen, was in der neuesten Version neu ist?">
    Sehen Sie im GitHub-Änderungsprotokoll nach:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt **Unveröffentlicht** lautet, ist der nächste
    datierte Abschnitt die neueste veröffentlichte Version. Die Einträge sind unter **Höhepunkte**, **Änderungen**
    und **Fehlerbehebungen** gruppiert; bei Bedarf gibt es außerdem Abschnitte für Dokumentation und weitere Themen.

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie diese Funktion oder setzen Sie `docs.openclaw.ai` auf die Positivliste und versuchen Sie es erneut. Helfen Sie uns,
    die Blockierung aufzuheben: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Immer noch blockiert? Die Dokumentation wird auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm-Dist-Tags**, keine separaten Codezweige:

    - `latest` = Stable
    - `beta` = frühe Version zum Testen (fällt auf `latest` zurück, wenn Beta fehlt oder älter als das aktuelle Stable-Release ist)

    Ein Stable-Release erscheint normalerweise zuerst unter **Beta**; anschließend verschiebt ein expliziter Hochstufungsschritt
    dieselbe Version nach `latest`, ohne die Versionsnummer zu ändern. Maintainer
    können auch direkt unter `latest` veröffentlichen. Deshalb können Beta und Stable nach der
    Hochstufung auf **dieselbe Version** verweisen.

    Änderungen anzeigen: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Installations-Einzeiler und den Unterschied zwischen Beta und Dev finden Sie im nächsten Akkordeon.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und worin besteht der Unterschied zwischen Beta und Dev?">
    **Beta** ist das npm-Dist-Tag `beta` (kann nach der Hochstufung mit `latest` übereinstimmen).
    **Dev** ist der jeweils aktuelle Stand von `main` (Git); bei einer Veröffentlichung auf npm wird das Dist-Tag `dev` verwendet.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installationsprogramm (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Weitere Details: [Entwicklungskanäle](/de/install/development-channels) und [Installationsprogramm-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie kann ich die neuesten Änderungen ausprobieren?">
    Zwei Optionen:

    1. **Dev-Kanal (vorhandene Installation):**

    ```bash
    openclaw update --channel dev
    ```

    Dies wechselt zu einem Git-Checkout von `main`, führt einen Rebase auf den Upstream-Stand durch, erstellt das Projekt und installiert
    die CLI aus diesem Checkout.

    2. **Anpassbare Git-Installation (neues System):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bevorzugen Sie einen manuellen Klonvorgang:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Aktualisieren](/de/cli/update), [Entwicklungskanäle](/de/install/development-channels), [Installation](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten.
    - **QuickStart-Onboarding:** einige Minuten (Loopback-Gateway, automatisches Token, Standard-Workspace).
    - **Erweitertes/vollständiges Onboarding:** dauert länger, wenn Provider-Anmeldung, Kanalkopplung, Daemon-Installation, Netzwerkdownloads oder Skills zusätzliche Einrichtung erfordern.

    Der Assistent zeigt diesen Zeitplan vorab an. Überspringen Sie optionale Schritte und kehren Sie später mit
    `openclaw configure` zurück.

    Bleibt der Vorgang hängen? Lesen Sie oben [Ich komme nicht weiter](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installationsprogramm hängt? Wie erhalte ich mehr Rückmeldungen?">
    Führen Sie es erneut mit `--verbose` aus:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` verfügt über keinen eigenen Ausführlichkeits-Schalter; führen Sie es stattdessen innerhalb von `Set-PSDebug -Trace 1` /
    `-Trace 0` aus. Vollständige Flag-Referenz: [Installationsprogramm-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation wird „git not found“ oder „openclaw not recognized“ angezeigt">
    Zwei häufige Windows-Probleme:

    **1) npm error spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass sich `git` im PATH befindet.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann das Installationsprogramm nochmals aus.

    **2) openclaw is not recognized after install**

    - Der globale npm-bin-Ordner befindet sich nicht im PATH.
    - Überprüfen Sie ihn: `npm config get prefix`.
    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (kein Suffix `\bin` erforderlich; auf den meisten Systemen lautet es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut.

    Bevorzugen Sie eine Desktop-App? Verwenden Sie **Windows Hub**. Für eine reine Terminal-Einrichtung werden sowohl das PowerShell-
    Installationsprogramm als auch WSL2-Gateway-Pfade unterstützt. Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Windows-Ausgabe von exec zeigt verstümmelten chinesischen Text – was kann ich tun?">
    Ursache ist normalerweise eine nicht übereinstimmende Konsolencodepage in nativen Windows-Shells.

    Symptome: Die Ausgabe von `system.run`/`exec` stellt chinesischen Text als fehlerhafte Zeichen dar; derselbe Befehl
    sieht in einem anderen Terminalprofil korrekt aus.

    Problemumgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie anschließend das Gateway neu und versuchen Sie es erneut:

    ```powershell
    openclaw gateway restart
    ```

    Tritt das Problem mit der neuesten OpenClaw-Version weiterhin auf? Verfolgen/melden Sie es hier: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie erhalte ich eine bessere Antwort?">
    Verwenden Sie die anpassbare Git-Installation, damit Ihnen der vollständige Quellcode und die Dokumentation lokal vorliegen. Fragen Sie anschließend
    Ihren Bot (oder Claude/Codex) **aus diesem Ordner heraus**, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installation](/de/install) und [Installationsprogramm-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    - Schnellinstallation unter Linux + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installationsprogramm + Aktualisierungen: [Installation und Aktualisierungen](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS ist geeignet. Installieren Sie OpenClaw auf dem Server und greifen Sie anschließend über SSH/Tailscale auf das Gateway zu.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Fernzugriff: [Gateway-Fernzugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo finde ich die Installationsanleitungen für Cloud/VPS?">
    Hosting-Übersicht mit gängigen Providern:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    In der Cloud wird das **Gateway auf dem Server ausgeführt**, und Sie greifen von Ihrem Laptop/Telefon
    über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand und Workspace befinden sich auf dem Server. Behandeln Sie
    den Host daher als maßgebliche Quelle und sichern Sie ihn.

    Koppeln Sie **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway, um lokale
    Bildschirm-/Kamera-/Canvas-Funktionen oder die Befehlsausführung auf Ihrem Laptop zu nutzen, während das Gateway
    in der Cloud verbleibt.

    Übersicht: [Plattformen](/de/platforms). Fernzugriff: [Gateway-Fernzugriff](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw anweisen, sich selbst zu aktualisieren?">
    Möglich, aber nicht empfohlen. Der Aktualisierungsvorgang kann das Gateway neu starten (wodurch die
    aktive Sitzung getrennt wird), einen sauberen Git-Checkout erfordern und eine Bestätigungsabfrage anzeigen.
    Sicherer ist es, Aktualisierungen als Operator über eine Shell auszuführen.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatisierung über einen Agenten:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Aktualisieren](/de/cli/update), [Aktualisierungen](/de/install/updating).

  </Accordion>

  <Accordion title="Was geschieht beim Onboarding konkret?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt er durch folgende Schritte:

    1. **Modell/Authentifizierung** – Provider-OAuth, API-Schlüssel oder manuelle Authentifizierung (einschließlich lokaler Optionen wie LM Studio); Auswahl eines Standardmodells.
    2. **Workspace** – Speicherort + Bootstrap-Dateien.
    3. **Gateway** – Port, Bind-Adresse, Authentifizierungsmodus, Tailscale-Freigabe.
    4. **Kanäle** – integrierte und offizielle Plugin-Chatkanäle: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
    5. **Daemon** – LaunchAgent (macOS), systemd-Benutzereinheit (Linux/WSL2) oder native geplante Windows-Aufgabe.
    6. **Integritätsprüfung** – startet das Gateway und überprüft, ob es ausgeführt wird.
    7. **Skills** – installiert empfohlene Skills und optionale Abhängigkeiten.

    Zu Beginn werden Angaben zur voraussichtlichen Dauer angezeigt und Sie werden gewarnt, wenn Ihr konfiguriertes Modell unbekannt ist
    oder die Authentifizierung fehlt. Vollständige Aufschlüsselung: [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Benötige ich ein Claude- oder OpenAI-Abonnement, um OpenClaw auszuführen?">
    Nein. Führen Sie OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder **ausschließlich lokalen Modellen** aus,
    damit Ihre Daten auf Ihrem Gerät verbleiben. Abonnements (Claude Pro/Max, ChatGPT/Codex) sind
    optionale Möglichkeiten, sich bei diesen Providern zu authentifizieren.

    Bei Anthropic ermöglicht ein **API-Schlüssel** die übliche nutzungsabhängige Abrechnung; die **Claude CLI**
    verwendet eine bestehende Claude-Code-Anmeldung auf demselben Host wieder. Anthropic behandelt den nicht interaktiven
    `claude -p`-Pfad der Claude CLI derzeit als Agent-SDK-/programmatische Nutzung, die
    weiterhin auf die Limits Ihres Abonnementtarifs angerechnet wird – prüfen Sie die aktuelle Anthropic-Abrechnungsdokumentation,
    bevor Sie sich auf das Abonnementverhalten verlassen. Für langlebige Gateway-Hosts und gemeinsam genutzte
    Automatisierungen ist ein Anthropic-API-Schlüssel die berechenbarere Wahl.

    OpenAI-Codex-OAuth (ChatGPT/Codex-Abonnement) wird für Agentenmodelle vollständig unterstützt.
    OpenClaw unterstützt außerdem gehostete abonnementbasierte Optionen wie den **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** und **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja. OpenClaw unterstützt die Wiederverwendung der Claude CLI für Pro-/Max-/Team-/Enterprise-Tarife. Anthropic
    behandelt den von OpenClaw verwendeten `claude -p`-Pfad derzeit als Nutzung im Rahmen des Abonnementtarifs und gemäß
    dessen Limits, nicht als separates kostenloses Kontingent – aktuelle Abrechnungsdetails und Links zu
    Anthronics eigenen Supportartikeln finden Sie unter [Anthropic](/de/providers/anthropic). Für eine möglichst berechenbare serverseitige Einrichtung verwenden Sie stattdessen einen
    Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title="Unterstützen Sie die Authentifizierung per Claude-Abonnement (Claude Pro oder Max)?">
    Ja, durch Wiederverwendung der Claude CLI. Anthronics Abrechnungsbehandlung der `claude -p`-/Agent-SDK-Nutzung
    hat sich im Laufe der Zeit geändert. Den aktuellen Stand und
    datierte Links zu Anthronics Supportartikeln finden Sie unter [Anthropic](/de/providers/anthropic), bevor Sie sich auf ein bestimmtes Abrechnungsverhalten
    verlassen.

    Die Authentifizierung mit einem Anthropic-Setup-Token wird ebenfalls weiterhin als Token-Pfad unterstützt, OpenClaw bevorzugt jedoch
    die Wiederverwendung der Claude CLI und `claude -p`, sofern verfügbar. Für Produktions- oder Mehrbenutzer-
    Workloads bleibt ein Anthropic-API-Schlüssel die sicherere und besser vorhersehbare Wahl. Weitere
    gehostete Optionen im Abonnementmodell: [OpenAI](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum wird mir von Anthropic der HTTP-Fehler 429 rate_limit_error angezeigt?">
    Ihr **Anthropic-Kontingent bzw. Ratenlimit** ist für das aktuelle Zeitfenster ausgeschöpft. Warten Sie bei der **Claude
    CLI**, bis das Zeitfenster zurückgesetzt wird, oder führen Sie ein Upgrade Ihres Tarifs durch. Prüfen Sie bei einem **Anthropic-API-Schlüssel**
    die Nutzung und Abrechnung in der Anthropic Console und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung ausdrücklich `Extra usage is required for long context requests` lautet,
    versucht die Anfrage, das 1M-Kontextfenster von Anthropic zu verwenden (ein allgemein verfügbares 1M-Modell der Claude-4.x-
    Reihe oder die veraltete Konfiguration `params.context1m: true`), und Ihre aktuellen Anmeldedaten sind nicht
    für die Abrechnung langer Kontexte berechtigt.

    Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiterhin antwortet, während ein Provider ratenbegrenzt ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [Anthropic 429: Zusätzliche Nutzung für lange Kontexte erforderlich](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw verfügt über einen gebündelten Provider für **Amazon Bedrock (Converse)**. Wenn AWS-Umgebungs-
    marker vorhanden sind (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    aktiviert OpenClaw den impliziten Bedrock-Provider automatisch für die Modellerkennung; andernfalls
    legen Sie `plugins.entries.amazon-bedrock.config.discovery.enabled: true` fest oder fügen Sie einen manuellen
    Provider-Eintrag hinzu. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models).
    Ein OpenAI-kompatibler Proxy vor Bedrock bleibt eine gültige Option, wenn Sie einen verwalteten Schlüsselfluss bevorzugen.
  </Accordion>

  <Accordion title="Wie funktioniert die Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Codex** über OAuth (ChatGPT-Anmeldung). Eine neue
    Einrichtung ohne primäres Modell verwendet exakt `openai/gpt-5.6-sol` für die
    ChatGPT-/Codex-Abonnementauthentifizierung sowie die native Ausführung über den Codex-App-Server.
    Bei einer erneuten Authentifizierung bleibt ein vorhandenes, explizit festgelegtes Modell erhalten, einschließlich
    `openai/gpt-5.5`. Wenn der Codex-Workspace GPT-5.6 nicht bereitstellt, wählen Sie
    ausdrücklich `openai/gpt-5.5`; OpenClaw führt kein stillschweigendes Downgrade durch. Veraltete
    Modellreferenzen mit Codex-Präfix sind eine veraltete Konfiguration, die durch `openclaw doctor
    --fix` repariert wird. Der direkte Zugriff per OpenAI-API-Schlüssel bleibt für OpenAI-
    API-Oberflächen ohne Agent sowie über ein geordnetes API-Schlüsselprofil `openai` auch für Agenten-
    modelle verfügbar. Siehe [Modell-Provider](/de/concepts/model-providers) und
    [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin das veraltete OpenAI-Codex-Präfix?">
    `openai` ist die aktuelle Provider- und Authentifizierungsprofil-ID sowohl für OpenAI-API-Schlüssel als auch für
    ChatGPT-/Codex-OAuth – OpenAI Codex ist darin zusammengeführt. In älteren Konfigurationen und Migrationswarnungen
    wird möglicherweise weiterhin das veraltete Präfix `openai-codex` angezeigt:

    - `openai/gpt-5.6-sol` = neue Einrichtung eines ChatGPT-/Codex-Abonnements mit der nativen Codex-Laufzeit für Agentendurchläufe.
    - `openai/gpt-5.5` = explizit unterstützte Auswahl für bestehende Konfigurationen oder Konten ohne Zugriff auf GPT-5.6.
    - Veraltete Modellreferenzen `openai-codex/*` = veraltete Route, die durch `openclaw doctor --fix` repariert wird.
    - `openai/gpt-5.5` plus ein geordnetes API-Schlüsselprofil `openai` = Authentifizierung per API-Schlüssel für ein OpenAI-Agentenmodell.
    - Veraltete Authentifizierungsprofil-IDs `openai-codex` = veraltete IDs, die durch `openclaw doctor --fix` migriert werden.

    Möchten Sie die Abrechnung direkt über die OpenAI Platform abwickeln? Legen Sie `OPENAI_API_KEY` fest. Möchten Sie die
    ChatGPT-/Codex-Abonnementauthentifizierung verwenden? Führen Sie `openclaw models auth login --provider openai` aus. Behalten Sie
    Modellreferenzen unter dem kanonischen Provider `openai/*`. Eine neue Abonnement-
    einrichtung verwendet exakt `openai/gpt-5.6-sol`; Doctor repariert veraltete Referenzen mit Codex-Präfix,
    ohne eine explizite Auswahl von `openai/gpt-5.5` zu aktualisieren.

  </Accordion>

  <Accordion title="Warum können sich die Limits von Codex OAuth von denen der ChatGPT-Webversion unterscheiden?">
    Codex OAuth verwendet von OpenAI verwaltete, tarifabhängige Kontingentzeitfenster, die sich von der
    Nutzung auf der ChatGPT-Website bzw. in der App unterscheiden können, selbst bei demselben Konto.

    `openclaw models status` zeigt die aktuell sichtbaren Nutzungs- und Kontingentzeitfenster des Providers an,
    erfindet oder überführt jedoch keine Berechtigungen der ChatGPT-Webversion in direkten API-Zugriff. Verwenden Sie für den
    direkten Abrechnungs- und Limitpfad der OpenAI Platform `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Wird die OpenAI-Abonnementauthentifizierung (Codex OAuth) unterstützt?">
    Ja, vollständig. OpenAI erlaubt die Verwendung von Abonnement-OAuth in externen
    Tools und Workflows wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID und kein Geheimnis in `openclaw.json`.

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` in `PATH` enthalten ist:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google/gemini-3.1-pro-preview` (Laufzeit `google-gemini-cli`)
    5. Schlagen Anfragen nach der Anmeldung fehl? Legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest und versuchen Sie es erneut.

    OAuth-Token werden in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Google](/de/providers/google), [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Eignet sich ein lokales Modell für gelegentliche Chats?">
    Normalerweise nicht. OpenClaw benötigt einen großen Kontext und hohe Sicherheit; kleine Grafikkarten kürzen den Kontext
    und umgehen die serverseitigen Sicherheitsfilter des Providers. Falls es unbedingt erforderlich ist, führen Sie lokal den **größten**
    möglichen Modell-Build aus (LM Studio) – siehe [Lokale Modelle](/de/gateway/local-models). Kleinere bzw. quantisierte
    Modelle erhöhen das Risiko von Prompt-Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich den Datenverkehr zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie an eine Region gebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi
    und GLM; wählen Sie die in den USA gehostete Variante, um die Daten in der Region zu halten. Sie können Anthropic/OpenAI
    weiterhin gemeinsam mit diesen unter `models.mode: "merge"` aufführen, sodass Fallbacks
    verfügbar bleiben und gleichzeitig der von Ihnen ausgewählte regionale Provider berücksichtigt wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft unter macOS oder Linux (Windows über WSL2). Ein Mac mini ist eine beliebte Wahl
    als ständig verfügbarer Host, aber auch ein kleiner VPS, Heimserver oder ein Gerät der Raspberry-Pi-Klasse funktioniert.

    Sie benötigen einen Mac nur **für Tools, die ausschließlich unter macOS verfügbar sind**. Verwenden Sie für iMessage [iMessage](/de/channels/imessage)
    mit `imsg` auf einem beliebigen Mac, der bei Messages angemeldet ist. Wenn das Gateway unter Linux oder anderswo läuft,
    legen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper fest, der `imsg` auf diesem Mac ausführt. Führen Sie das Gateway für andere
    ausschließlich unter macOS verfügbare Tools auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für die iMessage-Unterstützung?">
    Sie benötigen **ein beliebiges macOS-Gerät**, das bei Messages angemeldet ist – nicht unbedingt einen Mac mini;
    jeder Mac ist geeignet. Verwenden Sie [iMessage](/de/channels/imessage) mit `imsg`; das Gateway kann auf diesem
    Mac oder mit einem SSH-Wrapper `cliPath` an einem anderen Ort ausgeführt werden.

    Gängige Einrichtungen:

    - Gateway unter Linux/auf einem VPS, wobei `channels.imessage.cliPath` auf einen SSH-Wrapper festgelegt ist, der `imsg` auf einem bei Messages angemeldeten Mac ausführt.
    - Für die einfachste Einrichtung auf einem einzelnen Computer wird alles auf einem Mac ausgeführt.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Kann ich einen Mac mini für OpenClaw verwenden und ihn mit meinem MacBook Pro verbinden?">
    Ja. Auf dem **Mac mini kann das Gateway ausgeführt werden**, während Ihr MacBook Pro als **Node**
    (Begleitgerät) verbunden wird. Nodes führen das Gateway nicht aus – sie ergänzen Funktionen wie
    Bildschirm, Kamera, Canvas und `system.run` auf diesem Gerät.

    Gängiges Muster: Das Gateway läuft auf dem ständig verfügbaren Mac mini; auf dem MacBook Pro läuft die macOS-App oder ein
    Node-Host, der mit dem Gateway gekoppelt wird. Prüfen Sie dies mit `openclaw nodes status` / `openclaw nodes list`.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Sie können Bun verwenden, um Abhängigkeiten zu installieren oder Paketskripte auszuführen. Die OpenClaw CLI und das
    Gateway benötigen **Node**, da der kanonische Zustandsspeicher `node:sqlite` verwendet; Bun stellt
    diese API nicht bereit.
  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist die **Telegram-Benutzer-ID des menschlichen Absenders** (numerisch),
    nicht der Benutzername des Bots. Die Einrichtung fragt ausschließlich nach numerischen Benutzer-IDs; `openclaw doctor --fix`
    kann versuchen, veraltete Einträge vom Typ `@username` aufzulösen.

    Sicherer (kein Drittanbieter-Bot): Senden Sie Ihrem Bot eine Direktnachricht, führen Sie `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API: Senden Sie Ihrem Bot eine Direktnachricht, rufen Sie `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat): Senden Sie `@userinfobot` oder `@getidsbot` eine Direktnachricht.

    Siehe [Telegram-Zugriffskontrolle](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-Direktnachrichten (`peer: { kind: "direct", id: "+15551234567" }`) jedes Absenders an eine andere `agentId`, sodass jede Person einen eigenen Workspace und Sitzungsspeicher erhält. Antworten werden weiterhin über **dasselbe WhatsApp-Konto** gesendet; die Zugriffskontrolle für Direktnachrichten (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) gilt global pro Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für „schnelle Chats“ und einen Agenten mit „Opus für die Programmierung“ ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Weisen Sie jedem Agenten ein eigenes Standardmodell zu und binden Sie anschließend eingehende
    Routen (Provider-Konto oder bestimmte Peers) an den jeweiligen Agenten. Beispielkonfiguration:
    [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und
    [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja, über Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn OpenClaw über systemd ausgeführt wird: Stellen Sie sicher, dass der PATH des Dienstes
    `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools
    in Nicht-Login-Shells aufgelöst werden. Aktuelle Builds stellen Linux-
    systemd-Diensten außerdem gängige Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, sofern festgelegt.

  </Accordion>

  <Accordion title="Unterschied zwischen der anpassbaren Git-Installation und der npm-Installation">
    - **Anpassbare Installation (Git):** vollständiger, bearbeitbarer Quellcode-Checkout; am besten für Mitwirkende geeignet. Sie erstellen den Build lokal und können Code bzw. Dokumentation anpassen.
    - **npm-Installation:** globale CLI-Installation ohne Repository; am besten geeignet, wenn Sie es „einfach nur ausführen“ möchten. Aktualisierungen werden über npm-Dist-Tags bereitgestellt.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja, mit `openclaw update --channel ...` bei einer bestehenden Installation. Dadurch werden **Ihre Daten
    nicht gelöscht** – nur die OpenClaw-Codeinstallation ändert sich. Status (`~/.openclaw`) und
    Arbeitsbereich (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu Git:

    ```bash
    openclaw update --channel dev
    ```

    Von Git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um zunächst eine Vorschau des geplanten Moduswechsels anzuzeigen. Der Updater führt anschließend Doctor
    aus, aktualisiert die Plugin-Quellen für den Zielkanal und startet das Gateway neu,
    sofern Sie nicht `--no-restart` übergeben.

    Das Installationsprogramm kann ebenfalls einen der beiden Modi erzwingen:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Hinweise zur Sicherung: [Speicherorte auf dem Datenträger](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder einem VPS ausführen?">
    Möchten Sie 24/7 Zuverlässigkeit? Verwenden Sie einen **VPS**. Möchten Sie möglichst wenig Aufwand und sind
    Ruhemodus/Neustarts für Sie in Ordnung? Führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, ein sichtbares Browserfenster.
    - **Nachteile:** Ruhemodus oder Netzwerkausfälle trennen die Verbindung, Betriebssystemupdates und Neustarts unterbrechen sie, der Laptop muss aktiv bleiben.

    **VPS/Cloud**

    - **Vorteile:** ständig verfügbar, stabiles Netzwerk, keine Probleme durch den Ruhemodus des Laptops, einfacher dauerhaft zu betreiben.
    - **Nachteile:** häufig ohne grafische Oberfläche (verwenden Sie Screenshots), nur Fernzugriff auf Dateien, SSH für Updates erforderlich.

    WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren problemlos von einem VPS aus – der eigentliche
    Kompromiss besteht zwischen einem Browser ohne grafische Oberfläche und einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    Standardempfehlung: Verwenden Sie einen VPS, wenn zuvor Gateway-Verbindungsabbrüche aufgetreten sind. Die lokale Ausführung eignet sich hervorragend,
    wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung
    mit sichtbarem Browser wünschen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Es ist nicht erforderlich, wird aber für Zuverlässigkeit und Isolation empfohlen.

    - **Dedizierter Host (VPS/Mac mini/Raspberry Pi):** ständig verfügbar, weniger Unterbrechungen durch Ruhemodus oder Neustarts, übersichtlichere Berechtigungen, einfacher dauerhaft zu betreiben.
    - **Gemeinsam genutzter Laptop/Desktop-PC:** für Tests und aktive Nutzung gut geeignet, bei Ruhemodus oder Updates des Rechners sind jedoch Unterbrechungen zu erwarten.

    Das Beste aus beiden Welten: Betreiben Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als
    **Node** für lokale Bildschirm-, Kamera- und Ausführungswerkzeuge. Siehe [Nodes](/de/nodes) und [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches Betriebssystem wird empfohlen?">
    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1–2 vCPU, 2 GB+ RAM als Reserve (Protokolle, Medien, mehrere Kanäle). Node-Werkzeuge und Browserautomatisierung können viele Ressourcen beanspruchen.

    Betriebssystem: **Ubuntu LTS** (oder jede moderne Debian-/Ubuntu-Version) – der am besten getestete Linux-Installationsweg.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gelten?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss ständig eingeschaltet und erreichbar sein sowie über ausreichend RAM
    für das Gateway und alle von Ihnen aktivierten Kanäle verfügen.

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB+ RAM für mehrere Kanäle, Browserautomatisierung oder Medienwerkzeuge.
    - **Betriebssystem:** Ubuntu LTS oder eine andere moderne Debian-/Ubuntu-Version.

    Verwenden Sie unter Windows **Windows Hub** für die Desktop-Einrichtung oder WSL2 für eine Linux-ähnliche Gateway-VM
    mit umfassender Werkzeugkompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Ausführen von macOS in einer VM: siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) – die wichtigsten häufig gestellten Fragen (Modelle, Sitzungen, Gateway, Sicherheit und mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
