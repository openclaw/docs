---
read_when:
    - Beantwortung häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von von Nutzern gemeldeten Problemen vor einer tieferen Fehlersuche
summary: Häufig gestellte Fragen zur Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-21T13:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Schnelle Antworten plus tiefergehende Fehlersuche für reale Setups (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Fehlersuche](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Einfügbarer Bericht (sicher zum Teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Ende (Tokens redigiert).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt Supervisor-Laufzeit im Vergleich zur RPC-Erreichbarkeit, die Probe-Ziel-URL und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefgehende Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Zustandsprüfung des Gateways aus, einschließlich Kanal-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Aktuellstes Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, stattdessen verwenden:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind von Service-Logs getrennt; siehe [Logging](/de/logging) und [Fehlersuche](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Zustandsprüfungen aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt die Ziel-URL + den Konfigurationspfad bei Fehlern
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

<AccordionGroup>
  <Accordion title="Ich hänge fest, schnellster Weg, wieder weiterzukommen">
    Verwenden Sie einen lokalen KI-Agent, der **Ihre Maschine sehen** kann. Das ist deutlich effektiver als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Werkzeuge können das Repository lesen, Befehle ausführen, Logs prüfen und dabei helfen, Ihre Einrichtung auf Maschinenebene zu beheben
    (PATH, Services, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen ausgecheckten Quellcode** über
    die hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent den Code + die Dokumentation lesen und
    auf Basis der exakten Version, die Sie ausführen, argumentieren kann. Sie können später jederzeit wieder auf die stabile Version umstellen,
    indem Sie das Installationsprogramm ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung **zu planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. Dadurch bleiben Änderungen klein und leichter zu prüfen.

    Wenn Sie einen echten Fehler oder eine echte Korrektur entdecken, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot des Zustands von Gateway/Agent + grundlegende Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Gründe fürs Überspringen?">
    Häufige Gründe, warum der Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten active-hours-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere/header-only-Gerüste
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keine der Aufgabenintervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach einem echten Heartbeat-Lauf
    weitergeschoben. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zum Installieren und Einrichten von OpenClaw">
    Das Repository empfiehlt, aus dem Quellcode zu starten und das Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann auch UI-Assets automatisch bauen. Nach dem Onboarding führen Sie das Gateway normalerweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie es über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet Ihren Browser direkt nach dem Onboarding mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link außerdem in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; falls er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf derselben Maschine in den Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu Remote?">
    **Localhost (dieselbe Maschine):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bindung an loopback beibehalten, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden absichtlich private-ingress `none` oder HTTP-Authentifizierung über einen trusted-proxy.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite schlechte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwort-Authentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in die Dashboard-Einstellungen ein.
    - **Identity-aware Reverse Proxy**: Behalten Sie das Gateway hinter einem trusted-proxy ohne loopback bei, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web surfaces](/web) für Bindungsmodi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Genehmigungs-Client für exec-Genehmigungen fungieren

    Die exec-Richtlinie des Hosts ist weiterhin das eigentliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wo Genehmigungs-
    aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt native DM-first-Genehmigungen automatisch, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn Sie Genehmigungsaufforderungen ausdrücklich wieder im ursprünglichen Raum/Thema posten möchten.
    - Plugin-Genehmigungen sind noch einmal getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Weiterleiten, und nur einige native Kanäle behalten zusätzlich native Behandlung von Plugin-Genehmigungen bei.

    Kurz gesagt: Weiterleiten dient dem Routing, native Client-Konfiguration dient einer reichhaltigeren kanalspezifischen UX.
    Siehe [Exec Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – die Dokumentation nennt **512 MB–1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie etwas mehr Spielraum möchten (Logs, Medien, andere Services), werden **2 GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Raspberry Pi-Installationen?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node auf >= 22.
    - Bevorzugen Sie die **hackbare (git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist das meist ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei „wake up my friend“ / Onboarding schlüpft nicht. Was jetzt?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet auch
    „Wake up, my friend!“ beim ersten Schlüpfen automatisch. Wenn Sie diese Zeile mit **keiner Antwort**
    sehen und Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Gateway neu starten:

    ```bash
    openclaw gateway restart
    ```

    2. Status + Auth prüfen:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es weiterhin hängt, führen Sie Folgendes aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf eine neue Maschine (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace** und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „exakt gleich“ (Memory, Sitzungsverlauf, Auth und Kanal-
    status), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf der neuen Maschine.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) von der alten Maschine.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Service neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Anmeldedaten, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus arbeiten, beachten Sie, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Auth. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandte Themen: [Migration](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#where-things-live-on-disk),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Die Einträge sind nach **Highlights**, **Änderungen** und
    **Fehlerbehebungen** gruppiert (plus Dokumentation/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Ich kann docs.openclaw.ai nicht aufrufen (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es dann erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Dokumente auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine getrennten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine stable-Version zuerst auf **beta**, dann verschiebt ein expliziter
    Promotion-Schritt genau diese Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Sehen Sie nach, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Einzeilige Installationsbefehle und den Unterschied zwischen beta und dev finden Sie im Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version, und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Stand von `main` (git); wenn veröffentlicht, verwendet es das npm-dist-tag `dev`.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mehr Details: [Entwicklungskanäle](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Builds aus?">
    Zwei Optionen:

    1. **Dev-Kanal (git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wird auf den Branch `main` gewechselt und aus dem Quellcode aktualisiert.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repository, das Sie bearbeiten und dann über git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Klon erstellen möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Update](/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installation](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Richtwerte:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, je nachdem, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt?](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife unter [Ich hänge fest](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Rückmeldung?">
    Führen Sie den Installer mit **ausführlicher Ausgabe** erneut aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Äquivalent (PowerShell):

    ```powershell
    # install.ps1 hat noch kein eigenes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Bei der Windows-Installation steht git not found oder openclaw wird nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` auf Ihrem PATH liegt.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht auf PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein `\bin`-Suffix nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut, nachdem Sie PATH aktualisiert haben.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text – was soll ich tun?">
    Das ist normalerweise ein Mismatch der Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminal-Profil korrekt aus

    Schnelle Umgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie dann das Gateway neu und versuchen Sie Ihren Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn sich das auf dem neuesten OpenClaw weiterhin reproduzieren lässt, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git-)Installation**, damit Sie den vollständigen Quellcode und die vollständige Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installation](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Schneller Linux-Pfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir haben ein **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Source of Truth und sichern Sie ihn entsprechend.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um Zugriff auf
    lokalen Bildschirm/Kamera/Canvas zu erhalten oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung verloren geht), erfordert möglicherweise ein sauberes git-Checkout und
    kann nach einer Bestätigung fragen. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie es von einem Agenten aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Update](/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (bind/port/auth/tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Health-Checks** und **Skills**-Auswahl

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten zur Authentifizierung bei diesen Providern.

    Für Anthropic in OpenClaw ist die praktische Unterscheidung:

    - **Anthropic API key**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeiter
      haben uns gesagt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die besser
    vorhersehbare Einrichtung. OpenAI Codex OAuth wird für externe
    Werkzeuge wie OpenClaw ausdrücklich unterstützt.

    OpenClaw unterstützt außerdem weitere gehostete abonnementähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass die OpenClaw-artige Nutzung der Claude CLI wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` für diese Integration als genehmigt,
    sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie die am besten vorhersehbare serverseitige Einrichtung möchten,
    verwenden Sie stattdessen einen Anthropic API key.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Das Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktion oder Multi-User-Workloads bleibt Anthropic-API-key-Auth die
    sicherere, besser vorhersehbare Wahl. Wenn Sie andere gehostete abonnementähnliche
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster erschöpft ist. Wenn Sie
**Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder aktualisieren Sie Ihren Tarif. Wenn Sie
einen **Anthropic API key** verwenden, prüfen Sie die Anthropic Console
auf Nutzung/Abrechnung und erhöhen Sie die Limits nach Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Context-Beta von Anthropic zu verwenden (`context1m: true`). Das funktioniert nur, wenn Ihre
    Anmeldedaten für Long-Context-Abrechnung geeignet sind (API-key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Models](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Ablauf bevorzugen, bleibt ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Auth?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt das Standardmodell bei Bedarf auf `openai-codex/gpt-5.4`. Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum schaltet ChatGPT GPT-5.4 `openai/gpt-5.4` in OpenClaw nicht frei?">
    OpenClaw behandelt die beiden Wege getrennt:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = direkte OpenAI-Platform-API

    In OpenClaw ist die ChatGPT/Codex-Anmeldung mit dem `openai-codex/*`-Pfad verknüpft,
    nicht mit dem direkten `openai/*`-Pfad. Wenn Sie den direkten API-Pfad in
    OpenClaw möchten, setzen Sie `OPENAI_API_KEY` (oder die entsprechende OpenAI-Provider-Konfiguration).
    Wenn Sie die ChatGPT/Codex-Anmeldung in OpenClaw möchten, verwenden Sie `openai-codex/*`.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    `openai-codex/*` verwendet den Codex-OAuth-Pfad, und seine nutzbaren Kontingentfenster werden
    von OpenAI verwaltet und hängen vom Tarif ab. In der Praxis können sich diese Limits von der
    ChatGPT-Website-/App-Erfahrung unterscheiden, selbst wenn beide an dasselbe Konto gebunden sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limitpfad möchten, verwenden Sie `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Auth (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) subscription OAuth** vollständig.
    OpenAI erlaubt die Nutzung von subscription OAuth ausdrücklich in externen Werkzeugen/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Ablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    Meistens nein. OpenClaw braucht großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn Sie es unbedingt möchten, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko für Prompt Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie regiongebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während der von Ihnen gewählte regiongebundene Provider eingehalten wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft unter macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Homeserver oder eine Box in Raspberry-Pi-Klasse funktioniert.

    Sie brauchen einen Mac nur **für rein macOS-spezifische Werkzeuge**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann unter Linux oder anderswo laufen. Wenn Sie andere rein macOS-spezifische Werkzeuge möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich für iMessage-Unterstützung einen Mac mini?">
    Sie brauchen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein –
    jeder Mac funktioniert. Verwenden Sie für iMessage **[BlueBubbles](/de/channels/bluebubbles)** (empfohlen) – der BlueBubbles-Server läuft unter macOS, während das Gateway unter Linux oder anderswo laufen kann.

    Häufige Setups:

    - Führen Sie das Gateway auf Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Single-Machine-Setup möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - Das MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es anzuzeigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie das auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Beim Setup werden nur numerische Benutzer-IDs abgefragt. Wenn Sie bereits ältere `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, damit jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "Fast-Chat"-Agenten und einen "Opus fürs Programmieren"-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Beispielkonfigurationen finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Models](/de/concepts/models) und [Configuration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelles Setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der PATH des Service `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Werkzeuge in Non-Login-Shells aufgelöst werden.
    Neuere Builds stellen unter Linux-systemd-Services außerdem gängige Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und npm install">
    - **Hackbare (git-)Installation:** vollständiger Quellcode-Checkout, bearbeitbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm install:** globale CLI-Installation, kein Repository, am besten für „einfach nur ausführen“.
      Updates kommen über npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Service auf den neuen Einstiegspunkt zeigt.
    Dadurch werden Ihre Daten **nicht gelöscht** – es ändert nur die OpenClaw-Code-Installation. Ihr Zustand
    (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unberührt.

    Von npm zu git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Von git zu npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor erkennt einen Einstiegspunkt-Mismatch des Gateway-Service und bietet an, die Service-Konfiguration so umzuschreiben, dass sie zur aktuellen Installation passt (verwenden Sie `--repair` in der Automatisierung).

    Backup-Tipps: siehe [Backup-Strategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurzantwort: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie den
    geringsten Aufwand möchten und Schlafmodus/Neustarts in Ordnung sind, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster in Echtzeit.
    - **Nachteile:** Schlafmodus/Netzwerkabbrüche = Verbindungsabbrüche, Betriebssystem-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer an, stabiles Netzwerk, keine Probleme durch Laptop-Schlafmodus, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** läuft oft headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Sie müssen für Updates SSH verwenden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos auf einem VPS. Der einzige echte Kompromiss ist **headless browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** immer an, weniger Unterbrechungen durch Schlafmodus/Neustarts, sauberere Berechtigungen, leichter am Laufen zu halten.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig in Ordnung für Tests und aktive Nutzung, aber rechnen Sie mit Pausen, wenn die Maschine schläft oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, behalten Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/exec-Werkzeuge. Siehe [Nodes](/de/nodes).
    Sicherheitshinweise finden Sie unter [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die minimalen VPS-Anforderungen und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr als Spielraum (Logs, Medien, mehrere Kanäle). Node-Werkzeuge und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar und mit ausreichend
    RAM für das Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Richtwerte:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medienwerkzeuge ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows arbeiten, ist **WSL2 das einfachste VM-ähnliche Setup** und hat die beste
    Werkzeugkompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Kanal-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas nutzen. Das **Gateway** ist die immer aktive Steuerungsebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **Local-First-Steuerungsebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar aus den Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Werkzeugen – ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway aus, wo immer Sie möchten (Mac, Linux, VPS), und behalten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit agentenbezogenem Routing
      und Failover.
    - **Nur-lokal-Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie möchten.
    - **Multi-Agent-Routing:** Separate Agenten pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und Standardwerten.
    - **Open Source und hackbar:** Prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Dokumentation: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet – was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App prototypen (Struktur, Screens, API-Plan).
    - Dateien und Ordner organisieren (Aufräumen, Benennen, Taggen).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Sub-Agenten für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten alltäglichen Anwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meistens so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Inbox, Kalender und Nachrichten, die Sie interessieren.
    - **Recherche und Entwürfe:** Schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** Durch Cron oder Heartbeat gesteuerte Erinnerungen und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und Webaufgaben wiederholen.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis im Chat zurück.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Generierung, Outreach, Werbung und Blogs für ein SaaS helfen?">
    Ja, für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach- oder Werbetexte schreiben.

    Für **Outreach oder Werbekampagnen** sollten Menschen eingebunden bleiben. Vermeiden Sie Spam, befolgen Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es versendet wird. Das sicherste Muster ist, OpenClaw entwerfen zu lassen und Sie genehmigen.

    Dokumentation: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Welche Vorteile hat es gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsebene, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für die schnellste direkte Coding-Schleife in einem Repository. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Werkzeugorchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sitzungen hinweg
    - **Plattformübergreifender Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Werkzeugorchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Immer aktives Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repository dauerhaft verändert zu halten?">
    Verwenden Sie verwaltete Überschreibungen statt die Kopie im Repository zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` einen Ordner hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Überschreibungen weiterhin vor gebündelten Skills gewinnen, ohne git zu berühren. Wenn Sie den Skill global installiert brauchen, aber nur für einige Agenten sichtbar machen wollen, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit mit `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die upstream-tauglich sind, sollten im Repository leben und als PR eingereicht werden.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardpriorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig in `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agenten sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich unterschiedliche Modelle für unterschiedliche Aufgaben verwenden?">
    Heute werden folgende Muster unterstützt:

    - **Cron-Jobs**: Isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agenten**: Leiten Sie Aufgaben an separate Agenten mit unterschiedlichen Standardmodellen weiter.
    - **On-Demand-Wechsel**: Verwenden Sie `/model`, um das aktuelle Sitzungsmodell jederzeit zu wechseln.

    Siehe [Cron-Jobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agenten** für lange oder parallele Aufgaben. Sub-Agenten laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Hauptchat reaktionsfähig.

    Bitten Sie Ihren Bot, „für diese Aufgabe einen Sub-Agenten zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade tut (und ob es ausgelastet ist).

    Token-Tipp: Sowohl lange Aufgaben als auch Sub-Agenten verbrauchen Tokens. Wenn Kosten ein Thema sind, setzen Sie ein
    günstigeres Modell für Sub-Agenten über `agents.defaults.subagents.model`.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren thread-gebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an ein Subagent- oder Sitzungsziel binden, sodass Folgemeldungen in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundablauf:

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Folgeaktionen).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Bindungsstatus zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um das automatische Lösen des Fokus zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standardwerte: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatische Bindung beim Start: Setzen Sie `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Sub-Agent wurde fertig, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung von Sub-Agenten im Abschlussmodus bevorzugt jeden gebundenen Thread oder jede Konversationsroute, wenn eine existiert.
    - Wenn der Abschlussursprung nur einen Kanal enthält, greift OpenClaw auf die gespeicherte Route der Anforderer-Sitzung (`lastChannel` / `lastTo` / `lastAccountId`) zurück, sodass direkte Zustellung trotzdem gelingen kann.
    - Wenn weder eine gebundene Route noch eine nutzbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt stattdessen auf zugestellte Sitzungswarteschlange zurück, anstatt sofort im Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Rückfall auf die Warteschlange oder einen endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistant-Antwort des Childs exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, anstatt veralteten früheren Fortschritt zu posten.
    - Wenn das Child nach nur Tool-Aufrufen ein Timeout hatte, kann die Ankündigung dies zu einer kurzen Teilfortschrittszusammenfassung verdichten, anstatt rohe Tool-Ausgabe wiederzugeben.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Sub-Agenten](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Session Tools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen werden nicht ausgelöst. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Schlafmodus/keine Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` im Vergleich zur Host-Zeitzone).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass kein Fallback-Senden durch den Runner zu erwarten ist.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Fehler bei der Kanal-Authentifizierung (`unauthorized`, `Forbidden`) bedeuten, dass der Runner die Zustellung versucht hat, aber die Anmeldedaten sie blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Fallback-Zustellung aus der Warteschlange.

    Bei isolierten Cron-Jobs kann der Agent weiterhin direkt mit dem `message`-
    Tool senden, wenn eine Chat-Route verfügbar ist. `--announce` steuert nur den Runner-
    Fallback-Pfad für finalen Text, den der Agent nicht bereits selbst gesendet hat.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat ein isolierter Cron-Lauf Modelle gewechselt oder einmal erneut versucht?">
    Das ist normalerweise der Live-Modellwechselpfad, nicht doppelte Planung.

    Isoliertes Cron kann eine Laufzeit-Modellübergabe persistieren und erneut versuchen, wenn der aktive
    Lauf `LiveSessionModelSwitchError` auslöst. Der erneute Versuch behält den gewechselten
    Provider/das gewechselte Modell bei, und wenn der Wechsel ein neues Auth-Profil-Override mitbrachte, persistiert Cron
    dieses ebenfalls vor dem erneuten Versuch.

    Verwandte Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn zutreffend.
    - Dann pro Job `model`.
    - Dann jedes gespeicherte Cron-Sitzungsmodell-Override.
    - Dann die normale Agent-/Standardmodellauswahl.

    Die Retry-Schleife ist begrenzt. Nach dem ersten Versuch plus 2 Wechsel-Retries
    bricht Cron ab, anstatt endlos zu schleifen.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [cron CLI](/cli/cron).

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

    Native `openclaw skills install` schreibt in das `skills/`-
    Verzeichnis des aktiven Workspace. Installieren Sie die separate `clawhub`-CLI nur, wenn Sie Ihre eigenen Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über mehrere Agenten legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie eingrenzen möchten, welche Agenten ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben zeitgesteuert oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cron-Jobs** für geplante oder wiederkehrende Aufgaben (bleiben über Neustarts hinweg erhalten).
    - **Heartbeat** für periodische Prüfungen der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agenten, die Zusammenfassungen posten oder an Chats zustellen.

    Dokumentation: [Cron-Jobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich nur für macOS verfügbare macOS-Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien gesteuert, und Skills erscheinen nur dann im System-Prompt, wenn sie auf dem **Gateway-Host** geeignet sind. Unter Linux werden reine `darwin`-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, sofern Sie das Gating nicht überschreiben.

    Es gibt drei unterstützte Muster:

    **Option A – das Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien vorhanden sind, und verbinden Sie sich dann von Linux aus im [Remote-Modus](#gateway-ports-already-running-and-remote-mode) oder über Tailscale. Die Skills werden normal geladen, weil der Gateway-Host macOS ist.

    **Option B – einen macOS Node verwenden (ohne SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS Node (Menüleisten-App), und setzen Sie **Node Run Commands** auf „Always Ask“ oder „Always Allow“ auf dem Mac. OpenClaw kann reine macOS-Skills als geeignet behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das `nodes`-Tool aus. Wenn Sie „Always Ask“ wählen, fügt das Genehmigen von „Always Allow“ in der Aufforderung diesen Befehl zur Allowlist hinzu.

    **Option C – macOS-Binärdateien über SSH proxien (fortgeschritten).**
    Behalten Sie das Gateway unter Linux, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien auf SSH-Wrapper aufgelöst werden, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill, um Linux zu erlauben, damit er weiterhin geeignet bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper auf `PATH` auf dem Linux-Host ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Apple Notes über die memo-CLI unter macOS verwalten.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Habt ihr eine Notion- oder HeyGen-Integration?">
    Heute nicht integriert.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Client behalten möchten (Agentur-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Client (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite zu Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, erstellen Sie eine Feature-Anfrage oder bauen Sie einen Skill,
    der auf diese APIs zielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über Agenten hinweg legen Sie sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agenten eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Manche Skills erwarten Binärdateien, die über Homebrew installiert wurden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein bestehendes angemeldetes Chrome mit OpenClaw?">
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

    Dieser Pfad kann den Browser des lokalen Hosts oder einen verbundenen Browser-Node verwenden. Wenn das Gateway anderswo läuft, führen Sie entweder einen Node-Host auf der Browser-Maschine aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Einschränkungen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selector-basiert
    - Uploads erfordern `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Abfangen und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es ein eigenes Sandboxing-Dokument?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (volles Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an – wie aktiviere ich die vollen Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher enthält es keine
    Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistent ist.

    Dokumentation: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs persönlich halten, aber Gruppen öffentlich/sandboxed mit einem Agenten machen?">
    Ja – wenn Ihr privater Traffic **DMs** sind und Ihr öffentlicher Traffic **Gruppen**.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanal-Sitzungen (Nicht-Hauptschlüssel) im konfigurierten Sandbox-Backend laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Docker ist das Standard-Backend, wenn Sie keines auswählen. Beschränken Sie dann mit `tools.sandbox.tools`, welche Tools in sandboxed Sitzungen verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + agentenspezifische Bindings werden zusammengeführt; agentenspezifische Bindings werden ignoriert, wenn `scope: "shared"` gesetzt ist. Verwenden Sie `:ro` für alles Sensible und denken Sie daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch gegen den kanonischen Pfad, der durch den tiefsten existierenden Vorfahren aufgelöst wird. Das bedeutet, dass Escapes über symlink-Parents weiterhin fail-closed fehlschlagen, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem vor der automatischen Compaction einen **stillen Memory-Flush** aus, um das Modell
    daran zu erinnern, vor der automatischen Compaction dauerhafte Notizen zu schreiben. Dies läuft nur, wenn der Workspace
    beschreibbar ist (schreibgeschützte Sandboxes überspringen dies). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie sorge ich dafür, dass sie bleiben?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext kommt in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiter Dinge vergisst, prüfen Sie, ob das Gateway bei jedem
    Lauf denselben Workspace verwendet.

    Dokumentation: [Memory](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Was sind die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Kontextfenster des Modells
    begrenzt, daher können lange Gespräche komprimiert oder gekürzt werden. Deshalb gibt es die
    Memory-Suche – sie zieht nur die relevanten Teile zurück in den Kontext.

    Dokumentation: [Memory](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt die semantische Memory-Suche einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder der
    Codex-CLI-Anmeldung)** nicht bei der semantischen Memory-Suche. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit festlegen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn sich ein OpenAI-Schlüssel auflösen lässt, andernfalls Gemini, wenn sich ein Gemini-Schlüssel
    auflösen lässt, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt die Memory-
    Suche deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben Sie `GEMINI_API_KEY` (oder
    `memorySearch.remote.apiKey`) an. Wir unterstützen Embedding-
    Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder lokal** – siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein – **der Zustand von OpenClaw ist lokal**, aber **externe Services sehen weiterhin, was Sie an sie senden**.

    - **Standardmäßig lokal:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Zwangsläufig remote:** Nachrichten, die Sie an Modell-Provider (Anthropic/OpenAI/usw.) senden, gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/usw.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie steuern den Footprint:** Die Verwendung lokaler Modelle hält Prompts auf Ihrer Maschine, aber Kanal-
      Traffic läuft weiterhin über die Server des jeweiligen Kanals.

    Verwandte Themen: [Agent-Workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Path                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-OAuth-Import (wird bei der ersten Nutzung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionaler dateigestützter Secret-Payload für `file` SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-Kompatibilitätsdatei (statische `api_key`-Einträge bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Pro-Agent-Zustand (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gesprächsverlauf & Zustand (pro Agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Legacy-Single-Agent-Pfad: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`).

    Ihr **Workspace** (`AGENTS.md`, Memory-Dateien, Skills usw.) ist getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder Legacy-Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Auth-Profile, Sitzungen, Logs,
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, prüfen Sie, dass das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Der Remote-Modus verwendet den Workspace des **Gateway-Hosts**,
    nicht den Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, es **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent-Workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in ein **privates** git-Repository und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub private). Damit erfassen Sie Memory + AGENTS/SOUL/USER-
    Dateien und können den „Geist“ des Assistenten später wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (`credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Dokumentation: [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die spezielle Anleitung: [Deinstallieren](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agenten außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-cwd** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Speicherorte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder agentenspezifische Sandbox-Einstellungen. Wenn Sie
    möchten, dass ein Repository das Standard-Arbeitsverzeichnis ist, setzen Sie den
    `workspace` dieses Agenten auf das Repository-Root. Das OpenClaw-Repository ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten absichtlich, dass der Agent darin arbeitet.

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie sich im Remote-Modus befinden, liegt der relevante Sitzungsspeicher auf der Remote-Maschine, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo ist sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es einigermaßen sichere Standardwerte (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt, und jetzt lauscht nichts / die UI sagt unauthorized'>
    Bindungen außerhalb von loopback **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Auth: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten Identity-aware-Reverse-Proxy ohne loopback

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

    - `gateway.remote.token` / `.password` aktivieren lokale Gateway-Auth **nicht** von selbst.
    - Lokale Call-Pfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Auth setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (kein maskierender Remote-Fallback).
    - Shared-Secret-Control-UI-Setups authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Modi mit Identitätsinformationen wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie es, Shared Secrets in URLs zu platzieren.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse-Proxys über loopback auf demselben Host **nicht** die trusted-proxy-Auth. Der trusted proxy muss eine konfigurierte Quelle ohne loopback sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt standardmäßig Gateway-Auth, einschließlich loopback. Im normalen Standardpfad bedeutet das Token-Auth: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird beim Gateway-Start der Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird, sodass **lokale WS-Clients authentifiziert werden müssen**. Dadurch wird verhindert, dass andere lokale Prozesse das Gateway aufrufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder, für Identity-aware-Reverse-Proxys ohne loopback, `trusted-proxy`). Wenn Sie **wirklich** offenes loopback möchten, setzen Sie explizit `gateway.auth.mode: "none"` in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, für kritische Änderungen neu starten
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

    - `off`: blendet den Tagline-Text aus, behält aber die Titel-/Versionszeile des Banners bei.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie überhaupt kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Fetch)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily erfordern ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search benötigt keinen Schlüssel, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo benötigt keinen Schlüssel, ist aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

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
    Legacy-Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend noch geladen, sollten aber nicht für neue Konfigurationen verwendet werden.
    Firecrawl-Web-Fetch-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten bereiten Fetch-Fallback-Provider aus den verfügbaren Anmeldedaten. Der gebündelte Provider ist derzeit Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder der Service-Umgebung).

    Dokumentation: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und vermeide das künftig?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Das aktuelle OpenClaw schützt vor vielen versehentlichen Überschreibungen:

    - Von OpenClaw selbst vorgenommene Konfigurationsschreibvorgänge validieren die vollständige Konfiguration nach der Änderung vor dem Schreiben.
    - Ungültige oder destruktive, von OpenClaw selbst vorgenommene Schreibvorgänge werden abgelehnt und als `openclaw.json.rejected.*` gespeichert.
    - Wenn eine direkte Bearbeitung den Start oder Hot-Reload kaputt macht, stellt das Gateway die letzte bekannte funktionierende Konfiguration wieder her und speichert die abgelehnte Datei als `openclaw.json.clobbered.*`.
    - Der Haupt-Agent erhält nach der Wiederherstellung eine Startwarnung, damit er die fehlerhafte Konfiguration nicht blind erneut schreibt.

    Wiederherstellen:

    - Prüfen Sie `openclaw logs --follow` auf `Config auto-restored from last-known-good`, `Config write rejected:` oder `config reload restored last-known-good config`.
    - Prüfen Sie die neueste `openclaw.json.clobbered.*` oder `openclaw.json.rejected.*` neben der aktiven Konfiguration.
    - Behalten Sie die aktive wiederhergestellte Konfiguration, wenn sie funktioniert, und kopieren Sie dann nur die beabsichtigten Schlüssel mit `openclaw config set` oder `config.patch` zurück.
    - Führen Sie `openclaw config validate` und `openclaw doctor` aus.
    - Wenn Sie keine letzte bekannte funktionierende oder abgelehnte Payload haben, stellen Sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus und konfigurieren Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre letzte bekannte Konfiguration oder ein Backup bei.
    - Ein lokaler Coding-Agent kann oft aus Logs oder Verlauf eine funktionierende Konfiguration rekonstruieren.

    Vermeiden:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Bearbeitungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich bei einem exakten Pfad oder der Form eines Felds nicht sicher sind; es gibt einen flachen Schema-Knoten plus unmittelbare Child-Zusammenfassungen zur schrittweisen Vertiefung zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; reservieren Sie `config.apply` nur für den vollständigen Ersatz der Konfiguration.
    - Wenn Sie das nur für Eigentümer verfügbare `gateway`-Tool aus einem Agent-Lauf verwenden, lehnt es weiterhin Schreibvorgänge in `tools.exec.ask` / `tools.exec.security` ab (einschließlich Legacy-`tools.bash.*`-Aliasse, die auf dieselben geschützten exec-Pfade normalisiert werden).

    Dokumentation: [Config](/cli/config), [Configure](/cli/configure), [Gateway-Fehlersuche](/de/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie betreibe ich ein zentrales Gateway mit spezialisierten Workern auf mehreren Geräten?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agenten**:

    - **Gateway (zentral):** besitzt Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripheriegeräte und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agenten (Worker):** separate Gehirne/Workspaces für spezielle Rollen (z. B. „Hetzner ops“, „Persönliche Daten“).
    - **Sub-Agenten:** starten Hintergrundarbeit von einem Haupt-Agenten aus, wenn Sie Parallelität möchten.
    - **TUI:** mit dem Gateway verbinden und Agenten/Sitzungen wechseln.

    Dokumentation: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [TUI](/web/tui).

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

    Der Standard ist `false` (mit sichtbarem Browserfenster). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meisten Automatisierungen (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie Visuals brauchen).
    - Manche Websites sind im Headless-Modus strenger bei Automatisierung (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter häufig Headless-Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browser-Steuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen beliebigen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Siehe die vollständigen Konfigurationsbeispiele unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie werden Befehle zwischen Telegram, dem Gateway und Nodes weitergegeben?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft erst dann Nodes über den **Gateway-WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Traffic; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurzantwort: **Koppeln Sie Ihren Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrer lokalen Maschine über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Führen Sie das Gateway auf dem Always-on-Host aus (VPS/Homeserver).
    2. Bringen Sie den Gateway-Host und Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass der Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie lokal die macOS-App und verbinden Sie sich im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS Node erlaubt `system.run` auf dieser Maschine. Koppeln Sie nur
    Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Dokumentation: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was nun?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Zustand: `openclaw status`
    - Kanal-Zustand: `openclaw channels status`

    Verifizieren Sie dann Authentifizierung und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Dokumentation: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können das auf einige
    zuverlässige Arten aufsetzen:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und lassen Sie Bot B dann wie gewohnt antworten.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    zuhört. Wenn ein Bot auf einem Remote-VPS läuft, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einer Maschine ausführen, die das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hallo vom lokalen Bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Guardrail hinzu, damit die beiden Bots nicht endlos in Schleifen laufen (nur bei Erwähnung, Kanal-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Dokumentation: [Remote-Zugriff](/de/gateway/remote), [Agent-CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agenten separate VPSes?">
    Nein. Ein Gateway kann mehrere Agenten hosten, jeder mit eigenem Workspace, Modell-Standards,
    und Routing. Das ist das normale Setup und viel günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen brauchen, die Sie nicht teilen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agenten oder Sub-Agenten.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, auf meinem persönlichen Laptop einen Node statt SSH von einem VPS zu verwenden?">
    Ja – Nodes sind der erstklassige Weg, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft unter macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Box in Raspberry-Pi-Klasse reicht aus; 4 GB RAM sind reichlich), daher ist ein häufiges
    Setup ein Always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Gerätekopplung.
    - **Sicherere Ausführungssteuerung.** `system.run` wird auf diesem Laptop durch Node-Allowlists/Genehmigungen gesteuert.
    - **Mehr Geräte-Tools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Behalten Sie das Gateway auf einem VPS, führen Sie Chrome aber lokal über einen Node-Host auf dem Laptop aus oder verbinden Sie sich über Chrome MCP mit lokalem Chrome auf dem Host.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind für laufende Agent-Workflows und
    Geräteautomatisierung einfacher.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie betreiben absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS-/Android-Nodes oder macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node host CLI](/cli/node).

    Ein vollständiger Neustart ist für Änderungen an `gateway`, `discovery` und `canvasHost` erforderlich.

  </Accordion>

  <Accordion title="Gibt es einen API-/RPC-Weg, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: einen Konfigurations-Teilbaum mit seinem flachen Schema-Knoten, passendem UI-Hinweis und unmittelbaren Child-Zusammenfassungen prüfen, bevor geschrieben wird
    - `config.get`: den aktuellen Snapshot + Hash abrufen
    - `config.patch`: sichere partielle Aktualisierung (für die meisten RPC-Bearbeitungen bevorzugt); führt nach Möglichkeit Hot-Reload aus und startet bei Bedarf neu
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration; führt nach Möglichkeit Hot-Reload aus und startet bei Bedarf neu
    - Das nur für Eigentümer verfügbare Runtime-Tool `gateway` weigert sich weiterhin, `tools.exec.ask` / `tools.exec.security` umzuschreiben; Legacy-`tools.bash.*`-Aliasse normalisieren auf dieselben geschützten exec-Pfade

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine Erstinstallation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dadurch wird Ihr Workspace gesetzt und eingeschränkt, wer den Bot auslösen kann.

  </Accordion>

  <Accordion title="Wie richte ich Tailscale auf einem VPS ein und verbinde mich von meinem Mac aus?">
    Minimale Schritte:

    1. **Installieren + auf dem VPS anmelden**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installieren + auf Ihrem Mac anmelden**
       - Verwenden Sie die Tailscale-App und melden Sie sich im selben Tailnet an.
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

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass sich VPS + Mac im selben Tailnet befinden**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt dann den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Dokumentation: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie auf dem zweiten Laptop nur **lokale Tools** (Bildschirm/Kamera/exec) benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch behalten Sie ein einzelnes Gateway und vermeiden doppelte Konfiguration. Lokale Node-Tools sind
    derzeit nur unter macOS verfügbar, wir planen aber, sie auf weitere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur dann, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots brauchen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem Parent-Prozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`)

    Keine der beiden `.env`-Dateien überschreibt bestehende Umgebungsvariablen.

    Sie können auch Inline-Umgebungsvariablen in der Konfiguration definieren (werden nur angewendet, wenn sie in der Prozessumgebung fehlen):

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
    2. Aktivieren Sie Shell-Import (Opt-in-Komfortfunktion):

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (nie überschrieben). Äquivalente Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen – es bedeutet nur, dass OpenClaw
    Ihre Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das auf eine dieser Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es in Ihren `env`-Block der Konfiguration ein (gilt nur, wenn es fehlt).

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
    Setzen Sie einen positiven Wert, um den Leerlauf-Ablauf zu aktivieren. Wenn er aktiviert ist, startet die **nächste**
    Nachricht nach dem Leerlaufzeitraum eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden Transkripte nicht gelöscht – es wird nur eine neue Sitzung gestartet.

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
    Agenten und mehrere Worker-Agenten mit ihren eigenen Workspaces und Modellen erstellen.

    Allerdings sollte dies eher als **lustiges Experiment** gesehen werden. Es ist tokenintensiv und oft
    weniger effizient als ein Bot mit getrennten Sitzungen. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit verschiedenen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agenten starten.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agenten](/de/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in einer Aufgabe abgeschnitten? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Compaction oder Kürzung auslösen.

    Hilfreich ist:

    - Bitten Sie den Bot, den aktuellen Stand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new` beim Themenwechsel.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agenten für lange oder parallele Arbeit, damit der Hauptchat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn das häufig passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, aber behalte es installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann die Einrichtung erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Onboarding bietet auch **Reset** an, wenn eine bestehende Konfiguration erkannt wird. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Verzeichnis zurück (Standardwerte sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Entwicklung; löscht Dev-Konfiguration + Anmeldedaten + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme "context too large"-Fehler – wie setze ich zurück oder komprimiere?'>
    Verwenden Sie eine dieser Möglichkeiten:

    - **Compaction** (behält die Unterhaltung, fasst aber ältere Turns zusammen):

      ```
      /compact
      ```

      oder `/compact <instructions>`, um die Zusammenfassung zu steuern.

    - **Zurücksetzen** (neue Sitzungs-ID für denselben Chat-Schlüssel):

      ```
      /new
      /reset
      ```

    Wenn es weiterhin passiert:

    - Aktivieren oder optimieren Sie **Session Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu kürzen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Dokumentation: [Compaction](/de/concepts/compaction), [Session Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Änderung an Tool/Schema).

    Lösung: Starten Sie mit `/new` eine frische Sitzung (eigenständige Nachricht).

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30 m** (**1 h** bei Verwendung von OAuth-Auth). Passen Sie sie an oder deaktivieren Sie sie:

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

    Pro-Agent-Overrides verwenden `agents.list[].heartbeat`. Dokumentation: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn Sie darin sind.
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

  <Accordion title="Wie bekomme ich die JID einer WhatsApp-Gruppe?">
    Option 1 (am schnellsten): Logs mitverfolgen und eine Testnachricht in die Gruppe senden:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Dokumentation: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiviert (Standard). Sie müssen den Bot mit @ erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direktchats werden standardmäßig in die Hauptsitzung zusammengeführt. Gruppen/Kanäle haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind getrennte Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agenten kann ich erstellen?">
    Keine harten Limits. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Wachstum des Speicherplatzbedarfs:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** Mehr Agenten bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Aufwand:** Pro-Agent-Auth-Profile, Workspaces und Kanal-Routing.

    Tipps:

    - Behalten Sie pro Agent einen **aktiven** Workspace (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (löschen Sie JSONL- oder Store-Einträge), wenn der Speicherplatzbedarf wächst.
    - Verwenden Sie `openclaw doctor`, um verstreute Workspaces und Profil-Mismatches zu erkennen.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agenten auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann an bestimmte Agenten gebunden werden.

    Browser-Zugriff ist leistungsstark, aber nicht „alles, was ein Mensch kann“ – Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host
    oder CDP auf der Maschine, auf der der Browser tatsächlich läuft.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - An diese Agenten gebundene Slack-Kanäle.
    - Lokaler Browser über Chrome MCP oder bei Bedarf einen Node.

    Dokumentation: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standards, Auswahl, Aliasse, Wechsel

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was Sie hier setzen:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und greift erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt ein veraltetes entferntes Provider-Standardmodell anzuzeigen. Sie sollten dennoch **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste aktuelle Modell, das in Ihrem Provider-Stack verfügbar ist.
    **Für tool-fähige Agenten oder Agenten mit nicht vertrauenswürdigen Eingaben:** Priorisieren Sie Modellstärke vor Kosten.
    **Für Routine-/Low-Stakes-Chat:** Verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agentenrolle.

    MiniMax hat eigene Dokumentation: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwenden Sie für risikoreiche Arbeit das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agenten verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Sub-Agenten](/de/tools/subagents).

    Deutliche Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie wechsle ich Modelle, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modell-Befehle** oder bearbeiten Sie nur die Felder für das **Modell**. Vermeiden Sie vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modell-Konfiguration)
    - `openclaw configure --section model` (interaktiv)
    - `agents.defaults.model` in `~/.openclaw/openclaw.json` bearbeiten

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, es sei denn, Sie möchten die gesamte Konfiguration ersetzen.
    Für RPC-Bearbeitungen zuerst mit `config.schema.lookup` prüfen und `config.patch` bevorzugen. Die Lookup-Payload gibt Ihnen den normalisierten Pfad, flache Schema-Dokumentation/-Constraints und unmittelbare Child-Zusammenfassungen
    für partielle Aktualisierungen.
    Wenn Sie die Konfiguration doch überschrieben haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Dokumentation: [Modelle](/de/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellstes Setup:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Pullen Sie ein lokales Modell wie `ollama pull gemma4`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - Für manuelles Wechseln verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt
    Injection. Wir empfehlen für jeden Bot, der Tools verwenden kann, dringend **große Modelle**.
    Wenn Sie dennoch kleine Modelle verwenden möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlists.

    Dokumentation: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können unterschiedlich sein und sich mit der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitssensitive/tool-fähige Agenten verwenden Sie das stärkste aktuelle Modell, das verfügbar ist.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle spontan (ohne Neustart)?">
    Verwenden Sie den Befehl `/model` als eigenständige Nachricht:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Dies sind die eingebauten Aliasse. Benutzerdefinierte Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Sie können verfügbare Modelle mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten nummerierten Picker. Wählen Sie per Nummer:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche `auth-profiles.json`-Datei verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Außerdem werden der konfigurierte Provider-Endpunkt (`baseUrl`) und der API-Modus (`api`) angezeigt, wenn verfügbar.

    **Wie löse ich die Profilanheftung, die ich mit @profile gesetzt habe?**

    Führen Sie `/model` erneut **ohne** den Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn über `/model` aus (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 fürs Programmieren verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie nach Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` fürs Programmieren mit Codex OAuth.
    - **Standard + Wechsel:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4` und wechseln Sie dann beim Programmieren zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agenten:** Leiten Sie Programmieraufgaben an Sub-Agenten mit einem anderen Standardmodell weiter.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich Fast Mode für GPT 5.4?">
    Verwenden Sie entweder einen Sitzungs-Toggle oder einen Konfigurationsstandard:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** Setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch für Codex OAuth:** Wenn Sie außerdem `openai-codex/gpt-5.4` verwenden, setzen Sie dort dieselbe Flag.

    Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Für OpenAI wird Fast Mode bei unterstützten nativen Responses-Requests auf `service_tier = "priority"` abgebildet. Sitzungs-`/fast`-Overrides haben Vorrang vor Konfigurationsstandards.

    Siehe [Thinking and fast mode](/de/tools/thinking) und [OpenAI fast mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Wenn Sie ein Modell wählen, das nicht in dieser Liste steht, erhalten Sie:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Allowlist oder wählen Sie ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), sodass das Modell nicht aufgelöst werden kann.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf eine aktuelle OpenClaw-Version (oder führen Sie den Quellcode-Branch `main` aus) und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Auth
       in den Umgebungsvariablen/Auth-Profilen vorhanden ist, sodass der passende Provider injiziert
       werden kann (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (Groß-/Kleinschreibung beachten) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für API-key-
       Setup oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für OAuth-Setup.
    4. Führen Sie aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie Modelle **pro Sitzung**, wenn nötig.
    Fallbacks sind für **Fehler**, nicht für „schwierige Aufgaben“, daher verwenden Sie `/model` oder einen separaten Agenten.

    **Option A: pro Sitzung wechseln**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Dann:

    ```
    /model gpt
    ```

    **Option B: separate Agenten**

    - Standard von Agent A: MiniMax
    - Standard von Agent B: OpenAI
    - Nach Agent routen oder `/agent` zum Wechseln verwenden

    Dokumentation: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

  </Accordion>

  <Accordion title="Sind opus / sonnet / gpt eingebaute Kurzbefehle?">
    Ja. OpenClaw liefert einige Standard-Kurzformen mit (werden nur angewendet, wenn das Modell in `agents.defaults.models` existiert):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Wenn Sie einen eigenen Alias mit demselben Namen setzen, gewinnt Ihr Wert.

  </Accordion>

  <Accordion title="Wie definiere/überschreibe ich Modell-Kurzbefehle (Aliasse)?">
    Aliasse kommen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Dann wird `/model sonnet` (oder `/<alias>`, wenn unterstützt) auf diese Modell-ID aufgelöst.

  </Accordion>

  <Accordion title="Wie füge ich Modelle von anderen Providern wie OpenRouter oder Z.AI hinzu?">
    OpenRouter (Pay-per-Token; viele Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM-Modelle):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Wenn Sie auf ein Provider-/Modellpaar verweisen, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Auth-Fehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Auth ist pro Agent und
    wird hier gespeichert:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Möglichkeiten zur Behebung:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie Auth während des Assistenten.
    - Oder kopieren Sie `auth-profiles.json` aus dem `agentDir` des Haupt-Agenten in das `agentDir` des neuen Agenten.

    Verwenden Sie `agentDir` **nicht** für mehrere Agenten gemeinsam; das verursacht Auth-/Sitzungskollisionen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und „All models failed“

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover erfolgt in zwei Stufen:

    1. **Rotation des Auth-Profils** innerhalb desselben Providers.
    2. **Modell-Fallback** zum nächsten Modell in `agents.defaults.model.fallbacks`.

    Cooldowns gelten für fehlschlagende Profile (exponentielles Backoff), sodass OpenClaw weiter antworten kann, selbst wenn ein Provider rate-limitiert ist oder vorübergehend ausfällt.

    Der Ratenlimit-Bucket umfasst mehr als einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als Failover-würdige
    Ratenlimits.

    Einige Antworten, die nach Abrechnung aussehen, sind kein `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Abrechnungstext auf `401` oder `403` zurückgibt, kann OpenClaw das weiterhin
    in der Billing-Spur behalten, aber provider-spezifische Text-Matcher bleiben auf den
    Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Nachricht stattdessen wie ein wiederholbares Nutzungsfenster oder
    ein Organization-/Workspace-Ausgabenlimit aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dies als
    `rate_limit`, nicht als langfristige Billing-Deaktivierung.

    Kontextüberlauf-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben auf dem Compaction-/Retry-Pfad, anstatt den Modell-
    Fallback weiterzuschalten.

    Generischer Serverfehler-Text ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-bezogene transiente Muster
    wie Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payloads mit transientem Servertext
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) und provider-busy-Fehler wie `ModelNotReadyException` als
    Failover-würdige Timeout-/Overloaded-Signale, wenn der Provider-Kontext
    passt.
    Generischer interner Fallback-Text wie `LLM request failed with an unknown
    error.` bleibt konservativ und löst nicht von selbst Modell-Fallback aus.

  </Accordion>

  <Accordion title='Was bedeutet "No credentials found for profile anthropic:default"?'>
    Das bedeutet, dass das System versucht hat, die Auth-Profil-ID `anthropic:default` zu verwenden, aber dafür keine Anmeldedaten im erwarteten Auth-Store finden konnte.

    **Checkliste zur Behebung:**

    - **Bestätigen Sie, wo Auth-Profile liegen** (neue vs. Legacy-Pfade)
      - Aktuell: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migriert durch `openclaw doctor`)
    - **Bestätigen Sie, dass Ihre Umgebungsvariable vom Gateway geladen wird**
      - Wenn Sie `ANTHROPIC_API_KEY` in Ihrer Shell gesetzt haben, das Gateway aber über systemd/launchd ausführen, wird sie möglicherweise nicht geerbt. Legen Sie sie in `~/.openclaw/.env` ab oder aktivieren Sie `env.shellEnv`.
    - **Stellen Sie sicher, dass Sie den richtigen Agenten bearbeiten**
      - Multi-Agent-Setups bedeuten, dass es mehrere `auth-profiles.json`-Dateien geben kann.
    - **Plausibilitätsprüfung von Modell-/Auth-Status**
      - Verwenden Sie `openclaw models status`, um konfigurierte Modelle und den Authentifizierungsstatus der Provider zu sehen.

    **Checkliste zur Behebung für "No credentials found for profile anthropic"**

    Das bedeutet, dass der Lauf an ein Anthropic-Auth-Profil angeheftet ist, das Gateway
    es aber in seinem Auth-Store nicht finden kann.

    - **Claude CLI verwenden**
      - Führen Sie `openclaw models auth login --provider anthropic --method cli --set-default` auf dem Gateway-Host aus.
    - **Wenn Sie stattdessen einen API-Schlüssel verwenden möchten**
      - Legen Sie `ANTHROPIC_API_KEY` in `~/.openclaw/.env` auf dem **Gateway-Host** ab.
      - Entfernen Sie jede angeheftete Reihenfolge, die ein fehlendes Profil erzwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bestätigen Sie, dass Sie Befehle auf dem Gateway-Host ausführen**
      - Im Remote-Modus liegen Auth-Profile auf der Gateway-Maschine, nicht auf Ihrem Laptop.

  </Accordion>

  <Accordion title="Warum hat es auch Google Gemini versucht und ist fehlgeschlagen?">
    Wenn Ihre Modellkonfiguration Google Gemini als Fallback enthält (oder Sie zu einer Gemini-Kurzform gewechselt sind), versucht OpenClaw es beim Modell-Fallback damit. Wenn Sie keine Google-Anmeldedaten konfiguriert haben, sehen Sie `No API key found for provider "google"`.

    Lösung: Geben Sie entweder Google-Auth an oder entfernen/vermeiden Sie Google-Modelle in `agents.defaults.model.fallbacks` / Aliasen, damit der Fallback nicht dorthin routet.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Ursache: Der Sitzungsverlauf enthält **Thinking-Blöcke ohne Signaturen** (oft aus
    einem abgebrochenen/teilweisen Stream). Google Antigravity erfordert Signaturen für Thinking-Blöcke.

    Lösung: OpenClaw entfernt jetzt unsignierte Thinking-Blöcke für Google Antigravity Claude. Wenn es weiterhin erscheint, starten Sie eine **neue Sitzung** oder setzen Sie `/thinking off` für diesen Agenten.

  </Accordion>
</AccordionGroup>

## Auth-Profile: was sie sind und wie man sie verwaltet

Verwandt: [/concepts/oauth](/de/concepts/oauth) (OAuth-Flows, Token-Speicherung, Multi-Account-Muster)

<AccordionGroup>
  <Accordion title="Was ist ein Auth-Profil?">
    Ein Auth-Profil ist ein benannter Anmeldedatensatz (OAuth oder API-Schlüssel), der an einen Provider gebunden ist. Profile liegen in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Wie sehen typische Profil-IDs aus?">
    OpenClaw verwendet Provider-präfixierte IDs wie:

    - `anthropic:default` (häufig, wenn keine E-Mail-Identität existiert)
    - `anthropic:<email>` für OAuth-Identitäten
    - benutzerdefinierte IDs Ihrer Wahl (z. B. `anthropic:work`)

  </Accordion>

  <Accordion title="Kann ich steuern, welches Auth-Profil zuerst versucht wird?">
    Ja. Die Konfiguration unterstützt optionale Metadaten für Profile und eine Reihenfolge pro Provider (`auth.order.<provider>`). Dadurch werden **keine** Secrets gespeichert; es ordnet IDs Provider/Modus zu und setzt die Rotationsreihenfolge fest.

    OpenClaw kann ein Profil vorübergehend überspringen, wenn es sich in einem kurzen **Cooldown** (Ratenlimits/Timeouts/Auth-Fehler) oder einem längeren **disabled**-Zustand (Abrechnung/ungenügende Credits) befindet. Um dies zu prüfen, führen Sie `openclaw models status --json` aus und prüfen Sie `auth.unusableProfiles`. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Ratenlimit-Cooldowns können modellbezogen sein. Ein Profil, das für ein Modell
    im Cooldown ist, kann für ein benachbartes Modell desselben Providers weiterhin nutzbar sein,
    während Billing-/disabled-Fenster weiterhin das ganze Profil blockieren.

    Sie können auch über die CLI eine **pro-Agent**-Reihenfolgenüberschreibung setzen (gespeichert in `auth-state.json` dieses Agenten):

    ```bash
    # Standardmäßig der konfigurierte Standard-Agent (lassen Sie --agent weg)
    openclaw models auth order get --provider anthropic

    # Rotation auf ein einzelnes Profil sperren (nur dieses versuchen)
    openclaw models auth order set --provider anthropic anthropic:default

    # Oder eine explizite Reihenfolge setzen (Fallback innerhalb des Providers)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Überschreibung löschen (auf config auth.order / Round-Robin zurückfallen)
    openclaw models auth order clear --provider anthropic
    ```

    Um auf einen bestimmten Agenten zu zielen:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Um zu prüfen, was tatsächlich versucht wird, verwenden Sie:

    ```bash
    openclaw models status --probe
    ```

    Wenn ein gespeichertes Profil in der expliziten Reihenfolge fehlt, meldet probe
    für dieses Profil `excluded_by_auth_order`, anstatt es stillschweigend zu versuchen.

  </Accordion>

  <Accordion title="OAuth vs. API key – was ist der Unterschied?">
    OpenClaw unterstützt beides:

    - **OAuth** nutzt oft Abo-Zugriff (wo zutreffend).
    - **API keys** verwenden Pay-per-Token-Abrechnung.

    Der Assistent unterstützt explizit Anthropic Claude CLI, OpenAI Codex OAuth und API keys.

  </Accordion>
</AccordionGroup>

## Gateway: Ports, „already running“ und Remote-Modus

<AccordionGroup>
  <Accordion title="Welchen Port verwendet das Gateway?">
    `gateway.port` steuert den einzelnen multiplexten Port für WebSocket + HTTP (Control UI, Hooks usw.).

    Priorität:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > Standard 18789
    ```

  </Accordion>

  <Accordion title='Warum sagt openclaw gateway status "Runtime: running", aber "Connectivity probe: failed"?'>
    Weil „running“ die Sicht des **Supervisors** ist (launchd/systemd/schtasks). Die Connectivity-Probe ist die CLI, die sich tatsächlich mit dem Gateway-WebSocket verbindet.

    Verwenden Sie `openclaw gateway status` und verlassen Sie sich auf diese Zeilen:

    - `Probe target:` (die URL, die die Probe tatsächlich verwendet hat)
    - `Listening:` (was tatsächlich an den Port gebunden ist)
    - `Last gateway error:` (häufige Ursache, wenn der Prozess lebt, aber der Port nicht lauscht)

  </Accordion>

  <Accordion title='Warum zeigt openclaw gateway status unterschiedliche Werte für "Config (cli)" und "Config (service)"?'>
    Sie bearbeiten eine Konfigurationsdatei, während der Service eine andere ausführt (oft ein Mismatch bei `--profile` / `OPENCLAW_STATE_DIR`).

    Lösung:

    ```bash
    openclaw gateway install --force
    ```

    Führen Sie dies aus derselben `--profile`-/Umgebung aus, die der Service verwenden soll.

  </Accordion>

  <Accordion title='Was bedeutet "another gateway instance is already listening"?'>
    OpenClaw erzwingt eine Laufzeitsperre, indem es den WebSocket-Listener beim Start sofort bindet (Standard `ws://127.0.0.1:18789`). Wenn das Binden mit `EADDRINUSE` fehlschlägt, wirft es `GatewayLockError`, was darauf hinweist, dass bereits eine andere Instanz lauscht.

    Lösung: Stoppen Sie die andere Instanz, geben Sie den Port frei oder starten Sie mit `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Wie betreibe ich OpenClaw im Remote-Modus (Client verbindet sich mit einem Gateway anderswo)?">
    Setzen Sie `gateway.mode: "remote"` und zeigen Sie auf eine Remote-WebSocket-URL, optional mit Remote-Anmeldedaten per Shared Secret:

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

    - `openclaw gateway` startet nur, wenn `gateway.mode` auf `local` steht (oder Sie die Override-Flag übergeben).
    - Die macOS-App überwacht die Konfigurationsdatei und wechselt live den Modus, wenn sich diese Werte ändern.
    - `gateway.remote.token` / `.password` sind nur clientseitige Remote-Anmeldedaten; sie aktivieren lokale Gateway-Auth nicht von selbst.

  </Accordion>

  <Accordion title='Die Control UI sagt "unauthorized" (oder verbindet sich ständig neu). Was nun?'>
    Der Auth-Pfad Ihres Gateways und die Auth-Methode der UI passen nicht zusammen.

    Fakten (aus dem Code):

    - Die Control UI speichert das Token in `sessionStorage` für die aktuelle Browser-Tab-Sitzung und die ausgewählte Gateway-URL, sodass Aktualisierungen im selben Tab weiter funktionieren, ohne langlebige lokaleStorage-Token-Persistenz wiederherzustellen.
    - Bei `AUTH_TOKEN_MISMATCH` können vertrauenswürdige Clients einen begrenzten Retry mit einem gecachten Device-Token versuchen, wenn das Gateway Retry-Hinweise zurückgibt (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Dieser Retry mit gecachtem Token verwendet nun die gecachten genehmigten Scopes, die mit dem Device-Token gespeichert wurden. Explizite `deviceToken`-/explizite-`scopes`-Aufrufer behalten weiterhin ihren angeforderten Scope-Satz, statt gecachte Scopes zu übernehmen.
    - Außerhalb dieses Retry-Pfads ist die Priorität bei connect-Auth: zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Device-Token, dann Bootstrap-Token.
    - Scope-Prüfungen für Bootstrap-Token sind rollenpräfixiert. Die eingebaute Bootstrap-Operator-Allowlist erfüllt nur Operator-Anfragen; Node- oder andere Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

    Lösung:

    - Am schnellsten: `openclaw dashboard` (gibt die Dashboard-URL aus + kopiert sie, versucht zu öffnen; zeigt SSH-Hinweis, wenn headless).
    - Wenn Sie noch kein Token haben: `openclaw doctor --generate-gateway-token`.
    - Wenn remote, zuerst tunneln: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen.
    - Shared-Secret-Modus: Setzen Sie `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oder `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` und fügen Sie dann das passende Secret in die Einstellungen der Control UI ein.
    - Tailscale-Serve-Modus: Stellen Sie sicher, dass `gateway.auth.allowTailscale` aktiviert ist und dass Sie die Serve-URL öffnen, nicht eine rohe loopback-/Tailnet-URL, die Tailscale-Identitäts-Header umgeht.
    - Trusted-proxy-Modus: Stellen Sie sicher, dass Sie über den konfigurierten Identity-aware-Proxy ohne loopback kommen, nicht über einen loopback-Proxy auf demselben Host oder eine rohe Gateway-URL.
    - Wenn das Mismatch nach dem einen Retry bestehen bleibt, rotieren/genehmigen Sie das gekoppelte Device-Token neu:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Wenn dieser Rotate-Aufruf sagt, dass er abgelehnt wurde, prüfen Sie zwei Dinge:
      - Sitzungen gekoppelter Geräte können nur ihr **eigenes** Gerät rotieren, es sei denn, sie haben zusätzlich `operator.admin`
      - Explizite `--scope`-Werte dürfen die aktuellen Operator-Scopes des Aufrufers nicht überschreiten
    - Immer noch fest? Führen Sie `openclaw status --all` aus und folgen Sie [Fehlersuche](/de/gateway/troubleshooting). Siehe [Dashboard](/web/dashboard) für Auth-Details.

  </Accordion>

  <Accordion title="Ich habe gateway.bind tailnet gesetzt, aber es kann nicht binden und nichts lauscht">
    Die Bindung `tailnet` wählt eine Tailscale-IP aus Ihren Netzwerkschnittstellen (100.64.0.0/10). Wenn die Maschine nicht in Tailscale ist (oder die Schnittstelle down ist), gibt es nichts, woran gebunden werden kann.

    Lösung:

    - Starten Sie Tailscale auf diesem Host (damit er eine 100.x-Adresse hat), oder
    - wechseln Sie zu `gateway.bind: "loopback"` / `"lan"`.

    Hinweis: `tailnet` ist explizit. `auto` bevorzugt loopback; verwenden Sie `gateway.bind: "tailnet"`, wenn Sie eine Bindung nur ans Tailnet möchten.

  </Accordion>

  <Accordion title="Kann ich mehrere Gateways auf demselben Host betreiben?">
    Normalerweise nein – ein Gateway kann mehrere Messaging-Kanäle und Agenten betreiben. Verwenden Sie mehrere Gateways nur, wenn Sie Redundanz (z. B. Rescue-Bot) oder harte Isolation benötigen.

    Ja, aber Sie müssen isolieren:

    - `OPENCLAW_CONFIG_PATH` (pro Instanz eigene Konfiguration)
    - `OPENCLAW_STATE_DIR` (pro Instanz eigener Zustand)
    - `agents.defaults.workspace` (Workspace-Isolation)
    - `gateway.port` (eindeutige Ports)

    Schnelles Setup (empfohlen):

    - Verwenden Sie `openclaw --profile <name> ...` pro Instanz (erstellt automatisch `~/.openclaw-<name>`).
    - Setzen Sie in jeder Profil-Konfiguration einen eindeutigen `gateway.port` (oder übergeben Sie `--port` bei manuellen Läufen).
    - Installieren Sie einen Service pro Profil: `openclaw --profile <name> gateway install`.

    Profile suffixieren auch die Service-Namen (`ai.openclaw.<profile>`; Legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Vollständige Anleitung: [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Was bedeutet "invalid handshake" / Code 1008?'>
    Das Gateway ist ein **WebSocket-Server**, und es erwartet, dass die allererste Nachricht
    ein `connect`-Frame ist. Wenn es etwas anderes empfängt, schließt es die Verbindung
    mit **Code 1008** (Policy Violation).

    Häufige Ursachen:

    - Sie haben die **HTTP**-URL in einem Browser geöffnet (`http://...`) statt mit einem WS-Client.
    - Sie haben den falschen Port oder Pfad verwendet.
    - Ein Proxy oder Tunnel hat Auth-Header entfernt oder eine Nicht-Gateway-Anfrage gesendet.

    Schnelle Lösungen:

    1. Verwenden Sie die WS-URL: `ws://<host>:18789` (oder `wss://...` bei HTTPS).
    2. Öffnen Sie den WS-Port nicht in einem normalen Browser-Tab.
    3. Wenn Auth aktiviert ist, geben Sie das Token/Passwort im `connect`-Frame mit.

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
    Dateilogs (strukturiert):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Sie können einen stabilen Pfad über `logging.file` setzen. Das Dateilog-Level wird durch `logging.level` gesteuert. Die Konsolen-Verbosity wird durch `--verbose` und `logging.consoleLevel` gesteuert.

    Schnellstes Log-Tailing:

    ```bash
    openclaw logs --follow
    ```

    Service-/Supervisor-Logs (wenn das Gateway über launchd/systemd läuft):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` und `gateway.err.log` (Standard: `~/.openclaw/logs/...`; Profile verwenden `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Siehe [Fehlersuche](/de/gateway/troubleshooting) für mehr.

  </Accordion>

  <Accordion title="Wie starte/stoppe/starte ich den Gateway-Service neu?">
    Verwenden Sie die Gateway-Helfer:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Wenn Sie das Gateway manuell ausführen, kann `openclaw gateway --force` den Port zurückerobern. Siehe [Gateway](/de/gateway).

  </Accordion>

  <Accordion title="Ich habe mein Terminal unter Windows geschlossen – wie starte ich OpenClaw neu?">
    Es gibt **zwei Windows-Installationsmodi**:

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

    Wenn Sie es manuell ausführen (kein Service), verwenden Sie:

    ```powershell
    openclaw gateway run
    ```

    Dokumentation: [Windows (WSL2)](/de/platforms/windows), [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="Das Gateway läuft, aber Antworten kommen nie an. Was sollte ich prüfen?">
    Beginnen Sie mit einer schnellen Zustandsprüfung:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Häufige Ursachen:

    - Modell-Auth wurde auf dem **Gateway-Host** nicht geladen (prüfen Sie `models status`).
    - Kanal-Kopplung/Allowlist blockiert Antworten (prüfen Sie Kanal-Konfiguration + Logs).
    - WebChat/Dashboard ist ohne das richtige Token geöffnet.

    Wenn Sie remote sind, bestätigen Sie, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass der
    Gateway-WebSocket erreichbar ist.

    Dokumentation: [Kanäle](/de/channels), [Fehlersuche](/de/gateway/troubleshooting), [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" – was nun?'>
    Das bedeutet normalerweise, dass die UI die WebSocket-Verbindung verloren hat. Prüfen Sie:

    1. Läuft das Gateway? `openclaw gateway status`
    2. Ist das Gateway gesund? `openclaw status`
    3. Hat die UI das richtige Token? `openclaw dashboard`
    4. Wenn remote: Ist die Tunnel-/Tailscale-Verbindung aktiv?

    Dann Logs mitverfolgen:

    ```bash
    openclaw logs --follow
    ```

    Dokumentation: [Dashboard](/web/dashboard), [Remote-Zugriff](/de/gateway/remote), [Fehlersuche](/de/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands schlägt fehl. Was sollte ich prüfen?">
    Beginnen Sie mit Logs und Kanalstatus:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Ordnen Sie dann den Fehler zu:

    - `BOT_COMMANDS_TOO_MUCH`: Das Telegram-Menü hat zu viele Einträge. OpenClaw kürzt bereits auf das Telegram-Limit und versucht es mit weniger Befehlen erneut, aber einige Menüeinträge müssen trotzdem entfernt werden. Reduzieren Sie Plugin-/Skill-/benutzerdefinierte Befehle oder deaktivieren Sie `channels.telegram.commands.native`, wenn Sie das Menü nicht benötigen.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` oder ähnliche Netzwerkfehler: Wenn Sie auf einem VPS oder hinter einem Proxy arbeiten, bestätigen Sie, dass ausgehendes HTTPS erlaubt ist und DNS für `api.telegram.org` funktioniert.

    Wenn das Gateway remote ist, stellen Sie sicher, dass Sie die Logs auf dem Gateway-Host prüfen.

    Dokumentation: [Telegram](/de/channels/telegram), [Kanal-Fehlersuche](/de/channels/troubleshooting).

  </Accordion>

  <Accordion title="Die TUI zeigt keine Ausgabe. Was sollte ich prüfen?">
    Bestätigen Sie zuerst, dass das Gateway erreichbar ist und der Agent laufen kann:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Verwenden Sie in der TUI `/status`, um den aktuellen Zustand zu sehen. Wenn Sie Antworten in einem Chat-
    Kanal erwarten, stellen Sie sicher, dass die Zustellung aktiviert ist (`/deliver on`).

    Dokumentation: [TUI](/web/tui), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie stoppe ich das Gateway vollständig und starte es dann wieder?">
    Wenn Sie den Service installiert haben:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Dadurch wird der **überwachte Service** gestoppt/gestartet (launchd unter macOS, systemd unter Linux).
    Verwenden Sie dies, wenn das Gateway als Daemon im Hintergrund läuft.

    Wenn Sie es im Vordergrund ausführen, stoppen Sie mit Strg-C und dann:

    ```bash
    openclaw gateway run
    ```

    Dokumentation: [Gateway-Service-Runbook](/de/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: startet den **Hintergrund-Service** neu (launchd/systemd).
    - `openclaw gateway`: führt das Gateway **im Vordergrund** für diese Terminal-Sitzung aus.

    Wenn Sie den Service installiert haben, verwenden Sie die Gateway-Befehle. Verwenden Sie `openclaw gateway`, wenn
    Sie einen einmaligen Lauf im Vordergrund möchten.

  </Accordion>

  <Accordion title="Schnellster Weg, mehr Details zu bekommen, wenn etwas fehlschlägt">
    Starten Sie das Gateway mit `--verbose`, um mehr Konsolendetails zu erhalten. Prüfen Sie dann die Logdatei auf Kanal-Auth, Modell-Routing und RPC-Fehler.
  </Accordion>
</AccordionGroup>

## Medien und Anhänge

<AccordionGroup>
  <Accordion title="Mein Skill hat ein Bild/PDF erzeugt, aber nichts wurde gesendet">
    Ausgehende Anhänge vom Agenten müssen eine `MEDIA:<path-or-url>`-Zeile enthalten (in einer eigenen Zeile). Siehe [OpenClaw-Assistant-Einrichtung](/de/start/openclaw) und [Agent send](/de/tools/agent-send).

    Senden per CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Hier bitte" --media /path/to/file.png
    ```

    Prüfen Sie außerdem:

    - Der Zielkanal unterstützt ausgehende Medien und wird nicht von Allowlists blockiert.
    - Die Datei liegt innerhalb der Größenlimits des Providers (Bilder werden auf maximal 2048 px skaliert).
    - `tools.fs.workspaceOnly=true` hält das Senden lokaler Pfade auf Workspace, temp/media-store und sandbox-validierte Dateien beschränkt.
    - `tools.fs.workspaceOnly=false` erlaubt `MEDIA:`, host-lokale Dateien zu senden, die der Agent bereits lesen kann, aber nur für Medien plus sichere Dokumenttypen (Bilder, Audio, Video, PDF und Office-Dokumente). Reiner Text und Secret-ähnliche Dateien bleiben weiterhin blockiert.

    Siehe [Bilder](/de/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicherheit und Zugriffskontrolle

<AccordionGroup>
  <Accordion title="Ist es sicher, OpenClaw für eingehende DMs freizugeben?">
    Behandeln Sie eingehende DMs als nicht vertrauenswürdige Eingabe. Die Standardwerte sind darauf ausgelegt, das Risiko zu verringern:

    - Standardverhalten auf DM-fähigen Kanälen ist **Pairing**:
      - Unbekannte Absender erhalten einen Pairing-Code; der Bot verarbeitet ihre Nachricht nicht.
      - Genehmigen mit: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Ausstehende Anfragen sind auf **3 pro Kanal** begrenzt; prüfen Sie `openclaw pairing list --channel <channel> [--account <id>]`, wenn kein Code angekommen ist.
    - Das öffentliche Öffnen von DMs erfordert explizites Opt-in (`dmPolicy: "open"` und Allowlist `"*"`).

    Führen Sie `openclaw doctor` aus, um riskante DM-Richtlinien sichtbar zu machen.

  </Accordion>

  <Accordion title="Ist Prompt Injection nur bei öffentlichen Bots ein Problem?">
    Nein. Prompt Injection betrifft **nicht vertrauenswürdige Inhalte**, nicht nur, wer dem Bot eine DM schicken kann.
    Wenn Ihr Assistent externe Inhalte liest (Websuche/Web-Fetch, Browser-Seiten, E-Mails,
    Dokumente, Anhänge, eingefügte Logs), können diese Inhalte Anweisungen enthalten, die
    versuchen, das Modell zu kapern. Das kann selbst dann passieren, wenn **Sie der einzige Absender** sind.

    Das größte Risiko besteht, wenn Tools aktiviert sind: Das Modell kann dazu verleitet werden,
    Kontext zu exfiltrieren oder Tools in Ihrem Namen aufzurufen. Verringern Sie den Blast Radius, indem Sie:

    - einen schreibgeschützten oder tool-deaktivierten „Reader“-Agenten verwenden, um nicht vertrauenswürdige Inhalte zusammenzufassen
    - `web_search` / `web_fetch` / `browser` für tool-fähige Agenten deaktiviert lassen
    - auch dekodierten Datei-/Dokumenttext als nicht vertrauenswürdig behandeln: OpenResponses-
      `input_file` und die Extraktion von Medienanhängen kapseln extrahierten Text beide in
      explizite Grenzmarker für externe Inhalte, statt rohen Dateitext durchzureichen
    - Sandboxing und strikte Tool-Allowlists einsetzen

    Details: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Sollte mein Bot seine eigene E-Mail, sein eigenes GitHub-Konto oder seine eigene Telefonnummer haben?">
    Ja, für die meisten Setups. Die Isolation des Bots mit separaten Konten und Telefonnummern
    verringert den Blast Radius, falls etwas schiefgeht. So lässt sich auch leichter
    mit Anmeldedaten rotieren oder Zugriff widerrufen, ohne Ihre persönlichen Konten zu beeinträchtigen.

    Fangen Sie klein an. Geben Sie nur Zugriff auf die Tools und Konten, die Sie tatsächlich benötigen, und erweitern Sie
    später bei Bedarf.

    Dokumentation: [Sicherheit](/de/gateway/security), [Pairing](/de/channels/pairing).

  </Accordion>

  <Accordion title="Kann ich ihm Autonomie über meine Textnachrichten geben und ist das sicher?">
    Wir empfehlen **keine** vollständige Autonomie über Ihre persönlichen Nachrichten. Das sicherste Muster ist:

    - Behalten Sie DMs im **Pairing-Modus** oder mit einer engen Allowlist.
    - Verwenden Sie eine **separate Nummer oder ein separates Konto**, wenn Sie möchten, dass er in Ihrem Namen Nachrichten verschickt.
    - Lassen Sie ihn Entwürfe erstellen und **genehmigen Sie sie vor dem Senden**.

    Wenn Sie experimentieren möchten, tun Sie es mit einem dedizierten Konto und halten Sie es isoliert. Siehe
    [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Kann ich günstigere Modelle für persönliche Assistentenaufgaben verwenden?">
    Ja, **wenn** der Agent nur chatbasiert ist und die Eingabe vertrauenswürdig ist. Kleinere Tiers sind
    anfälliger für Anweisungskapern, daher sollten Sie sie für tool-fähige Agenten
    oder beim Lesen nicht vertrauenswürdiger Inhalte vermeiden. Wenn Sie doch ein kleineres Modell verwenden müssen, sperren Sie
    Tools und arbeiten Sie innerhalb einer Sandbox. Siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Ich habe /start in Telegram ausgeführt, aber keinen Pairing-Code bekommen">
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

    Eingabeaufforderung der Telefonnummer im Assistenten: Sie wird verwendet, um Ihre **Allowlist/Ihren Owner** zu setzen, damit Ihre eigenen DMs erlaubt sind. Sie wird nicht für automatisches Senden verwendet. Wenn Sie unter Ihrer persönlichen WhatsApp-Nummer arbeiten, verwenden Sie diese Nummer und aktivieren Sie `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Chat-Befehle, Aufgaben abbrechen und „es hört nicht auf“

<AccordionGroup>
  <Accordion title="Wie verhindere ich, dass interne Systemnachrichten im Chat angezeigt werden?">
    Die meisten internen oder Tool-Nachrichten erscheinen nur, wenn **verbose**, **trace** oder **reasoning** für diese Sitzung aktiviert ist.

    Korrigieren Sie es in dem Chat, in dem Sie es sehen:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Wenn es weiterhin zu laut ist, prüfen Sie die Sitzungseinstellungen in der Control UI und setzen Sie verbose
    auf **inherit**. Bestätigen Sie außerdem, dass Sie kein Bot-Profil mit `verboseDefault` auf
    `on` in der Konfiguration verwenden.

    Dokumentation: [Thinking and verbose](/de/tools/thinking), [Sicherheit](/de/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Wie stoppe/breche ich eine laufende Aufgabe ab?">
    Senden Sie eine der folgenden Zeichenfolgen **als eigenständige Nachricht** (ohne Slash):

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

    Bei Hintergrundprozessen (vom exec-Tool) können Sie den Agenten bitten, Folgendes auszuführen:

    ```
    process action:kill sessionId:XXX
    ```

    Übersicht über Slash-Befehle: siehe [Slash-Befehle](/de/tools/slash-commands).

    Die meisten Befehle müssen als **eigenständige** Nachricht gesendet werden, die mit `/` beginnt, aber einige Kurzbefehle (wie `/status`) funktionieren für Absender auf der Allowlist auch inline.

  </Accordion>

  <Accordion title='Wie sende ich eine Discord-Nachricht von Telegram aus? ("Cross-context messaging denied")'>
    OpenClaw blockiert **providerübergreifendes** Messaging standardmäßig. Wenn ein Tool-Aufruf an
    Telegram gebunden ist, sendet er nicht an Discord, es sei denn, Sie erlauben es explizit.

    Aktivieren Sie providerübergreifendes Messaging für den Agenten:

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

  <Accordion title='Warum fühlt es sich so an, als würde der Bot schnelle Nachrichtenfolgen "ignorieren"?'>
    Der Queue-Modus steuert, wie neue Nachrichten mit einem laufenden Run interagieren. Verwenden Sie `/queue`, um Modi zu ändern:

    - `steer` - neue Nachrichten lenken die aktuelle Aufgabe um
    - `followup` - Nachrichten einzeln nacheinander ausführen
    - `collect` - Nachrichten bündeln und einmal antworten (Standard)
    - `steer-backlog` - jetzt umlenken, dann Backlog abarbeiten
    - `interrupt` - aktuellen Run abbrechen und frisch starten

    Sie können Optionen wie `debounce:2s cap:25 drop:summarize` für Followup-Modi hinzufügen.

  </Accordion>
</AccordionGroup>

## Sonstiges

<AccordionGroup>
  <Accordion title='Was ist das Standardmodell für Anthropic mit einem API key?'>
    In OpenClaw sind Anmeldedaten und Modellauswahl getrennt. Das Setzen von `ANTHROPIC_API_KEY` (oder das Speichern eines Anthropic API key in Auth-Profilen) aktiviert die Authentifizierung, aber das tatsächliche Standardmodell ist das, was Sie in `agents.defaults.model.primary` konfigurieren (zum Beispiel `anthropic/claude-sonnet-4-6` oder `anthropic/claude-opus-4-6`). Wenn Sie `No credentials found for profile "anthropic:default"` sehen, bedeutet das, dass das Gateway keine Anthropic-Anmeldedaten in der erwarteten `auth-profiles.json` für den gerade laufenden Agenten finden konnte.
  </Accordion>
</AccordionGroup>

---

Immer noch fest? Fragen Sie in [Discord](https://discord.com/invite/clawd) oder eröffnen Sie eine [GitHub-Diskussion](https://github.com/openclaw/openclaw/discussions).
