---
read_when:
    - Neuinstallation, Onboarding hängt oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-07-12T15:29:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8f5234a5ae52fd57a89b3140473049c37f8495875e4a5d9a89d87e55d8fb2f7e
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen und Antworten zur Ersteinrichtung. Informationen zum täglichen Betrieb, zu Modellen, zur Authentifizierung, zu Sitzungen
  und zur Fehlerbehebung finden Sie in den wichtigsten [FAQ](/de/help/faq).

  ## Schnellstart und Ersteinrichtung

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter – wie finde ich am schnellsten eine Lösung?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner einsehen kann**. In den meisten Fällen, in denen Sie nicht weiterkommen, liegen
    **lokale Konfigurations- oder Umgebungsprobleme** vor, die eine Remote-Hilfskraft nicht untersuchen kann. Dies ist daher effektiver,
    als in Discord nachzufragen.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Stellen Sie dem Agenten über die anpassbare Installation (git) den vollständigen Quellcode-Checkout bereit, damit er
    Code und Dokumentation lesen und die von Ihnen ausgeführte Version genau analysieren kann:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bitten Sie den Agenten, die Behebung schrittweise zu planen und zu überwachen und anschließend nur die
    erforderlichen Befehle auszuführen – kleinere Diffs lassen sich leichter prüfen.

    Geben Sie bei einer Supportanfrage (in Discord oder einem GitHub-Issue) die Ausgaben dieser Befehle an:

    | Befehl | Zeigt |
    | --- | --- |
    | `openclaw status` | Zustand von Gateway/Agent und grundlegende Konfigurationsübersicht |
    | `openclaw status --all` | Vollständige schreibgeschützte Diagnose zum Einfügen |
    | `openclaw models status` | Provider-Authentifizierung und Modellverfügbarkeit |
    | `openclaw doctor` | Überprüft und behebt häufige Konfigurations- und Zustandsprobleme |
    | `openclaw logs --follow` | Fortlaufende Live-Protokollausgabe |
    | `openclaw gateway status --deep` | Eingehende Zustandsprüfung von Gateway, Konfiguration und Plugins |
    | `openclaw health --verbose` | Detaillierter Zustandsbericht |

    Haben Sie einen echten Fehler oder eine Korrektur gefunden? Erstellen Sie ein Issue oder senden Sie einen PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull Requests](https://github.com/openclaw/openclaw/pulls).

    Schnelle Debugging-Schleife: [Die ersten 60 Sekunden, wenn etwas nicht funktioniert](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installation](/de/install), [Installationsprogramm-Flags](/de/install/installer), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Gründe dafür?">
    | Grund für das Überspringen | Bedeutung |
    | --- | --- |
    | `quiet-hours` | Außerhalb des konfigurierten Zeitfensters für aktive Stunden |
    | `empty-heartbeat-file` | `HEARTBEAT.md` ist vorhanden, enthält aber nur leere Zeilen, Kommentare, Überschriften, Codeblöcke oder eine leere Checklistenstruktur |
    | `no-tasks-due` | Der Aufgabenmodus ist aktiv, aber es ist noch kein Aufgabenintervall fällig |
    | `alerts-disabled` | Die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle deaktiviert) |

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach Abschluss eines tatsächlichen Heartbeat-Laufs weitergesetzt.
    Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Vorgehensweise zur Installation und Einrichtung von OpenClaw">
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

    Noch keine globale Installation? Führen Sie stattdessen `pnpm openclaw onboard` aus. Wenn die Assets der Control UI
    fehlen, versucht das Onboarding, sie selbst zu erstellen, und greift andernfalls auf `pnpm ui:build` zurück.

  </Accordion>

  <Accordion title="Wie öffne ich nach dem Onboarding das Dashboard?">
    Das Onboarding öffnet unmittelbar nach der
    Einrichtung Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet. Falls er nicht geöffnet wurde,
    kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie dort ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost bzw. aus der Ferne?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn eine Authentifizierung mit einem gemeinsamen Geheimnis verlangt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwortquelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Noch kein gemeinsames Geheimnis konfiguriert? Führen Sie `openclaw doctor --generate-gateway-token` (oder `openclaw doctor --fix --generate-gateway-token`) aus.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Belassen Sie die Bindung auf Loopback, führen Sie `openclaw gateway --tailscale serve` aus und öffnen Sie `https://<magicdns>/`. Bei `gateway.auth.allowTailscale: true` erfüllen Identitätsheader die Authentifizierung für Control UI/WebSocket (kein Einfügen eines gemeinsamen Geheimnisses erforderlich; ein vertrauenswürdiger Gateway-Host wird vorausgesetzt). HTTP-APIs benötigen weiterhin eine Authentifizierung mit einem gemeinsamen Geheimnis, sofern Sie nicht bewusst `none` für privaten Ingress oder die HTTP-Authentifizierung über einen vertrauenswürdigen Proxy verwenden.
      Gleichzeitige fehlgeschlagene Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Begrenzer für fehlgeschlagene Authentifizierungen sie erfasst. Daher kann bereits beim zweiten fehlgeschlagenen Versuch `retry later` angezeigt werden.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie die Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie das passende gemeinsame Geheimnis in die Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse-Proxy**: Belassen Sie das Gateway hinter einem vertrauenswürdigen Proxy, setzen Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie die Proxy-URL. Loopback-Proxys auf demselben Host benötigen ausdrücklich `gateway.auth.trustedProxy.allowLoopback: true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`; öffnen Sie anschließend `http://127.0.0.1:18789/`. Die Authentifizierung mit einem gemeinsamen Geheimnis gilt weiterhin über den Tunnel. Fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Weitere Informationen zu Bindungsmodi und Authentifizierung finden Sie unter [Dashboard](/de/web/dashboard) und [Weboberflächen](/de/web).

  </Accordion>

  <Accordion title="Warum gibt es zwei Konfigurationen für exec-Genehmigungen über den Chat?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec` – leitet Genehmigungsaufforderungen an Chat-Ziele weiter.
    - `channels.<channel>.execApprovals` – macht diesen Kanal zu einem nativen Genehmigungsclient für exec-Genehmigungen.

    Die exec-Richtlinie des Hosts bleibt die eigentliche Genehmigungsschranke; die Chat-Konfiguration steuert lediglich, wo
    Aufforderungen angezeigt werden und wie Personen darauf antworten.

    Sie benötigen nur selten beide:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmigende sicher ermitteln kann, aktiviert OpenClaw automatisch native Genehmigungen mit Vorrang für Direktnachrichten, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder den Wert `"auto"` hat.
    - Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, hat diese Benutzeroberfläche Vorrang; erwähnen Sie einen manuellen `/approve`-Befehl nur, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch andere Chats oder explizite Betriebsräume erreichen müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Genehmigungsaufforderungen zurück in den ursprünglichen Raum bzw. das ursprüngliche Thema gesendet werden sollen.
    - Plugin-Genehmigungen werden separat behandelt: standardmäßig mit `/approve` im selben Chat, optionaler Weiterleitung über `approvals.plugin`, und nur einige native Kanäle behalten auch dafür die native Verarbeitung bei.

    Kurz gesagt: Die Weiterleitung dient der Zustellung, die native Client-Konfiguration einer umfangreicheren kanalspezifischen Benutzererfahrung.
    Siehe [Ausführungsgenehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung benötige ich?">
    Node **22.19+** ist erforderlich (Node 24 wird empfohlen). `pnpm` ist der Paketmanager des Repositorys.
    Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja, prüfen Sie jedoch zuerst den RAM: Pi 5 und Pi 4 (2 GB+) sind ideal; Pi 3B+ (1 GB) funktioniert, ist aber langsam; Pi Zero 2 W (512 MB) wird nicht empfohlen.

    | Modell | RAM | Eignung |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Optimal |
    | Pi 4 | 4 GB | Gut |
    | Pi 4 | 2 GB | In Ordnung, Swap hinzufügen |
    | Pi 4 | 1 GB | Knapp |
    | Pi 3B+ | 1 GB | Langsam |
    | Pi Zero 2 W | 512 MB | Nicht empfohlen |

    Absolutes Minimum: 1 GB RAM, 1 Kern, 500 MB freier Speicherplatz, 64-Bit-Betriebssystem. Da auf dem Pi nur
    der Gateway läuft (Modelle rufen Cloud-APIs auf), bewältigt selbst ein einfacher Pi die Last.

    Ein kleiner Pi/VPS kann auch nur den Gateway hosten, während Sie **Nodes** auf Ihrem
    Laptop/Telefon für lokalen Bildschirm-/Kamera-/Canvas-Zugriff oder die Befehlsausführung koppeln. Siehe [Nodes](/de/nodes).

    Vollständige Einrichtungsanleitung: [Raspberry Pi](/de/install/raspberry-pi).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    - Verwenden Sie ein **64-Bit**-Betriebssystem; verwenden Sie nicht die 32-Bit-Version von Raspberry Pi OS.
    - Fügen Sie bei Boards mit 2 GB oder weniger Swap hinzu.
    - Bevorzugen Sie für Leistung und Lebensdauer eine **USB-SSD** gegenüber einer SD-Karte.
    - Bevorzugen Sie die anpassbare Installation über git, damit Sie Protokolle einsehen und schnell aktualisieren können.
    - Beginnen Sie ohne Kanäle/Skills und fügen Sie sie einzeln hinzu.
    - Ungewöhnliche Binärdateifehler („exec format error“) werden normalerweise durch einen fehlenden ARM64-Build für ein optionales Skill-Tool verursacht.

    Vollständige Anleitung: [Raspberry Pi](/de/install/raspberry-pi). Siehe auch [Linux](/de/platforms/linux).

  </Accordion>

  <Accordion title="Es bleibt bei „Wake up, my friend!“ hängen bzw. das Onboarding wird nicht abgeschlossen. Was nun?">
    Dieser Bildschirm setzt voraus, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    beim ersten Start automatisch „Wake up, my friend!“, wenn ein Modell-Provider konfiguriert ist. Wenn
    Sie die Modell-/Authentifizierungseinrichtung übersprungen haben, zeigt das Onboarding den Hinweis „Model auth missing“ an und öffnet die
    TUI, ohne etwas zu senden — fügen Sie mit `openclaw configure --section model` einen Provider hinzu.
    Wenn Sie die Aufweckzeile **ohne Antwort** sehen und die Token-Anzahl bei 0 bleibt, wurde der Agent nie ausgeführt.

    1. Starten Sie den Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status und Authentifizierung:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hängt es weiterhin? Führen Sie Folgendes aus:

    ```bash
    openclaw doctor
    ```

    Wenn der Gateway entfernt ausgeführt wird, vergewissern Sie sich, dass die Tunnel-/Tailscale-Verbindung aktiv ist und die Benutzeroberfläche
    auf den richtigen Gateway verweist. Siehe [Fernzugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich meine Einrichtung auf einen neuen Rechner migrieren, ohne das Onboarding erneut durchzuführen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Arbeitsbereich** und führen Sie anschließend einmal Doctor aus:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Arbeitsbereich (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Anmeldedaten, Sitzungen und Speicher erhalten – Ihr Bot bleibt
    exakt gleich, sofern Sie **beide** Speicherorte kopieren. Im Remote-Modus verwaltet der
    Gateway-Host den Sitzungsspeicher und den Arbeitsbereich.

    **Wichtig:** Wenn Sie nur Ihren Arbeitsbereich in GitHub committen/pushen, sichern Sie
    **Speicher und Bootstrap-Dateien**, jedoch weder den Sitzungsverlauf noch die Authentifizierung. Diese befinden sich unter
    `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Weitere Informationen: [Migration](/de/install/migrating), [Speicherorte auf dem Datenträger](/de/help/faq#where-things-live-on-disk),
    [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das Änderungsprotokoll auf GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen ganz oben. Wenn der oberste Abschnitt **Unveröffentlicht** lautet, ist der nächste datierte
    Abschnitt die neueste veröffentlichte Version. Die Einträge sind unter **Highlights**, **Änderungen**
    und **Fehlerbehebungen** gruppiert (sowie bei Bedarf unter Dokumentation/weiteren Abschnitten).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie diese Funktion oder setzen Sie `docs.openclaw.ai` auf die Zulassungsliste und versuchen Sie es erneut. Helfen Sie uns,
    die Blockierung aufzuheben: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Immer noch blockiert? Die Dokumentation wird auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm-dist-tags**, keine separaten Codezweige:

    - `latest` = Stable
    - `beta` = früher Build zum Testen (fällt auf `latest` zurück, wenn die Beta-Version fehlt oder älter als das aktuelle Stable-Release ist)

    Ein Stable-Release wird normalerweise zuerst unter **Beta** veröffentlicht. Anschließend
    verschiebt ein ausdrücklicher Hochstufungsschritt dieselbe Version nach `latest`, ohne
    die Versionsnummer zu ändern. Maintainer können auch direkt unter `latest` veröffentlichen.
    Deshalb können Beta und Stable nach der Hochstufung auf **dieselbe Version** verweisen.

    Änderungen anzeigen: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Einzeiler für die Installation und den Unterschied zwischen Beta und Dev finden Sie im nächsten Akkordeon.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und worin besteht der Unterschied zwischen Beta und Dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Hochstufung mit `latest` übereinstimmen).
    **Dev** ist der sich fortlaufend ändernde Stand von `main` (Git); bei einer Veröffentlichung auf npm verwendet er das dist-tag `dev`.

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

    1. **Dev-Kanal (bestehende Installation):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wird zu einem Git-Checkout von `main` gewechselt, dieser auf den Upstream-Stand
    rebasiert, gebaut und die CLI aus diesem Checkout installiert.

    2. **Anpassbare Git-Installation (neuer Rechner):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bevorzugen Sie einen manuellen Klon:

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
    - **QuickStart-Onboarding:** wenige Minuten (Loopback-Gateway, automatisches Token, Standard-Workspace).
    - **Erweitertes/vollständiges Onboarding:** länger, wenn Provider-Anmeldung, Kanalkopplung, Daemon-Installation, Netzwerkdownloads oder Skills zusätzliche Einrichtung erfordern.

    Der Assistent zeigt diesen Zeitrahmen vorab an. Überspringen Sie optionale Schritte und
    kehren Sie später mit `openclaw configure` zurück.

    Hängt der Vorgang? Siehe oben [Ich komme nicht weiter](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installationsprogramm hängt? Wie erhalte ich ausführlichere Rückmeldungen?">
    Führen Sie es erneut mit `--verbose` aus:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` hat keinen eigenen Schalter für ausführliche Ausgaben; umschließen Sie es
    stattdessen mit `Set-PSDebug -Trace 1` / `-Trace 0`. Vollständige Flag-Referenz:
    [Installationsprogramm-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation wird gemeldet, dass Git nicht gefunden oder OpenClaw nicht erkannt wird">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler „spawn git“ / Git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` im PATH enthalten ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann das Installationsprogramm nochmals aus.

    **2) OpenClaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH enthalten.
    - Prüfen Sie ihn mit: `npm config get prefix`.
    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (kein Suffix `\bin` erforderlich; auf den meisten Systemen lautet es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut.

    Bevorzugen Sie eine Desktop-App? Verwenden Sie **Windows Hub**. Für eine reine
    Terminal-Einrichtung werden sowohl das PowerShell-Installationsprogramm als auch
    WSL2-Gateway-Pfade unterstützt. Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Meist liegt eine nicht übereinstimmende Konsolen-Codepage in nativen Windows-Shells vor.

    Symptome: Die Ausgabe von `system.run`/`exec` stellt Chinesisch als Zeichensalat dar;
    derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus.

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

    Tritt dies mit der neuesten OpenClaw-Version weiterhin auf? Verfolgen/melden Sie es hier:
    [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie erhalte ich eine bessere Antwort?">
    Verwenden Sie die anpassbare Git-Installation, damit Ihnen der vollständige Quellcode
    und die Dokumentation lokal vorliegen. Fragen Sie dann Ihren Bot (oder Claude/Codex)
    **aus diesem Ordner heraus**, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installation](/de/install) und [Installationsprogramm-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    - Schnelleinrichtung für Linux und Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installationsprogramm und Aktualisierungen: [Installation und Aktualisierungen](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS ist geeignet. Installieren Sie OpenClaw auf dem Server und greifen Sie
    anschließend über SSH/Tailscale auf das Gateway zu.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remotezugriff: [Gateway-Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo finde ich die Installationsanleitungen für Cloud/VPS?">
    Hosting-Übersicht mit gängigen Providern:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    In der Cloud **läuft das Gateway auf dem Server**, und Sie greifen von Ihrem Laptop/Telefon
    über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand und Workspace befinden
    sich auf dem Server. Behandeln Sie den Host daher als maßgebliche Datenquelle und sichern Sie ihn.

    Koppeln Sie **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway, um Bildschirm,
    Kamera oder Canvas lokal zu verwenden oder Befehle auf Ihrem Laptop auszuführen, während
    das Gateway in der Cloud verbleibt.

    Übersicht: [Plattformen](/de/platforms). Remotezugriff: [Gateway-Remotezugriff](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw anweisen, sich selbst zu aktualisieren?">
    Möglich, aber nicht empfohlen. Der Aktualisierungsvorgang kann das Gateway neu starten
    und dadurch die aktive Sitzung trennen, einen sauberen Git-Checkout erfordern und eine
    Bestätigungsabfrage anzeigen. Sicherer ist es, Aktualisierungen als Betreiber über eine Shell auszuführen.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automatisierung durch einen Agenten:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Aktualisieren](/de/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was geschieht beim Onboarding tatsächlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    1. **Modell/Authentifizierung** – Provider-OAuth, API-Schlüssel oder manuelle Authentifizierung (einschließlich lokaler Optionen wie LM Studio); wählen Sie ein Standardmodell aus.
    2. **Workspace** – Speicherort und Bootstrap-Dateien.
    3. **Gateway** – Port, Bind-Adresse, Authentifizierungsmodus, Tailscale-Freigabe.
    4. **Kanäle** – integrierte und offizielle Plugin-Chatkanäle: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp und weitere.
    5. **Daemon** – LaunchAgent (macOS), systemd-Benutzereinheit (Linux/WSL2) oder native geplante Windows-Aufgabe.
    6. **Integritätsprüfung** – startet das Gateway und prüft, ob es ausgeführt wird.
    7. **Skills** – installiert empfohlene Skills und optionale Abhängigkeiten.

    Es informiert Sie vorab über die erwartete Dauer und warnt, wenn Ihr konfiguriertes
    Modell unbekannt ist oder die Authentifizierung fehlt. Vollständige Übersicht:
    [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Benötige ich ein Claude- oder OpenAI-Abonnement, um OpenClaw auszuführen?">
    Nein. Führen Sie OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder
    **ausschließlich lokalen Modellen** aus, damit Ihre Daten auf Ihrem Gerät verbleiben.
    Abonnements (Claude Pro/Max, ChatGPT/Codex) sind optionale Möglichkeiten zur
    Authentifizierung bei diesen Providern.

    Bei Anthropic ermöglicht ein **API-Schlüssel** die standardmäßige nutzungsabhängige
    Abrechnung; die **Claude CLI** verwendet eine vorhandene Claude-Code-Anmeldung auf
    demselben Host wieder. Anthropic behandelt den nicht interaktiven `claude -p`-Pfad
    der Claude CLI derzeit als Agent-SDK-/programmatische Nutzung, die weiterhin auf die
    Limits Ihres Abonnementtarifs angerechnet wird. Prüfen Sie die aktuellen
    Abrechnungsinformationen von Anthropic, bevor Sie sich auf das Abonnementverhalten
    verlassen. Für langlebige Gateway-Hosts und gemeinsam genutzte Automatisierungen ist
    ein Anthropic-API-Schlüssel die besser vorhersehbare Wahl.

    OpenAI-Codex-OAuth (ChatGPT/Codex-Abonnement) wird für Agentenmodelle vollständig
    unterstützt. OpenClaw unterstützt außerdem gehostete abonnementbasierte Optionen,
    darunter **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja. OpenClaw unterstützt die Wiederverwendung der Claude CLI für Pro-/Max-/Team-/
    Enterprise-Tarife. Anthropic behandelt den von OpenClaw verwendeten `claude -p`-Pfad
    derzeit als Nutzung im Rahmen des Abonnementtarifs und damit unter den Limits Ihres
    Tarifs, nicht als separates kostenloses Kontingent. Aktuelle Abrechnungsdetails und
    Links zu den Supportartikeln von Anthropic finden Sie unter
    [Anthropic](/de/providers/anthropic). Verwenden Sie für eine möglichst gut vorhersehbare
    serverseitige Einrichtung stattdessen einen Anthropic-API-Schlüssel.
  </Accordion>

  <Accordion title="Unterstützen Sie die Abonnement-Authentifizierung von Claude (Claude Pro oder Max)?">
    Ja, über die Wiederverwendung der Claude CLI. Die Abrechnungsweise von Anthropic für
    die Nutzung von `claude -p`/Agent SDK hat sich im Laufe der Zeit geändert. Den aktuellen
    Stand und datierte Links zu den Supportartikeln von Anthropic finden Sie unter
    [Anthropic](/de/providers/anthropic), bevor Sie sich auf ein bestimmtes Abrechnungsverhalten verlassen.

    Die Authentifizierung mit einem Anthropic-Einrichtungstoken wird ebenfalls weiterhin
    als Token-Pfad unterstützt, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI
    und `claude -p`, sofern verfügbar. Für Produktions- oder Mehrbenutzer-Workloads bleibt
    ein Anthropic-API-Schlüssel die sicherere und besser vorhersehbare Wahl. Weitere
    gehostete abonnementbasierte Optionen: [OpenAI](/de/providers/openai), [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Warum wird mir von Anthropic der HTTP-Fehler 429 rate_limit_error angezeigt?">
    Ihr **Anthropic-Kontingent bzw. -Ratenlimit** ist für das aktuelle Zeitfenster ausgeschöpft. Warten Sie bei der **Claude
    CLI**, bis das Zeitfenster zurückgesetzt wird, oder führen Sie ein Upgrade Ihres Tarifs durch. Prüfen Sie bei einem **Anthropic-API-Schlüssel**
    die Nutzung und Abrechnung in der Anthropic Console und erhöhen Sie die Limits nach Bedarf.

    Wenn die Meldung ausdrücklich `Extra usage is required for long context requests` lautet,
    versucht die Anfrage, das 1M-Kontextfenster von Anthropic zu verwenden (ein allgemein verfügbares 1M-fähiges Claude-4.x-
    Modell oder die veraltete Konfiguration `params.context1m: true`), und Ihre aktuellen Anmeldedaten sind nicht
    für die Abrechnung langer Kontexte berechtigt.

    Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiterhin antwortet, während für einen Provider ein Ratenlimit gilt.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw verfügt über einen gebündelten **Amazon-Bedrock-(Converse-)**Provider. Wenn AWS-Umgebungs-
    marker vorhanden sind (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    aktiviert OpenClaw den impliziten Bedrock-Provider für die Modellerkennung automatisch; legen Sie andernfalls
    `plugins.entries.amazon-bedrock.config.discovery.enabled: true` fest oder fügen Sie einen manuellen
    Provider-Eintrag hinzu. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models).
    Ein OpenAI-kompatibler Proxy vor Bedrock ist weiterhin eine gültige Option, wenn Sie einen verwalteten Schlüsselfluss bevorzugen.
  </Accordion>

  <Accordion title="Wie funktioniert die Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Codex** über OAuth (ChatGPT-Anmeldung). Eine neue
    Einrichtung ohne primäres Modell verwendet exakt `openai/gpt-5.6-sol` für die
    ChatGPT-/Codex-Abonnementauthentifizierung sowie die native Ausführung über den Codex-App-Server.
    Bei einer erneuten Authentifizierung bleibt ein vorhandenes explizites Modell erhalten, einschließlich
    `openai/gpt-5.5`. Wenn der Codex-Arbeitsbereich GPT-5.6 nicht bereitstellt, wählen Sie
    ausdrücklich `openai/gpt-5.5`; OpenClaw führt kein stilles Downgrade durch. Veraltete
    Modellreferenzen mit Codex-Präfix sind veraltete Konfigurationen, die durch `openclaw doctor
    --fix` repariert werden. Der direkte Zugriff per OpenAI-API-Schlüssel bleibt für OpenAI-
    API-Oberflächen außerhalb von Agenten sowie über ein geordnetes `openai`-API-Schlüsselprofil auch für Agenten-
    modelle verfügbar. Siehe [Modell-Provider](/de/concepts/model-providers) und
    [Einrichtung (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin das veraltete OpenAI-Codex-Präfix?">
    `openai` ist die aktuelle Provider- und Authentifizierungsprofil-ID sowohl für OpenAI-API-Schlüssel als auch für
    ChatGPT-/Codex-OAuth – OpenAI Codex ist darin aufgegangen. In älteren Konfigurationen und Migrationswarnungen
    sehen Sie möglicherweise weiterhin das veraltete Präfix `openai-codex`:

    - `openai/gpt-5.6-sol` = neue ChatGPT-/Codex-Abonnementeinrichtung mit der nativen Codex-Laufzeit für Agentendurchläufe.
    - `openai/gpt-5.5` = ausdrücklich unterstützte Auswahl für bestehende Konfigurationen oder Konten ohne Zugriff auf GPT-5.6.
    - Veraltete `openai-codex/*`-Modellreferenzen = veraltete Route, die durch `openclaw doctor --fix` repariert wird.
    - `openai/gpt-5.5` plus ein geordnetes `openai`-API-Schlüsselprofil = API-Schlüsselauthentifizierung für ein OpenAI-Agentenmodell.
    - Veraltete `openai-codex`-Authentifizierungsprofil-IDs = veraltete IDs, die durch `openclaw doctor --fix` migriert werden.

    Möchten Sie direkt über die OpenAI Platform abrechnen? Legen Sie `OPENAI_API_KEY` fest. Möchten Sie die ChatGPT-/Codex-
    Abonnementauthentifizierung verwenden? Führen Sie `openclaw models auth login --provider openai` aus. Verwenden Sie
    Modellreferenzen unter dem kanonischen Provider `openai/*`. Eine neue Abonnement-
    einrichtung verwendet exakt `openai/gpt-5.6-sol`; Doctor repariert veraltete Modellreferenzen mit Codex-Präfix,
    ohne eine explizite Auswahl von `openai/gpt-5.5` zu aktualisieren.

  </Accordion>

  <Accordion title="Warum können sich die Codex-OAuth-Limits von denen im ChatGPT-Web unterscheiden?">
    Codex OAuth verwendet von OpenAI verwaltete, tarifabhängige Kontingentzeitfenster, die sich selbst beim
    selben Konto von der Nutzung auf der ChatGPT-Website bzw. in der App unterscheiden können.

    `openclaw models status` zeigt die derzeit sichtbaren Nutzungs- und Kontingentzeitfenster des Providers an,
    erfindet oder überträgt jedoch keine Berechtigungen aus ChatGPT-Web in einen direkten API-Zugriff. Verwenden Sie für den
    direkten Abrechnungs- und Limitpfad der OpenAI Platform `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie die OpenAI-Abonnementauthentifizierung (Codex OAuth)?">
    Ja, vollständig. OpenAI erlaubt ausdrücklich die Verwendung von Abonnement-OAuth in externen
    Tools und Arbeitsabläufen wie OpenClaw. Die Einrichtung kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Einrichtung (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini-CLI-OAuth ein?">
    Die Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID und kein Geheimnis in `openclaw.json`.

    1. Installieren Sie die Gemini CLI lokal, sodass `gemini` in `PATH` verfügbar ist:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Melden Sie sich an: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google/gemini-3.1-pro-preview` (Laufzeit `google-gemini-cli`)
    5. Schlagen Anfragen nach der Anmeldung fehl? Legen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host fest und versuchen Sie es erneut.

    OAuth-Token werden in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Google](/de/providers/google), [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für zwanglose Unterhaltungen geeignet?">
    Normalerweise nicht. OpenClaw benötigt einen großen Kontext und robuste Sicherheitsmechanismen; kleine Grafikkarten beschneiden den Kontext
    und umgehen providerseitige Sicherheitsfilter. Falls es dennoch erforderlich ist, führen Sie lokal den **größten** möglichen Modell-Build
    aus (LM Studio) – siehe [Lokale Modelle](/de/gateway/local-models). Kleinere bzw. quantisierte
    Modelle erhöhen das Risiko von Prompt-Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie beschränke ich den Datenverkehr zu gehosteten Modellen auf eine bestimmte Region?">
    Wählen Sie regional gebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi
    und GLM; wählen Sie die in den USA gehostete Variante, damit die Daten in der Region verbleiben. Sie können weiterhin
    Anthropic/OpenAI daneben mit `models.mode: "merge"` aufführen, sodass Fallbacks
    verfügbar bleiben und zugleich der ausgewählte regionale Provider berücksichtigt wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um OpenClaw zu installieren?">
    Nein. OpenClaw läuft unter macOS oder Linux (Windows über WSL2). Ein Mac mini ist eine beliebte Wahl
    für einen dauerhaft laufenden Host, aber ein kleiner VPS, Heimserver oder ein Gerät der Raspberry-Pi-Klasse funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für Tools, die ausschließlich unter macOS verfügbar sind**. Verwenden Sie für iMessage [iMessage](/de/channels/imessage)
    mit `imsg` auf einem beliebigen Mac, der bei Messages angemeldet ist. Wenn der Gateway unter Linux oder anderswo läuft,
    legen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper fest, der `imsg` auf diesem Mac ausführt. Führen Sie für andere
    ausschließlich unter macOS verfügbare Tools den Gateway auf einem Mac aus oder koppeln Sie eine macOS-Node.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remotemodus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich für die iMessage-Unterstützung einen Mac mini?">
    Sie benötigen **ein beliebiges macOS-Gerät**, das bei Messages angemeldet ist – nicht unbedingt einen Mac mini; jeder
    Mac funktioniert. Verwenden Sie [iMessage](/de/channels/imessage) mit `imsg`; der Gateway kann auf diesem
    Mac oder mit einem SSH-Wrapper unter `cliPath` an anderer Stelle ausgeführt werden.

    Übliche Einrichtungen:

    - Gateway unter Linux/VPS, wobei `channels.imessage.cliPath` auf einen SSH-Wrapper gesetzt ist, der `imsg` auf einem Mac ausführt, der bei Messages angemeldet ist.
    - Alles auf einem einzigen Mac für die einfachste Einrichtung auf einem einzelnen Rechner.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Kann ich einen Mac mini für OpenClaw verwenden und ihn mit meinem MacBook Pro verbinden?">
    Ja. Auf dem **Mac mini kann der Gateway ausgeführt werden**, und Ihr MacBook Pro stellt als **Node**
    (Begleitgerät) eine Verbindung her. Nodes führen den Gateway nicht aus, sondern fügen Funktionen wie
    Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät hinzu.

    Gängiges Muster: Der Gateway läuft auf dem ständig eingeschalteten Mac mini; auf dem MacBook Pro läuft die macOS-App oder ein
    Node-Host, der mit dem Gateway gekoppelt wird. Prüfen Sie dies mit `openclaw nodes status` / `openclaw nodes list`.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Nicht empfohlen – Bun weist Laufzeitfehler auf, insbesondere bei WhatsApp und Telegram. Verwenden Sie
    **Node** für stabile Gateways. Wenn Sie dennoch experimentieren möchten, tun Sie dies auf einem
    nicht produktiv genutzten Gateway ohne WhatsApp/Telegram.
  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist die **Telegram-Benutzer-ID des menschlichen Absenders** (numerisch),
    nicht der Benutzername des Bots. Die Einrichtung fragt ausschließlich nach numerischen Benutzer-IDs; `openclaw doctor --fix`
    kann versuchen, veraltete `@username`-Einträge aufzulösen.

    Sicherer (kein Drittanbieter-Bot): Senden Sie Ihrem Bot eine Direktnachricht, führen Sie `openclaw logs --follow` aus und lesen Sie `from.id` ab.

    Offizielle Bot API: Senden Sie Ihrem Bot eine Direktnachricht, rufen Sie `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id` ab.

    Drittanbieter (weniger vertraulich): Senden Sie `@userinfobot` oder `@getidsbot` eine Direktnachricht.

    Siehe [Telegram-Zugriffssteuerung](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-Direktnachrichten jedes Absenders (`peer: { kind: "direct", id: "+15551234567" }`) an eine andere `agentId`, sodass jede Person einen eigenen Workspace und Sitzungsspeicher erhält. Antworten werden weiterhin über **dasselbe WhatsApp-Konto** gesendet; die Zugriffssteuerung für Direktnachrichten (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) gilt global pro Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für „schnelle Chats“ und einen Agenten mit „Opus zum Programmieren“ ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Weisen Sie jedem Agenten ein eigenes Standardmodell zu und binden Sie anschließend eingehende
    Routen (Provider-Konto oder bestimmte Kommunikationspartner) an den jeweiligen Agenten. Beispielkonfiguration:
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

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der PATH des Dienstes
    `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools
    in Nicht-Login-Shells gefunden werden. Neuere Builds stellen bei Linux-systemd-Diensten außerdem häufig verwendete benutzerspezifische Binärverzeichnisse voran
    (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, sofern diese gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der anpassbaren Git-Installation und der npm-Installation">
    - **Anpassbare Git-Installation:** vollständiger Quellcode-Checkout, bearbeitbar und am besten für Mitwirkende geeignet. Sie erstellen den Build lokal und können Code sowie Dokumentation ändern.
    - **npm-Installation:** globale CLI-Installation ohne Repository, am besten für „einfach ausführen“. Aktualisierungen werden über npm-Dist-Tags bereitgestellt.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja, mit `openclaw update --channel ...` bei einer vorhandenen Installation. Dadurch werden **Ihre Daten nicht
    gelöscht** – nur die OpenClaw-Codeinstallation ändert sich. Statusdaten (`~/.openclaw`) und
    Workspace (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu Git:

    ```bash
    openclaw update --channel dev
    ```

    Von Git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zuerst in einer Vorschau anzuzeigen. Der Updater führt nachgelagerte Doctor-Schritte aus,
    aktualisiert die Plugin-Quellen für den Zielkanal und startet das Gateway neu,
    sofern Sie nicht `--no-restart` übergeben.

    Der Installer kann ebenfalls einen der beiden Modi erzwingen:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Tipps zur Sicherung: [Speicherorte auf dem Datenträger](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich das Gateway auf meinem Laptop oder einem VPS ausführen?">
    Möchten Sie Zuverlässigkeit rund um die Uhr? Verwenden Sie einen **VPS**. Möchten Sie möglichst wenig Aufwand und sind
    Standby/Neustarts für Sie in Ordnung? Führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, ein sichtbares Browserfenster.
    - **Nachteile:** Standby und Netzwerkunterbrechungen trennen die Verbindung, Betriebssystemupdates und Neustarts unterbrechen den Betrieb, das Gerät muss aktiv bleiben.

    **VPS / Cloud**

    - **Vorteile:** dauerhaft verfügbar, stabiles Netzwerk, keine Standby-Probleme des Laptops, einfacher im Dauerbetrieb zu halten.
    - **Nachteile:** häufig ohne grafische Oberfläche (verwenden Sie Screenshots), nur Remote-Dateizugriff, SSH für Updates erforderlich.

    WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren problemlos über einen VPS – der eigentliche
    Kompromiss besteht zwischen einem Browser ohne grafische Oberfläche und einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    Standardempfehlung: Verwenden Sie einen VPS, wenn es bei Ihnen bereits zu Gateway-Verbindungsabbrüchen kam. Die lokale Ausführung eignet sich hervorragend,
    wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung
    mit sichtbarem Browser benötigen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Es ist nicht erforderlich, wird jedoch für Zuverlässigkeit und Isolation empfohlen.

    - **Dedizierter Host (VPS/Mac mini/Raspberry Pi):** dauerhaft verfügbar, weniger Unterbrechungen durch Standby oder Neustarts, klarere Berechtigungen, einfacher im Dauerbetrieb zu halten.
    - **Gemeinsam genutzter Laptop/Desktop-Rechner:** für Tests und die aktive Nutzung geeignet, aber rechnen Sie mit Pausen, wenn das Gerät in den Standby-Modus wechselt oder Updates installiert.

    Das Beste aus beiden Welten: Betreiben Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als
    **Node** für lokale Bildschirm-, Kamera- und Ausführungswerkzeuge. Siehe [Nodes](/de/nodes) und [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches Betriebssystem wird empfohlen?">
    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB+ RAM als Reserve (Protokolle, Medien, mehrere Kanäle). Node-Werkzeuge und Browserautomatisierung können viele Ressourcen beanspruchen.

    Betriebssystem: **Ubuntu LTS** (oder eine beliebige moderne Debian-/Ubuntu-Version) – der am besten getestete Installationsweg unter Linux.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gelten?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss dauerhaft eingeschaltet und erreichbar sein sowie über ausreichend RAM
    für das Gateway und alle aktivierten Kanäle verfügen.

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB+ RAM für mehrere Kanäle, Browserautomatisierung oder Medienwerkzeuge.
    - **Betriebssystem:** Ubuntu LTS oder eine andere moderne Debian-/Ubuntu-Version.

    Verwenden Sie unter Windows **Windows Hub** für die Desktop-Einrichtung oder WSL2 für eine Linux-ähnliche Gateway-VM
    mit umfassender Werkzeugkompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    macOS in einer VM ausführen: siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) – die zentrale FAQ (Modelle, Sitzungen, Gateway, Sicherheit und mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
