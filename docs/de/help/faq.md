---
read_when:
    - Beantworten häufiger Fragen zu Einrichtung, Installation, Onboarding oder Laufzeit-Support
    - Triage von gemeldeten Benutzerproblemen vor tiefergehendem Debugging
summary: Häufig gestellte Fragen zu Einrichtung, Konfiguration und Nutzung von OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-06T03:13:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d6d09621c6033d580cbcf1ff46f81587d69404d6f64c8d8fd8c3f09185bb920
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Kurze Antworten plus tiefergehende Fehlerbehebung für Setups aus der Praxis (lokale Entwicklung, VPS, Multi-Agent, OAuth/API-Schlüssel, Modell-Failover). Für Laufzeitdiagnosen siehe [Fehlerbehebung](/de/gateway/troubleshooting). Für die vollständige Konfigurationsreferenz siehe [Konfiguration](/de/gateway/configuration).

## Die ersten 60 Sekunden, wenn etwas kaputt ist

1. **Schnellstatus (erste Prüfung)**

   ```bash
   openclaw status
   ```

   Schnelle lokale Zusammenfassung: Betriebssystem + Update, Erreichbarkeit von Gateway/Service, Agents/Sitzungen, Provider-Konfiguration + Laufzeitprobleme (wenn das Gateway erreichbar ist).

2. **Teilbarer Bericht (sicher zu teilen)**

   ```bash
   openclaw status --all
   ```

   Schreibgeschützte Diagnose mit Log-Auszug (Tokens geschwärzt).

3. **Daemon- + Port-Status**

   ```bash
   openclaw gateway status
   ```

   Zeigt die Supervisor-Laufzeitumgebung im Vergleich zur RPC-Erreichbarkeit, die URL des Probe-Ziels und welche Konfiguration der Service wahrscheinlich verwendet hat.

4. **Tiefgehende Probes**

   ```bash
   openclaw status --deep
   ```

   Führt eine Live-Gateway-Health-Probe aus, einschließlich Kanal-Probes, wenn unterstützt
   (erfordert ein erreichbares Gateway). Siehe [Health](/de/gateway/health).

5. **Das neueste Log verfolgen**

   ```bash
   openclaw logs --follow
   ```

   Wenn RPC nicht verfügbar ist, verwenden Sie stattdessen:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dateilogs sind von Service-Logs getrennt; siehe [Logging](/de/logging) und [Fehlerbehebung](/de/gateway/troubleshooting).

6. **Doctor ausführen (Reparaturen)**

   ```bash
   openclaw doctor
   ```

   Repariert/migriert Konfiguration/Zustand + führt Health-Checks aus. Siehe [Doctor](/de/gateway/doctor).

7. **Gateway-Snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # zeigt die Ziel-URL + den Konfigurationspfad bei Fehlern
   ```

   Fragt das laufende Gateway nach einem vollständigen Snapshot (nur WS). Siehe [Health](/de/gateway/health).

## Schnellstart und Einrichtung beim ersten Start

<AccordionGroup>
  <Accordion title="Ich stecke fest, was ist der schnellste Weg, wieder weiterzukommen?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihre Maschine sehen** kann. Das ist viel effektiver als
    in Discord zu fragen, weil die meisten Fälle von „Ich stecke fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind,
    die entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, Ihr Setup auf Maschinenebene
    zu reparieren (PATH, Services, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout**
    über die hackbare (git)-Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent den Code + die Doku lesen und
    über die exakte von Ihnen verwendete Version nachdenken kann. Sie können später jederzeit wieder zu stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Reparatur zu **planen und zu überwachen** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Bug oder Fix entdecken, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Snapshot der Gateway-/Agent-Gesundheit + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Probleme mit Konfiguration/Zustand.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#die-ersten-60-sekunden-wenn-etwas-kaputt-ist).
    Installationsdoku: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Überspring-Gründe?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Fensters aktiver Stunden
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres/überschriftenbasiertes Gerüst
    - `no-tasks-due`: der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber keines der Aufgabenintervalle ist bereits fällig
    - `alerts-disabled`: alle Heartbeat-Sichtbarkeiten sind deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach einer echten Heartbeat-Ausführung
    weitergeschoben. Übersprungene Ausführungen markieren Aufgaben nicht als abgeschlossen.

    Doku: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Art, OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Quellcode auszuführen und das Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann auch UI-Assets automatisch bauen. Nach dem Onboarding führen Sie das Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installiert UI-Abhängigkeiten beim ersten Lauf automatisch
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie es mit `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab offen; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf derselben Maschine in den Browser.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (dieselbe Maschine):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Auth gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bindung auf loopback belassen, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist, erfüllen Identitäts-Header die Authentifizierung von Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, es sei denn, Sie verwenden absichtlich `none` für privaten Ingress oder vertrauenswürdige Proxy-HTTP-Authentifizierung.
      Schlechte gleichzeitige Serve-Auth-Versuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst; daher kann bereits der zweite fehlerhafte Wiederholungsversuch `retry later` anzeigen.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwort-Auth), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in die Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Lassen Sie das Gateway hinter einem vertrauenswürdigen Non-Loopback-Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` und dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Auth gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/web/dashboard) und [Web-Oberflächen](/web) für Details zu Bindungsmodi und Auth.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern verschiedene Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Genehmigungs-Client für Exec-Genehmigungen fungieren

    Die Host-Exec-Richtlinie ist weiterhin das tatsächliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wo Genehmigungsaufforderungen
    erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beide:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte einen manuellen Befehl `/approve` nur dann einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen zurück in den Ursprungsraum/das Thema gepostet werden.
    - Plugin-Genehmigungen sind wiederum getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding und nur einige native Kanäle behalten zusätzlich native Behandlung von Plugin-Genehmigungen bei.

    Kurzfassung: Forwarding ist für Routing, die native Client-Konfiguration für eine reichhaltigere kanalspezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig - in der Doku werden **512 MB-1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für den persönlichen Gebrauch genannt, und es wird erwähnt, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie etwas mehr Spielraum möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Raspberry-Pi-Installationen?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git)-Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitätsproblem**.

    Doku: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was jetzt?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet beim
    ersten Schlüpfen auch automatisch „Wake up, my friend!“. Wenn Sie diese Zeile mit **keiner Antwort**
    sehen und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starten Sie das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status + Auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es immer noch hängt, führen Sie aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass der Tunnel/die Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf eine neue Maschine (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Workspace**, und führen Sie dann Doctor einmal aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Auth und Kanalstatus), solange Sie **beide**
    Orte kopieren:

    1. Installieren Sie OpenClaw auf der neuen Maschine.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) von der alten Maschine.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Service neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Credentials, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus sind, besitzt der Gateway-Host den Sitzungsspeicher und den Workspace.

    **Wichtig:** Wenn Sie nur Ihren Workspace nach GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder Auth. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migration](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#wo-dinge-auf-der-festplatte-liegen),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Doku-/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kann nicht auf docs.openclaw.ai zugreifen (SSL-Fehler)">
    Einige Comcast/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns beim Entsperren, indem Sie dies hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Seite weiterhin nicht erreichen, wird die Doku auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm-dist-tags**, keine getrennten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine stable-Veröffentlichung zuerst auf **beta**, dann verschiebt ein expliziter
    Promotion-Schritt dieselbe Version auf `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach einer Promotion auf **dieselbe Version** zeigen.

    Was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen beta und dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Stand von `main` (git); wenn veröffentlicht, verwendet er das npm-dist-tag `dev`.

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

  <Accordion title="Wie probiere ich die neuesten Bits aus?">
    Zwei Optionen:

    1. **Dev-Kanal (git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechseln Sie zum Branch `main` und aktualisieren aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und dann per git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone erstellen möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Doku: [Update](/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installation](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, je nachdem wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt?](#schnellstart-und-einrichtung-beim-ersten-start)
    und die schnelle Debug-Schleife unter [Ich stecke fest](#schnellstart-und-einrichtung-beim-ersten-start).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Feedback?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare (git)-Installation:

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

  <Accordion title="Windows-Installation sagt git not found oder openclaw not recognized">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie den Installer dann noch einmal aus.

    **2) openclaw is not recognized nach der Installation**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach dem Aktualisieren des PATH erneut.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Doku: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-Exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Das ist in der Regel ein Mismatch der Console-Codepage in nativen Windows-Shells.

    Symptome:

    - `system.run`/`exec`-Ausgabe rendert Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminal-Profil korrekt aus

    Schneller Workaround in PowerShell:

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

    Wenn Sie dies auf dem neuesten OpenClaw weiterhin reproduzieren, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Doku hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git)-Installation**, damit Sie Quellcode und Doku vollständig lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installation](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurze Antwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Aktualisierungen](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie es auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Cloud-/VPS-Installationsanleitungen?">
    Wir haben einen **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Quelle der Wahrheit und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurz gesagt: **möglich, nicht empfohlen**. Der Aktualisierungsablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung verloren geht), benötigt eventuell ein sauberes git-Checkout und
    kann eine Bestätigung verlangen. Sicherer: Aktualisierungen als Operator aus einer Shell heraus ausführen.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie es unbedingt von einem Agenten automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Doku: [Update](/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, älteres Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Ort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bindung/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-User-Unit unter Linux/WSL2)
    - **Health-Checks** und **Skills**-Auswahl

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **nur lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude-Abonnement-Auth in OpenClaw**: Anthropic teilte OpenClaw-Benutzern am
      **4. April 2026 um 12:00 PM PT / 8:00 PM BST** mit, dass dies
      **Extra Usage** erfordert, separat vom Abonnement abgerechnet

    Unsere lokalen Reproduktionen zeigen außerdem, dass `claude -p --append-system-prompt ...`
    auf denselben Extra-Usage-Schutz stoßen kann, wenn der angehängte Prompt
    OpenClaw identifiziert, während dieselbe Prompt-Zeichenkette diesen Block
    auf dem Pfad über Anthropic SDK + API-Schlüssel **nicht** reproduziert. OpenAI-Codex-OAuth wird ausdrücklich
    für externe Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete Optionen im Abonnementstil, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Doku: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM-Modelle](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja, aber behandeln Sie es als **Claude-Abonnement-Auth mit Extra Usage**.

    Claude-Pro/Max-Abonnements enthalten keinen API-Schlüssel. In OpenClaw bedeutet das,
    dass Anthropic's OpenClaw-spezifischer Abrechnungshinweis gilt: Verkehr über das Abonnement erfordert
    **Extra Usage**. Wenn Sie Anthropic-Verkehr ohne diesen Extra-Usage-Pfad wollen, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja, aber die unterstützte Interpretation ist jetzt:

    - Anthropic in OpenClaw mit einem Abonnement bedeutet **Extra Usage**
    - Anthropic in OpenClaw ohne diesen Pfad bedeutet **API-Schlüssel**

    Das Anthropic-Setup-Token ist weiterhin als älterer/manueller OpenClaw-Pfad verfügbar,
    und Anthropic's OpenClaw-spezifischer Abrechnungshinweis gilt dort weiterhin. Wir
    haben denselben Abrechnungs-Schutz lokal auch bei direkter Verwendung von
    `claude -p --append-system-prompt ...` reproduziert, wenn der angehängte Prompt
    OpenClaw identifiziert, während dieselbe Prompt-Zeichenkette den Fehler auf
    dem Pfad über Anthropic SDK + API-Schlüssel **nicht** reproduziert hat.

    Für Produktions- oder Multi-User-Workloads ist Auth mit Anthropic-API-Schlüssel die
    sicherere, empfohlene Wahl. Wenn Sie andere gehostete Optionen im Abonnementstil
    in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und
    [GLM-Modelle](/de/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
Das bedeutet, dass Ihr **Anthropic-Kontingent/Rate-Limit** für das aktuelle Fenster erschöpft ist. Wenn Sie
**Claude CLI** verwenden, warten Sie, bis das Fenster zurückgesetzt wird, oder aktualisieren Sie Ihren Tarif. Wenn Sie
einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
auf Nutzung/Abrechnung und erhöhen Sie Limits bei Bedarf.

    Wenn die Meldung speziell lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage
    Anthropic's 1M-Context-Beta zu verwenden (`context1m: true`). Das funktioniert nur, wenn Ihre
    Credentials für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Setzen Sie ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Modelle](/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten Provider **Amazon Bedrock (Converse)**. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Bedrock-Katalog für Streaming/Text automatisch erkennen und ihn als impliziten Provider `amazon-bedrock` zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Providereintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie lieber einen verwalteten Schlüsselablauf möchten, bleibt ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Auth?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Das Onboarding kann den OAuth-Ablauf ausführen und setzt bei Bedarf das Standardmodell auf `openai-codex/gpt-5.4`. Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Auth (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Subscription OAuth** vollständig.
    OpenAI erlaubt die Verwendung von Subscription OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Ablauf**, nicht eine Client-ID oder ein Secret in `openclaw.json`.

    Verwenden Sie stattdessen den Gemini-API-Provider:

    1. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    2. Führen Sie `openclaw onboard --auth-choice gemini-api-key` aus
    3. Setzen Sie ein Google-Modell wie `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Meistens nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen und leaken. Wenn Sie unbedingt müssen, führen Sie lokal den **größten** Modell-Build aus, den Sie verwenden können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich gehosteten Modellverkehr in einer bestimmten Region?">
    Wählen Sie regionengebundene Endpunkte. OpenRouter stellt US-gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin neben diesen auflisten, indem Sie `models.mode: "merge"` verwenden, damit Fallbacks verfügbar bleiben und gleichzeitig der regionengebundene Provider respektiert wird, den Sie auswählen.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche Leute
    kaufen einen als Always-on-Host, aber ein kleiner VPS, Heimserver oder eine Raspberry-Pi-Klasse-Box funktioniert ebenfalls.

    Sie benötigen einen Mac nur für **macOS-only-Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) - der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann unter Linux oder anderswo laufen. Wenn Sie andere macOS-only-Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Doku: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das in Messages angemeldet ist. Das muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage - der BlueBubbles-Server läuft unter macOS, während das Gateway unter Linux oder anderswo laufen kann.

    Häufige Setups:

    - Führen Sie das Gateway unter Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der in Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Setup mit nur einer Maschine möchten.

    Doku: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es zu sehen.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie das auf einem Nicht-Produktiv-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was kommt in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Onboarding akzeptiert die Eingabe `@username` und löst sie in eine numerische ID auf, aber die OpenClaw-Autorisierung verwendet nur numerische IDs.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen nutzen?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "Fast-Chat"-Agenten und einen "Opus-für-Coding"-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder spezifische Peers) an jeden Agenten. Beispielkonfigurationen finden Sie unter [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der PATH des Services `/home/linuxbrew/.linuxbrew/bin` (oder Ihren Brew-Präfix) enthält, damit mit `brew` installierte Tools in Non-Login-Shells aufgelöst werden.
    Neuere Builds stellen auf Linux-Systemd-Services außerdem gängige Benutzer-Bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren git-Installation und npm install">
    - **Hackbare (git)-Installation:** vollständiger Source-Checkout, bearbeitbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Doku patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen von npm-dist-tags.

    Doku: [Erste Schritte](/de/start/getting-started), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Service auf den neuen Einstiegspunkt zeigt.
    Dadurch werden **Ihre Daten nicht gelöscht** - es ändert nur die OpenClaw-Code-Installation. Ihr Zustand
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

    Doctor erkennt einen Mismatch des Gateway-Service-Einstiegspunkts und bietet an, die Service-Konfiguration an die aktuelle Installation anzupassen (verwenden Sie `--repair` in der Automatisierung).

    Backup-Tipps: siehe [Backup-Strategie](#wo-dinge-auf-der-festplatte-liegen).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurz gesagt: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung wollen und mit Sleep/Neustarts okay sind, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Sleep/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Laptop-Sleep-Probleme, leichter am Laufen zu halten.
    - **Nachteile:** oft headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Sie müssen für Updates per SSH arbeiten.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren auf einem VPS alle problemlos. Der einzige echte Trade-off ist **headless Browser** vs. sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie bereits Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser wollen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Sleep/Neustarts, sauberere Berechtigungen, leichter am Laufen zu halten.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig okay zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn die Maschine schläft oder aktualisiert wird.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie das Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitshinweise lesen Sie [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr für Spielraum (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Doku: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gibt es?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss always-on, erreichbar und mit genügend
    RAM für das Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Media-Tools verwenden.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows sind, ist **WSL2 das einfachste VM-artige Setup** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Was ist OpenClaw?

<AccordionGroup>
  <Accordion title="Was ist OpenClaw in einem Absatz?">
    OpenClaw ist ein persönlicher KI-Assistent, den Sie auf Ihren eigenen Geräten ausführen. Er antwortet auf den Messaging-Oberflächen, die Sie bereits verwenden (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat und gebündelte Kanal-Plugins wie QQ Bot) und kann auf unterstützten Plattformen auch Sprache + ein Live-Canvas. Das **Gateway** ist die always-on-Kontrollebene; der Assistent ist das Produkt.
  </Accordion>

  <Accordion title="Wertversprechen">
    OpenClaw ist nicht „nur ein Claude-Wrapper“. Es ist eine **Local-first-Kontrollebene**, mit der Sie einen
    leistungsfähigen Assistenten auf **Ihrer eigenen Hardware** ausführen können, erreichbar aus den Chat-Apps, die Sie bereits verwenden, mit
    zustandsbehafteten Sitzungen, Memory und Tools - ohne die Kontrolle über Ihre Workflows an ein gehostetes
    SaaS abzugeben.

    Highlights:

    - **Ihre Geräte, Ihre Daten:** Führen Sie das Gateway dort aus, wo Sie möchten (Mac, Linux, VPS), und behalten Sie
      Workspace + Sitzungsverlauf lokal.
    - **Echte Kanäle, keine Web-Sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus mobile Sprache und Canvas auf unterstützten Plattformen.
    - **Modellagnostisch:** Verwenden Sie Anthropic, OpenAI, MiniMax, OpenRouter usw. mit Routing
      und Failover pro Agent.
    - **Nur lokale Option:** Führen Sie lokale Modelle aus, sodass **alle Daten auf Ihrem Gerät bleiben können**, wenn Sie das möchten.
    - **Multi-Agent-Routing:** getrennte Agents pro Kanal, Konto oder Aufgabe, jeweils mit eigenem
      Workspace und Standards.
    - **Open Source und hackbar:** Prüfen, erweitern und selbst hosten ohne Vendor Lock-in.

    Doku: [Gateway](/de/gateway), [Kanäle](/de/channels), [Multi-Agent](/de/concepts/multi-agent),
    [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Ich habe es gerade eingerichtet - was sollte ich zuerst tun?">
    Gute erste Projekte:

    - Eine Website bauen (WordPress, Shopify oder eine einfache statische Website).
    - Eine mobile App prototypen (Gliederung, Screens, API-Plan).
    - Dateien und Ordner organisieren (Bereinigung, Benennung, Tagging).
    - Gmail verbinden und Zusammenfassungen oder Follow-ups automatisieren.

    Es kann große Aufgaben bewältigen, funktioniert aber am besten, wenn Sie sie in Phasen aufteilen und
    Subagents für parallele Arbeit verwenden.

  </Accordion>

  <Accordion title="Was sind die fünf wichtigsten Alltagsanwendungsfälle für OpenClaw?">
    Alltägliche Erfolge sehen meist so aus:

    - **Persönliche Briefings:** Zusammenfassungen von Posteingang, Kalender und Nachrichten, die Ihnen wichtig sind.
    - **Recherche und Entwürfe:** schnelle Recherche, Zusammenfassungen und erste Entwürfe für E-Mails oder Dokumente.
    - **Erinnerungen und Follow-ups:** durch Cron oder Heartbeat gesteuerte Stupser und Checklisten.
    - **Browser-Automatisierung:** Formulare ausfüllen, Daten sammeln und wiederholte Web-Aufgaben.
    - **Geräteübergreifende Koordination:** Senden Sie eine Aufgabe von Ihrem Telefon, lassen Sie das Gateway sie auf einem Server ausführen und erhalten Sie das Ergebnis zurück im Chat.

  </Accordion>

  <Accordion title="Kann OpenClaw bei Lead-Gen, Outreach, Anzeigen und Blogs für ein SaaS helfen?">
    Ja für **Recherche, Qualifizierung und Entwürfe**. Es kann Websites scannen, Shortlists erstellen,
    Interessenten zusammenfassen und Entwürfe für Outreach oder Anzeigentexte schreiben.

    Bei **Outreach oder Anzeigenkampagnen** sollte ein Mensch eingebunden bleiben. Vermeiden Sie Spam, beachten Sie lokale Gesetze und
    Plattformrichtlinien und prüfen Sie alles, bevor es gesendet wird. Das sicherste Muster ist,
    OpenClaw Entwürfe erstellen zu lassen und diese dann von Ihnen genehmigen zu lassen.

    Doku: [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Vorteile gegenüber Claude Code für Webentwicklung?">
    OpenClaw ist ein **persönlicher Assistent** und eine Koordinationsebene, kein IDE-Ersatz. Verwenden Sie
    Claude Code oder Codex für die schnellste direkte Coding-Schleife in einem Repo. Verwenden Sie OpenClaw, wenn Sie
    dauerhaftes Memory, geräteübergreifenden Zugriff und Tool-Orchestrierung möchten.

    Vorteile:

    - **Persistentes Memory + Workspace** über Sitzungen hinweg
    - **Multi-Plattform-Zugriff** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool-Orchestrierung** (Browser, Dateien, Planung, Hooks)
    - **Always-on-Gateway** (auf einem VPS ausführen, von überall interagieren)
    - **Nodes** für lokalen Browser/Bildschirm/Kamera/Exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills und Automatisierung

<AccordionGroup>
  <Accordion title="Wie passe ich Skills an, ohne das Repo schmutzig zu halten?">
    Verwenden Sie verwaltete Overrides, statt die Repo-Kopie zu bearbeiten. Legen Sie Ihre Änderungen in `~/.openclaw/skills/<name>/SKILL.md` ab (oder fügen Sie einen Ordner über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu). Die Priorität ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`, sodass verwaltete Overrides weiterhin gegenüber gebündelten Skills gewinnen, ohne git zu verändern. Wenn Sie den Skill global installiert haben möchten, ihn aber nur für einige Agents sichtbar machen wollen, behalten Sie die gemeinsame Kopie in `~/.openclaw/skills` und steuern Sie die Sichtbarkeit über `agents.defaults.skills` und `agents.list[].skills`. Nur Änderungen, die upstream-würdig sind, sollten im Repo leben und als PRs hinausgehen.
  </Accordion>

  <Accordion title="Kann ich Skills aus einem benutzerdefinierten Ordner laden?">
    Ja. Fügen Sie zusätzliche Verzeichnisse über `skills.load.extraDirs` in `~/.openclaw/openclaw.json` hinzu (niedrigste Priorität). Die Standardreihenfolge ist `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelt → `skills.load.extraDirs`. `clawhub` installiert standardmäßig nach `./skills`, was OpenClaw in der nächsten Sitzung als `<workspace>/skills` behandelt. Wenn der Skill nur für bestimmte Agents sichtbar sein soll, kombinieren Sie das mit `agents.defaults.skills` oder `agents.list[].skills`.
  </Accordion>

  <Accordion title="Wie kann ich verschiedene Modelle für verschiedene Aufgaben verwenden?">
    Heute sind folgende Muster unterstützt:

    - **Cronjobs**: isolierte Jobs können pro Job ein `model`-Override setzen.
    - **Sub-Agents**: leiten Sie Aufgaben an separate Agents mit unterschiedlichen Standardmodellen weiter.
    - **On-demand-Umschaltung**: Verwenden Sie `/model`, um das Modell der aktuellen Sitzung jederzeit zu wechseln.

    Siehe [Cronjobs](/de/automation/cron-jobs), [Multi-Agent-Routing](/de/concepts/multi-agent) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Der Bot friert bei schwerer Arbeit ein. Wie lagere ich das aus?">
    Verwenden Sie **Sub-Agents** für lange oder parallele Aufgaben. Sub-Agents laufen in ihrer eigenen Sitzung,
    geben eine Zusammenfassung zurück und halten Ihren Haupt-Chat reaktionsfähig.

    Bitten Sie Ihren Bot, „für diese Aufgabe einen Sub-Agent zu starten“, oder verwenden Sie `/subagents`.
    Verwenden Sie `/status` im Chat, um zu sehen, was das Gateway gerade macht (und ob es beschäftigt ist).

    Token-Tipp: Lange Aufgaben und Sub-Agents verbrauchen beide Tokens. Wenn Kosten ein Thema sind, setzen Sie ein
    günstigeres Modell für Sub-Agents über `agents.defaults.subagents.model`.

    Doku: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Wie funktionieren threadgebundene Subagent-Sitzungen auf Discord?">
    Verwenden Sie Thread-Bindungen. Sie können einen Discord-Thread an ein Subagent- oder Sitzungsziel binden, damit Folge-Nachrichten in diesem Thread auf dieser gebundenen Sitzung bleiben.

    Grundlegender Ablauf:

    - Starten Sie mit `sessions_spawn` unter Verwendung von `thread: true` (und optional `mode: "session"` für persistente Folgeaktionen).
    - Oder binden Sie manuell mit `/focus <target>`.
    - Verwenden Sie `/agents`, um den Bindungsstatus zu prüfen.
    - Verwenden Sie `/session idle <duration|off>` und `/session max-age <duration|off>`, um das automatische Entfokussieren zu steuern.
    - Verwenden Sie `/unfocus`, um den Thread zu lösen.

    Erforderliche Konfiguration:

    - Globale Standards: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord-Overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Automatische Bindung beim Start: Setzen Sie `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Doku: [Sub-Agents](/de/tools/subagents), [Discord](/de/channels/discord), [Konfigurationsreferenz](/de/gateway/configuration-reference), [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Ein Subagent ist fertig, aber das Abschluss-Update ging an die falsche Stelle oder wurde nie gepostet. Was sollte ich prüfen?">
    Prüfen Sie zuerst die aufgelöste Anforderer-Route:

    - Die Zustellung im Completion-Modus für Subagents bevorzugt jede gebundene Thread- oder Konversationsroute, wenn eine existiert.
    - Wenn der Completion-Ursprung nur einen Kanal enthält, fällt OpenClaw auf die gespeicherte Route der Anforderer-Sitzung zurück (`lastChannel` / `lastTo` / `lastAccountId`), damit die direkte Zustellung trotzdem erfolgreich sein kann.
    - Wenn weder eine gebundene Route noch eine verwendbare gespeicherte Route existiert, kann die direkte Zustellung fehlschlagen und das Ergebnis fällt stattdessen auf sitzungsgebundene Warteschlangenzustellung zurück, statt sofort im Chat gepostet zu werden.
    - Ungültige oder veraltete Ziele können weiterhin einen Warteschlangen-Fallback oder endgültigen Zustellungsfehler erzwingen.
    - Wenn die letzte sichtbare Assistant-Antwort des Kindes exakt das stille Token `NO_REPLY` / `no_reply` oder exakt `ANNOUNCE_SKIP` ist, unterdrückt OpenClaw die Ankündigung absichtlich, statt veralteten früheren Fortschritt zu posten.
    - Wenn das Kind nach nur Tool-Aufrufen in ein Timeout lief, kann die Ankündigung dies in eine kurze Zusammenfassung des Teilfortschritts zusammenfassen, statt rohe Tool-Ausgabe wiederzugeben.

    Debuggen:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Sub-Agents](/de/tools/subagents), [Hintergrundaufgaben](/de/automation/tasks), [Sitzungstools](/de/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron oder Erinnerungen lösen nicht aus. Was sollte ich prüfen?">
    Cron läuft innerhalb des Gateway-Prozesses. Wenn das Gateway nicht kontinuierlich läuft,
    werden geplante Jobs nicht ausgeführt.

    Checkliste:

    - Bestätigen Sie, dass Cron aktiviert ist (`cron.enabled`) und `OPENCLAW_SKIP_CRON` nicht gesetzt ist.
    - Prüfen Sie, dass das Gateway 24/7 läuft (kein Sleep/keine Neustarts).
    - Verifizieren Sie die Zeitzoneneinstellungen für den Job (`--tz` im Vergleich zur Host-Zeitzone).

    Debuggen:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Doku: [Cronjobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Cron wurde ausgelöst, aber nichts wurde an den Kanal gesendet. Warum?">
    Prüfen Sie zuerst den Zustellmodus:

    - `--no-deliver` / `delivery.mode: "none"` bedeutet, dass keine externe Nachricht erwartet wird.
    - Fehlendes oder ungültiges Ankündigungsziel (`channel` / `to`) bedeutet, dass der Runner die ausgehende Zustellung übersprungen hat.
    - Kanal-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass der Runner die Zustellung versucht hat, aber Credentials sie blockiert haben.
    - Ein stilles isoliertes Ergebnis (`NO_REPLY` / `no_reply` allein) wird als absichtlich nicht zustellbar behandelt, daher unterdrückt der Runner auch die Zustellung per Warteschlangen-Fallback.

    Bei isolierten Cronjobs besitzt der Runner die finale Zustellung. Vom Agenten wird erwartet,
    eine Klartext-Zusammenfassung zurückzugeben, die der Runner dann sendet. `--no-deliver` hält
    dieses Ergebnis intern; es erlaubt dem Agenten nicht stattdessen, direkt mit dem
    Message-Tool zu senden.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Cronjobs](/de/automation/cron-jobs), [Hintergrundaufgaben](/de/automation/tasks).

  </Accordion>

  <Accordion title="Warum hat eine isolierte Cron-Ausführung Modelle gewechselt oder einmal neu versucht?">
    Das ist normalerweise der Live-Modellwechsel-Pfad, nicht doppelte Planung.

    Isoliertes Cron kann eine Modellübergabe zur Laufzeit persistieren und neu versuchen, wenn die aktive
    Ausführung `LiveSessionModelSwitchError` auslöst. Der Wiederholungsversuch behält den gewechselten
    Provider/das Modell bei, und falls der Wechsel ein neues Auth-Profil-Override mit sich brachte, persistiert Cron
    dieses ebenfalls vor dem Wiederholungsversuch.

    Verwandte Auswahlregeln:

    - Das Gmail-Hook-Modell-Override gewinnt zuerst, wenn anwendbar.
    - Dann pro Job `model`.
    - Dann jedes gespeicherte Modell-Override der Cron-Sitzung.
    - Dann die normale Auswahl von Agent/Standardmodell.

    Die Wiederholungsschleife ist begrenzt. Nach dem ersten Versuch plus 2 Switch-Wiederholungen
    bricht Cron ab, statt endlos zu schleifen.

    Debuggen:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Doku: [Cronjobs](/de/automation/cron-jobs), [Cron CLI](/cli/cron).

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

    Native `openclaw skills install` schreibt in das `skills/`-Verzeichnis des aktiven Workspace.
    Installieren Sie die separate `clawhub`-CLI nur, wenn Sie Ihre eigenen Skills veröffentlichen oder
    synchronisieren möchten. Für gemeinsame Installationen über Agents hinweg legen Sie den Skill unter
    `~/.openclaw/skills` ab und verwenden `agents.defaults.skills` oder
    `agents.list[].skills`, wenn Sie einschränken möchten, welche Agents ihn sehen können.

  </Accordion>

  <Accordion title="Kann OpenClaw Aufgaben nach Zeitplan oder kontinuierlich im Hintergrund ausführen?">
    Ja. Verwenden Sie den Gateway-Scheduler:

    - **Cronjobs** für geplante oder wiederkehrende Aufgaben (persistieren über Neustarts hinweg).
    - **Heartbeat** für periodische Prüfungen in der „Hauptsitzung“.
    - **Isolierte Jobs** für autonome Agents, die Zusammenfassungen posten oder an Chats zustellen.

    Doku: [Cronjobs](/de/automation/cron-jobs), [Automatisierung & Aufgaben](/de/automation),
    [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title="Kann ich Apple-macOS-only-Skills unter Linux ausführen?">
    Nicht direkt. macOS-Skills werden durch `metadata.openclaw.os` plus erforderliche Binärdateien gesteuert, und Skills erscheinen nur dann im System Prompt, wenn sie auf dem **Gateway-Host** geeignet sind. Unter Linux werden `darwin`-only-Skills (wie `apple-notes`, `apple-reminders`, `things-mac`) nicht geladen, es sei denn, Sie überschreiben das Gating.

    Es gibt drei unterstützte Muster:

    **Option A - Gateway auf einem Mac ausführen (am einfachsten).**
    Führen Sie das Gateway dort aus, wo die macOS-Binärdateien existieren, und verbinden Sie sich dann von Linux im [Remote-Modus](#gateway-ports-bereits-belegt-und-remote-modus) oder über Tailscale. Die Skills laden normal, weil der Gateway-Host macOS ist.

    **Option B - einen macOS-Node verwenden (ohne SSH).**
    Führen Sie das Gateway unter Linux aus, koppeln Sie einen macOS-Node (Menüleisten-App) und setzen Sie **Node Run Commands** auf dem Mac auf „Always Ask“ oder „Always Allow“. OpenClaw kann macOS-only-Skills als geeignet behandeln, wenn die erforderlichen Binärdateien auf dem Node vorhanden sind. Der Agent führt diese Skills über das Tool `nodes` aus. Wenn Sie „Always Ask“ wählen, fügt die Genehmigung „Always Allow“ in der Aufforderung diesen Befehl zur Allowlist hinzu.

    **Option C - macOS-Binärdateien über SSH proxien (fortgeschritten).**
    Lassen Sie das Gateway unter Linux laufen, aber sorgen Sie dafür, dass die erforderlichen CLI-Binärdateien in SSH-Wrapper aufgelöst werden, die auf einem Mac ausgeführt werden. Überschreiben Sie dann den Skill so, dass Linux erlaubt ist, damit er weiterhin geeignet bleibt.

    1. Erstellen Sie einen SSH-Wrapper für die Binärdatei (Beispiel: `memo` für Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Legen Sie den Wrapper im PATH auf dem Linux-Host ab (zum Beispiel `~/bin/memo`).
    3. Überschreiben Sie die Skill-Metadaten (Workspace oder `~/.openclaw/skills`), um Linux zu erlauben:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Starten Sie eine neue Sitzung, damit der Skills-Snapshot aktualisiert wird.

  </Accordion>

  <Accordion title="Habt ihr eine Notion- oder HeyGen-Integration?">
    Heute nicht eingebaut.

    Optionen:

    - **Benutzerdefinierter Skill / Plugin:** am besten für zuverlässigen API-Zugriff (Notion/HeyGen haben beide APIs).
    - **Browser-Automatisierung:** funktioniert ohne Code, ist aber langsamer und fragiler.

    Wenn Sie Kontext pro Client behalten möchten (Agency-Workflows), ist ein einfaches Muster:

    - Eine Notion-Seite pro Client (Kontext + Präferenzen + aktive Arbeit).
    - Bitten Sie den Agenten, diese Seite am Beginn einer Sitzung abzurufen.

    Wenn Sie eine native Integration möchten, eröffnen Sie einen Feature-Request oder bauen Sie einen Skill,
    der auf diese APIs zielt.

    Skills installieren:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native Installationen landen im `skills/`-Verzeichnis des aktiven Workspace. Für gemeinsame Skills über Agents hinweg legen Sie sie in `~/.openclaw/skills/<name>/SKILL.md` ab. Wenn nur einige Agents eine gemeinsame Installation sehen sollen, konfigurieren Sie `agents.defaults.skills` oder `agents.list[].skills`. Einige Skills erwarten Binärdateien, die per Homebrew installiert werden; unter Linux bedeutet das Linuxbrew (siehe den Homebrew-Linux-FAQ-Eintrag oben). Siehe [Skills](/de/tools/skills), [Skills-Konfiguration](/de/tools/skills-config) und [ClawHub](/de/tools/clawhub).

  </Accordion>

  <Accordion title="Wie verwende ich mein vorhandenes angemeldetes Chrome mit OpenClaw?">
    Verwenden Sie das eingebaute Browser-Profil `user`, das sich über Chrome DevTools MCP anbindet:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Wenn Sie einen benutzerdefinierten Namen möchten, erstellen Sie ein explizites MCP-Profil:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Dieser Pfad ist hostlokal. Wenn das Gateway woanders läuft, führen Sie entweder einen Node-Host auf der Browser-Maschine aus oder verwenden Sie stattdessen Remote-CDP.

    Aktuelle Grenzen von `existing-session` / `user`:

    - Aktionen sind ref-basiert, nicht CSS-Selektor-basiert
    - Uploads benötigen `ref` / `inputRef` und unterstützen derzeit jeweils nur eine Datei
    - `responsebody`, PDF-Export, Download-Interception und Batch-Aktionen benötigen weiterhin einen verwalteten Browser oder ein rohes CDP-Profil

  </Accordion>
</AccordionGroup>

## Sandboxing und Memory

<AccordionGroup>
  <Accordion title="Gibt es eine eigene Doku zum Sandboxing?">
    Ja. Siehe [Sandboxing](/de/gateway/sandboxing). Für Docker-spezifische Einrichtung (vollständiges Gateway in Docker oder Sandbox-Images) siehe [Docker](/de/install/docker).
  </Accordion>

  <Accordion title="Docker fühlt sich eingeschränkt an - wie aktiviere ich volle Funktionen?">
    Das Standard-Image ist sicherheitsorientiert und läuft als Benutzer `node`, daher
    enthält es keine Systempakete, kein Homebrew und keine gebündelten Browser. Für ein vollständigeres Setup:

    - Persistieren Sie `/home/node` mit `OPENCLAW_HOME_VOLUME`, damit Caches erhalten bleiben.
    - Backen Sie Systemabhängigkeiten mit `OPENCLAW_DOCKER_APT_PACKAGES` in das Image ein.
    - Installieren Sie Playwright-Browser über die gebündelte CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Setzen Sie `PLAYWRIGHT_BROWSERS_PATH` und stellen Sie sicher, dass der Pfad persistent ist.

    Doku: [Docker](/de/install/docker), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Kann ich DMs privat halten, aber Gruppen öffentlich/sandboxed mit einem Agenten machen?">
    Ja - wenn Ihr privater Verkehr **DMs** sind und Ihr öffentlicher Verkehr **Gruppen**.

    Verwenden Sie `agents.defaults.sandbox.mode: "non-main"`, damit Gruppen-/Kanal-Sitzungen (Nicht-Hauptschlüssel) in Docker laufen, während die Haupt-DM-Sitzung auf dem Host bleibt. Beschränken Sie dann, welche Tools in sandboxierten Sitzungen über `tools.sandbox.tools` verfügbar sind.

    Einrichtungsanleitung + Beispielkonfiguration: [Gruppen: persönliche DMs + öffentliche Gruppen](/de/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Wichtige Konfigurationsreferenz: [Gateway-Konfiguration](/de/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Wie binde ich einen Host-Ordner in die Sandbox ein?">
    Setzen Sie `agents.defaults.sandbox.docker.binds` auf `["host:path:mode"]` (z. B. `"/home/user/src:/src:ro"`). Globale + pro-Agent-Bindings werden zusammengeführt; Bindings pro Agent werden ignoriert, wenn `scope: "shared"` gilt. Verwenden Sie `:ro` für alles Empfindliche und denken Sie daran, dass Bindings die Dateisystemgrenzen der Sandbox umgehen.

    OpenClaw validiert Bind-Quellen sowohl gegen den normalisierten Pfad als auch den kanonischen Pfad, der über den tiefsten vorhandenen Vorgänger aufgelöst wird. Das bedeutet, dass Ausbrüche über Symlink-Eltern weiterhin fail-closed scheitern, selbst wenn das letzte Pfadsegment noch nicht existiert, und Allowed-Root-Prüfungen auch nach der Symlink-Auflösung weiterhin gelten.

    Siehe [Sandboxing](/de/gateway/sandboxing#custom-bind-mounts) und [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) für Beispiele und Sicherheitshinweise.

  </Accordion>

  <Accordion title="Wie funktioniert Memory?">
    OpenClaw-Memory sind einfach Markdown-Dateien im Agent-Workspace:

    - Tagesnotizen in `memory/YYYY-MM-DD.md`
    - Kuratierte Langzeitnotizen in `MEMORY.md` (nur Haupt-/private Sitzungen)

    OpenClaw führt außerdem einen **stillen Memory-Flush vor der Kompaktierung** aus, um das Modell
    daran zu erinnern, dauerhafte Notizen zu schreiben, bevor automatisch kompaktiert wird. Das läuft nur, wenn der Workspace
    schreibbar ist (schreibgeschützte Sandboxes überspringen dies). Siehe [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Memory vergisst ständig Dinge. Wie bekomme ich sie dauerhaft hinein?">
    Bitten Sie den Bot, **die Tatsache in Memory zu schreiben**. Langzeitnotizen gehören in `MEMORY.md`,
    kurzfristiger Kontext in `memory/YYYY-MM-DD.md`.

    Das ist weiterhin ein Bereich, den wir verbessern. Es hilft, das Modell daran zu erinnern, Erinnerungen zu speichern;
    es weiß dann, was zu tun ist. Wenn es weiterhin vergisst, prüfen Sie, dass das Gateway bei jedem Lauf denselben
    Workspace verwendet.

    Doku: [Memory](/de/concepts/memory), [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bleibt Memory für immer erhalten? Was sind die Grenzen?">
    Memory-Dateien liegen auf der Festplatte und bleiben erhalten, bis Sie sie löschen. Die Grenze ist Ihr
    Speicherplatz, nicht das Modell. Der **Sitzungskontext** ist weiterhin durch das Modell-
    Kontextfenster begrenzt, sodass lange Gespräche kompaktiert oder gekürzt werden können. Deshalb
    gibt es Memory Search - sie holt nur die relevanten Teile zurück in den Kontext.

    Doku: [Memory](/de/concepts/memory), [Kontext](/de/concepts/context).

  </Accordion>

  <Accordion title="Benötigt semantische Memory Search einen OpenAI-API-Schlüssel?">
    Nur wenn Sie **OpenAI-Embeddings** verwenden. Codex-OAuth deckt Chat/Completions ab und
    gewährt **keinen** Zugriff auf Embeddings, daher hilft **die Anmeldung mit Codex (OAuth oder
    Codex-CLI-Login)** nicht bei semantischer Memory Search. OpenAI-Embeddings
    benötigen weiterhin einen echten API-Schlüssel (`OPENAI_API_KEY` oder `models.providers.openai.apiKey`).

    Wenn Sie keinen Provider explizit setzen, wählt OpenClaw automatisch einen Provider aus, wenn es
    einen API-Schlüssel auflösen kann (Auth-Profile, `models.providers.*.apiKey` oder Umgebungsvariablen).
    Es bevorzugt OpenAI, wenn ein OpenAI-Schlüssel aufgelöst wird, andernfalls Gemini, wenn ein Gemini-Schlüssel
    aufgelöst wird, dann Voyage, dann Mistral. Wenn kein Remote-Schlüssel verfügbar ist, bleibt Memory
    Search deaktiviert, bis Sie sie konfigurieren. Wenn Sie einen lokalen Modellpfad
    konfiguriert haben und dieser vorhanden ist, bevorzugt OpenClaw
    `local`. Ollama wird unterstützt, wenn Sie explizit
    `memorySearch.provider = "ollama"` setzen.

    Wenn Sie lieber lokal bleiben möchten, setzen Sie `memorySearch.provider = "local"` (und optional
    `memorySearch.fallback = "none"`). Wenn Sie Gemini-Embeddings möchten, setzen Sie
    `memorySearch.provider = "gemini"` und geben Sie `GEMINI_API_KEY` an (oder
    `memorySearch.remote.apiKey`). Wir unterstützen Embedding-Modelle von **OpenAI, Gemini, Voyage, Mistral, Ollama oder lokal**
    - siehe [Memory](/de/concepts/memory) für die Einrichtungsdetails.

  </Accordion>
</AccordionGroup>

## Wo Dinge auf der Festplatte liegen

<AccordionGroup>
  <Accordion title="Werden alle mit OpenClaw verwendeten Daten lokal gespeichert?">
    Nein - **der Zustand von OpenClaw ist lokal**, aber **externe Dienste sehen weiterhin, was Sie ihnen senden**.

    - **Lokal standardmäßig:** Sitzungen, Memory-Dateien, Konfiguration und Workspace liegen auf dem Gateway-Host
      (`~/.openclaw` + Ihr Workspace-Verzeichnis).
    - **Remote aus Notwendigkeit:** Nachrichten, die Sie an Modell-Provider senden (Anthropic/OpenAI/etc.), gehen an
      deren APIs, und Chat-Plattformen (WhatsApp/Telegram/Slack/etc.) speichern Nachrichtendaten auf ihren
      Servern.
    - **Sie kontrollieren den Footprint:** Die Verwendung lokaler Modelle hält Prompts auf Ihrer Maschine, aber der
      Kanalverkehr läuft weiterhin über die Server des jeweiligen Kanals.

    Verwandt: [Agent-Workspace](/de/concepts/agent-workspace), [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Wo speichert OpenClaw seine Daten?">
    Alles liegt unter `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`):

    | Pfad                                                            | Zweck                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Hauptkonfiguration (JSON5)                                         |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Älterer OAuth-Import (wird bei erster Verwendung in Auth-Profile kopiert) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-Profile (OAuth, API-Schlüssel und optional `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Optionale dateigestützte Secret-Nutzlast für `file`-SecretRef-Provider |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Ältere Kompatibilitätsdatei (statische `api_key`-Einträge werden bereinigt) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider-Zustand (z. B. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Zustand pro Agent (agentDir + Sitzungen)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Gesprächsverlauf & Zustand (pro Agent)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Sitzungsmetadaten (pro Agent)                                      |

    Älterer Single-Agent-Pfad: `~/.openclaw/agent/*` (wird durch `openclaw doctor` migriert).

    Ihr **Workspace** (AGENTS.md, Memory-Dateien, Skills usw.) ist getrennt und wird über `agents.defaults.workspace` konfiguriert (Standard: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Wo sollten AGENTS.md / SOUL.md / USER.md / MEMORY.md liegen?">
    Diese Dateien liegen im **Agent-Workspace**, nicht in `~/.openclaw`.

    - **Workspace (pro Agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oder älterer Fallback `memory.md`, wenn `MEMORY.md` fehlt),
      `memory/YYYY-MM-DD.md`, optional `HEARTBEAT.md`.
    - **State-Dir (`~/.openclaw`)**: Konfiguration, Kanal-/Provider-Zustand, Auth-Profile, Sitzungen, Logs,
      und gemeinsame Skills (`~/.openclaw/skills`).

    Der Standard-Workspace ist `~/.openclaw/workspace`, konfigurierbar über:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Wenn der Bot nach einem Neustart „vergisst“, bestätigen Sie, dass das Gateway bei jedem Start denselben
    Workspace verwendet (und denken Sie daran: Im Remote-Modus wird der Workspace des **Gateway-Hosts**
    verwendet, nicht der Ihres lokalen Laptops).

    Tipp: Wenn Sie ein dauerhaftes Verhalten oder eine Präferenz möchten, bitten Sie den Bot, dies **in
    AGENTS.md oder MEMORY.md zu schreiben**, statt sich auf den Chat-Verlauf zu verlassen.

    Siehe [Agent-Workspace](/de/concepts/agent-workspace) und [Memory](/de/concepts/memory).

  </Accordion>

  <Accordion title="Empfohlene Backup-Strategie">
    Legen Sie Ihren **Agent-Workspace** in ein **privates** git-Repo und sichern Sie ihn an einem
    privaten Ort (zum Beispiel GitHub private). Das erfasst Memory + AGENTS/SOUL/USER-
    Dateien und lässt Sie später den „Geist“ des Assistenten wiederherstellen.

    Committen Sie **nichts** unter `~/.openclaw` (`Credentials`, Sitzungen, Tokens oder verschlüsselte Secret-Payloads).
    Wenn Sie eine vollständige Wiederherstellung benötigen, sichern Sie sowohl den Workspace als auch das State-Verzeichnis
    separat (siehe die Migrationsfrage oben).

    Doku: [Agent-Workspace](/de/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Wie deinstalliere ich OpenClaw vollständig?">
    Siehe die spezielle Anleitung: [Deinstallation](/de/install/uninstall).
  </Accordion>

  <Accordion title="Können Agents außerhalb des Workspace arbeiten?">
    Ja. Der Workspace ist das **Standard-CWD** und der Memory-Anker, keine harte Sandbox.
    Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können auf andere
    Host-Orte zugreifen, sofern Sandboxing nicht aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
    [`agents.defaults.sandbox`](/de/gateway/sandboxing) oder Sandbox-Einstellungen pro Agent. Wenn Sie
    möchten, dass ein Repo das Standard-Arbeitsverzeichnis ist, zeigen Sie den
    `workspace` dieses Agenten auf das Repo-Root. Das OpenClaw-Repo ist nur Quellcode; halten Sie den
    Workspace getrennt, es sei denn, Sie möchten ausdrücklich, dass der Agent darin arbeitet.

    Beispiel (Repo als Standard-CWD):

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
    Der Sitzungszustand gehört dem **Gateway-Host**. Wenn Sie im Remote-Modus sind, befindet sich der Sitzungsspeicher, der Sie interessiert, auf der entfernten Maschine, nicht auf Ihrem lokalen Laptop. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>
</AccordionGroup>

## Grundlagen der Konfiguration

<AccordionGroup>
  <Accordion title="Welches Format hat die Konfiguration? Wo ist sie?">
    OpenClaw liest eine optionale **JSON5**-Konfiguration aus `$OPENCLAW_CONFIG_PATH` (Standard: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Wenn die Datei fehlt, verwendet es halbwegs sichere Standards (einschließlich eines Standard-Workspace von `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ich habe gateway.bind: "lan" (oder "tailnet") gesetzt und jetzt hört nichts / die UI sagt unauthorized'>
    Non-Loopback-Bindungen **erfordern einen gültigen Gateway-Auth-Pfad**. In der Praxis bedeutet das:

    - Shared-Secret-Auth: Token oder Passwort
    - `gateway.auth.mode: "trusted-proxy"` hinter einem korrekt konfigurierten identitätsbewussten Non-Loopback-Reverse-Proxy

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
    - Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
    - Für Passwort-Auth setzen Sie stattdessen `gateway.auth.mode: "password"` plus `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (kein Remote-Fallback, das maskiert).
    - Shared-Secret-Control-UI-Setups authentifizieren sich über `connect.params.auth.token` oder `connect.params.auth.password` (gespeichert in App-/UI-Einstellungen). Identitätsbasierte Modi wie Tailscale Serve oder `trusted-proxy` verwenden stattdessen Request-Header. Vermeiden Sie Shared Secrets in URLs.
    - Mit `gateway.auth.mode: "trusted-proxy"` erfüllen Reverse Proxies auf demselben Host über loopback weiterhin **nicht** die Trusted-Proxy-Authentifizierung. Der Trusted Proxy muss eine konfigurierte Non-Loopback-Quelle sein.

  </Accordion>

  <Accordion title="Warum brauche ich jetzt ein Token auf localhost?">
    OpenClaw erzwingt Gateway-Auth standardmäßig, auch auf loopback. Im normalen Standardpfad bedeutet das Token-Auth: Wenn kein expliziter Auth-Pfad konfiguriert ist, wird beim Gateway-Start der Token-Modus aufgelöst und automatisch ein Token erzeugt, das in `gateway.auth.token` gespeichert wird. Daher **müssen lokale WS-Clients sich authentifizieren**. Das blockiert andere lokale Prozesse daran, das Gateway aufzurufen.

    Wenn Sie einen anderen Auth-Pfad bevorzugen, können Sie explizit den Passwortmodus wählen (oder für identitätsbewusste Non-Loopback-Reverse-Proxies `trusted-proxy`). Wenn Sie **wirklich** offenes loopback wollen, setzen Sie `gateway.auth.mode: "none"` explizit in Ihrer Konfiguration. Doctor kann jederzeit ein Token für Sie erzeugen: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Muss ich nach einer Konfigurationsänderung neu starten?">
    Das Gateway überwacht die Konfiguration und unterstützt Hot-Reload:

    - `gateway.reload.mode: "hybrid"` (Standard): sichere Änderungen hot anwenden, für kritische neu starten
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

    - `off`: blendet Tagline-Text aus, behält aber die Banner-Titel-/Versionszeile.
    - `default`: verwendet jedes Mal `All your chats, one OpenClaw.`.
    - `random`: rotierende lustige/saisonale Taglines (Standardverhalten).
    - Wenn Sie gar kein Banner möchten, setzen Sie die Umgebungsvariable `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Wie aktiviere ich Websuche (und Web-Fetch)?">
    `web_fetch` funktioniert ohne API-Schlüssel. `web_search` hängt von Ihrem ausgewählten
    Provider ab:

    - API-gestützte Provider wie Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity und Tavily benötigen ihre normale API-Schlüssel-Einrichtung.
    - Ollama Web Search ist schlüsselfrei, verwendet aber Ihren konfigurierten Ollama-Host und erfordert `ollama signin`.
    - DuckDuckGo ist schlüsselfrei, aber eine inoffizielle HTML-basierte Integration.
    - SearXNG ist schlüsselfrei/self-hosted; konfigurieren Sie `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Empfohlen:** Führen Sie `openclaw configure --section web` aus und wählen Sie einen Provider.
    Umgebungsvariablen als Alternative:

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
              provider: "firecrawl", // optional; weglassen für Auto-Erkennung
            },
          },
        },
    }
    ```

    Provider-spezifische Web-Search-Konfiguration liegt jetzt unter `plugins.entries.<plugin>.config.webSearch.*`.
    Ältere Provider-Pfade unter `tools.web.search.*` werden aus Kompatibilitätsgründen vorübergehend weiterhin geladen, sollten aber für neue Konfigurationen nicht mehr verwendet werden.
    Die Firecrawl-Web-Fetch-Fallback-Konfiguration liegt unter `plugins.entries.firecrawl.config.webFetch.*`.

    Hinweise:

    - Wenn Sie Allowlists verwenden, fügen Sie `web_search`/`web_fetch`/`x_search` oder `group:web` hinzu.
    - `web_fetch` ist standardmäßig aktiviert (sofern nicht explizit deaktiviert).
    - Wenn `tools.web.fetch.provider` weggelassen wird, erkennt OpenClaw automatisch den ersten einsatzbereiten Fetch-Fallback-Provider anhand verfügbarer Credentials. Heute ist der gebündelte Provider Firecrawl.
    - Daemons lesen Umgebungsvariablen aus `~/.openclaw/.env` (oder aus der Service-Umgebung).

    Doku: [Web-Tools](/de/tools/web).

  </Accordion>

  <Accordion title="config.apply hat meine Konfiguration gelöscht. Wie stelle ich sie wieder her und wie vermeide ich das?">
    `config.apply` ersetzt die **gesamte Konfiguration**. Wenn Sie ein partielles Objekt senden, wird alles
    andere entfernt.

    Wiederherstellen:

    - Aus dem Backup wiederherstellen (git oder eine kopierte `~/.openclaw/openclaw.json`).
    - Wenn Sie kein Backup haben, führen Sie `openclaw doctor` erneut aus und konfigurieren Sie Kanäle/Modelle neu.
    - Wenn dies unerwartet war, melden Sie einen Bug und fügen Sie Ihre zuletzt bekannte Konfiguration oder ein Backup hinzu.
    - Ein lokaler Coding-Agent kann häufig eine funktionierende Konfiguration aus Logs oder Verlauf rekonstruieren.

    So vermeiden Sie es:

    - Verwenden Sie `openclaw config set` für kleine Änderungen.
    - Verwenden Sie `openclaw configure` für interaktive Änderungen.
    - Verwenden Sie zuerst `config.schema.lookup`, wenn Sie sich über einen genauen Pfad oder die Feldform nicht sicher sind; es gibt einen flachen Schema-Knoten plus Zusammenfassungen der direkten Kinder für Drill-down zurück.
    - Verwenden Sie `config.patch` für partielle RPC-Bearbeitungen; behalten Sie `config.apply` nur für das Ersetzen der vollständigen Konfiguration.
    - Wenn Sie das nur dem Eigentümer verfügbare Tool `gateway` aus einer Agent-Ausführung heraus verwenden, wird es weiterhin Schreibvorgänge auf `tools.exec.ask` / `tools.exec.security` ablehnen (einschließlich älterer `tools.bash.*`-Aliasse, die auf dieselben geschützten Exec-Pfade normalisiert werden).

    Doku: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Wie richte ich ein zentrales Gateway mit spezialisierten Workern über Geräte hinweg ein?">
    Das übliche Muster ist **ein Gateway** (z. B. Raspberry Pi) plus **Nodes** und **Agents**:

    - **Gateway (zentral):** besitzt Kanäle (Signal/WhatsApp), Routing und Sitzungen.
    - **Nodes (Geräte):** Macs/iOS/Android verbinden sich als Peripherie und stellen lokale Tools bereit (`system.run`, `canvas`, `camera`).
    - **Agents (Worker):** getrennte Gehirne/Workspaces für spezielle Rollen (z. B. „Hetzner ops“, „Persönliche Daten“).
    - **Sub-Agents:** starten Hintergrundarbeit aus einem Haupt-Agenten heraus, wenn Sie Parallelität möchten.
    - **TUI:** verbindet sich mit dem Gateway und wechselt Agents/Sitzungen.

    Doku: [Nodes](/de/nodes), [Remote-Zugriff](/de/gateway/remote), [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [TUI](/web/tui).

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

    Standard ist `false` (mit Fenster). Headless löst auf manchen Websites eher Anti-Bot-Prüfungen aus. Siehe [Browser](/de/tools/browser).

    Headless verwendet **dieselbe Chromium-Engine** und funktioniert für die meiste Automatisierung (Formulare, Klicks, Scraping, Logins). Die Hauptunterschiede:

    - Kein sichtbares Browserfenster (verwenden Sie Screenshots, wenn Sie etwas Visuelles benötigen).
    - Manche Websites gehen in headless Mode strenger mit Automatisierung um (CAPTCHAs, Anti-Bot).
      Zum Beispiel blockiert X/Twitter oft headless Sitzungen.

  </Accordion>

  <Accordion title="Wie verwende ich Brave zur Browser-Steuerung?">
    Setzen Sie `browser.executablePath` auf Ihre Brave-Binärdatei (oder einen anderen Chromium-basierten Browser) und starten Sie das Gateway neu.
    Die vollständigen Konfigurationsbeispiele finden Sie unter [Browser](/de/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Remote-Gateways und Nodes

<AccordionGroup>
  <Accordion title="Wie propagieren Befehle zwischen Telegram, dem Gateway und Nodes?">
    Telegram-Nachrichten werden vom **Gateway** verarbeitet. Das Gateway führt den Agenten aus und
    ruft Nodes erst dann über den **Gateway-WebSocket** auf, wenn ein Node-Tool benötigt wird:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes sehen keinen eingehenden Provider-Verkehr; sie erhalten nur Node-RPC-Aufrufe.

  </Accordion>

  <Accordion title="Wie kann mein Agent auf meinen Computer zugreifen, wenn das Gateway remote gehostet wird?">
    Kurz gesagt: **Koppeln Sie Ihren Computer als Node**. Das Gateway läuft anderswo, kann aber
    `node.*`-Tools (Bildschirm, Kamera, System) auf Ihrer lokalen Maschine über den Gateway-WebSocket aufrufen.

    Typisches Setup:

    1. Führen Sie das Gateway auf dem always-on-Host aus (VPS/Home-Server).
    2. Bringen Sie Gateway-Host + Ihren Computer in dasselbe Tailnet.
    3. Stellen Sie sicher, dass Gateway-WS erreichbar ist (Tailnet-Bindung oder SSH-Tunnel).
    4. Öffnen Sie die macOS-App lokal und verbinden Sie sich im Modus **Remote over SSH** (oder direkt über Tailnet),
       damit sie sich als Node registrieren kann.
    5. Genehmigen Sie den Node auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Es ist keine separate TCP-Bridge erforderlich; Nodes verbinden sich über den Gateway-WebSocket.

    Sicherheitshinweis: Das Koppeln eines macOS-Nodes erlaubt `system.run` auf dieser Maschine. Koppeln
    Sie nur Geräte, denen Sie vertrauen, und lesen Sie [Sicherheit](/de/gateway/security).

    Doku: [Nodes](/de/nodes), [Gateway-Protokoll](/de/gateway/protocol), [macOS-Remote-Modus](/de/platforms/mac/remote), [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Tailscale ist verbunden, aber ich bekomme keine Antworten. Was jetzt?">
    Prüfen Sie die Grundlagen:

    - Gateway läuft: `openclaw gateway status`
    - Gateway-Health: `openclaw status`
    - Kanal-Health: `openclaw channels status`

    Verifizieren Sie dann Auth und Routing:

    - Wenn Sie Tailscale Serve verwenden, stellen Sie sicher, dass `gateway.auth.allowTailscale` korrekt gesetzt ist.
    - Wenn Sie sich über einen SSH-Tunnel verbinden, bestätigen Sie, dass der lokale Tunnel aktiv ist und auf den richtigen Port zeigt.
    - Bestätigen Sie, dass Ihre Allowlists (DM oder Gruppe) Ihr Konto enthalten.

    Doku: [Tailscale](/de/gateway/tailscale), [Remote-Zugriff](/de/gateway/remote), [Kanäle](/de/channels).

  </Accordion>

  <Accordion title="Können zwei OpenClaw-Instanzen miteinander sprechen (lokal + VPS)?">
    Ja. Es gibt keine eingebaute „Bot-zu-Bot“-Bridge, aber Sie können das auf einige
    zuverlässige Arten verdrahten:

    **Am einfachsten:** Verwenden Sie einen normalen Chat-Kanal, auf den beide Bots zugreifen können (Telegram/Slack/WhatsApp).
    Lassen Sie Bot A eine Nachricht an Bot B senden, und Bot B antwortet dann wie gewohnt.

    **CLI-Bridge (generisch):** Führen Sie ein Skript aus, das das andere Gateway mit
    `openclaw agent --message ... --deliver` aufruft und auf einen Chat zielt, in dem der andere Bot
    zuhört. Wenn ein Bot auf einem Remote-VPS ist, richten Sie Ihre CLI auf dieses Remote-Gateway
    über SSH/Tailscale aus (siehe [Remote-Zugriff](/de/gateway/remote)).

    Beispielmuster (von einer Maschine ausführen, die das Ziel-Gateway erreichen kann):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tipp: Fügen Sie eine Leitplanke hinzu, damit die beiden Bots nicht endlos in einer Schleife laufen (nur bei Erwähnung, Kanal-
    Allowlists oder eine Regel „nicht auf Bot-Nachrichten antworten“).

    Doku: [Remote-Zugriff](/de/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/de/tools/agent-send).

  </Accordion>

  <Accordion title="Brauche ich für mehrere Agents separate VPSes?">
    Nein. Ein Gateway kann mehrere Agents hosten, jeder mit eigenem Workspace, Modellstandards
    und Routing. Das ist das normale Setup und viel günstiger und einfacher als
    ein VPS pro Agent.

    Verwenden Sie separate VPSes nur, wenn Sie harte Isolation (Sicherheitsgrenzen) oder sehr
    unterschiedliche Konfigurationen benötigen, die Sie nicht gemeinsam nutzen möchten. Andernfalls behalten Sie ein Gateway und
    verwenden mehrere Agents oder Sub-Agents.

  </Accordion>

  <Accordion title="Gibt es einen Vorteil, einen Node auf meinem persönlichen Laptop zu verwenden statt SSH von einem VPS aus?">
    Ja - Nodes sind der erstklassige Weg, Ihren Laptop von einem Remote-Gateway aus zu erreichen, und sie
    ermöglichen mehr als nur Shell-Zugriff. Das Gateway läuft auf macOS/Linux (Windows über WSL2) und ist
    leichtgewichtig (ein kleiner VPS oder eine Raspberry-Pi-Klasse-Box reicht; 4 GB RAM sind reichlich), daher ist ein häufiges
    Setup ein always-on-Host plus Ihr Laptop als Node.

    - **Kein eingehendes SSH erforderlich.** Nodes verbinden sich ausgehend mit dem Gateway-WebSocket und verwenden Device-Pairing.
    - **Sicherere Ausführungskontrollen.** `system.run` ist durch Node-Allowlists/Genehmigungen auf diesem Laptop geschützt.
    - **Mehr Geräte-Tools.** Nodes stellen zusätzlich zu `system.run` auch `canvas`, `camera` und `screen` bereit.
    - **Lokale Browser-Automatisierung.** Lassen Sie das Gateway auf einem VPS, führen Sie aber Chrome lokal über einen Node-Host auf dem Laptop aus oder hängen Sie sich über Chrome MCP an lokales Chrome auf dem Host.

    SSH ist für ad-hoc-Shell-Zugriff in Ordnung, aber Nodes sind einfacher für laufende Agent-Workflows und
    Geräte-Automatisierung.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Browser](/de/tools/browser).

  </Accordion>

  <Accordion title="Führen Nodes einen Gateway-Service aus?">
    Nein. Pro Host sollte nur **ein Gateway** laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Nodes sind Peripheriegeräte, die sich
    mit dem Gateway verbinden (iOS/Android-Nodes oder der macOS-„Node-Modus“ in der Menüleisten-App). Für headless Node-
    Hosts und CLI-Steuerung siehe [Node Host CLI](/cli/node).

    Für Änderungen an `gateway`, `discovery` und `canvasHost` ist ein vollständiger Neustart erforderlich.

  </Accordion>

  <Accordion title="Gibt es einen API-/RPC-Weg, Konfiguration anzuwenden?">
    Ja.

    - `config.schema.lookup`: prüft einen Konfigurations-Subtree mit seinem flachen Schema-Knoten, passendem UI-Hinweis und Zusammenfassungen der direkten Kinder vor dem Schreiben
    - `config.get`: holt den aktuellen Snapshot + Hash
    - `config.patch`: sichere partielle Aktualisierung (bevorzugt für die meisten RPC-Bearbeitungen)
    - `config.apply`: validiert + ersetzt die vollständige Konfiguration und startet dann neu
    - Das nur dem Eigentümer verfügbare Laufzeit-Tool `gateway` verweigert weiterhin Umschreibungen von `tools.exec.ask` / `tools.exec.security`; ältere `tools.bash.*`-Aliasse werden auf dieselben geschützten Exec-Pfade normalisiert

  </Accordion>

  <Accordion title="Minimal sinnvolle Konfiguration für eine erste Installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Dadurch wird Ihr Workspace gesetzt und eingeschränkt, wer den Bot auslösen darf.

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
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Wenn Sie die Control UI ohne SSH möchten, verwenden Sie Tailscale Serve auf dem VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Dadurch bleibt das Gateway an loopback gebunden und stellt HTTPS über Tailscale bereit. Siehe [Tailscale](/de/gateway/tailscale).

  </Accordion>

  <Accordion title="Wie verbinde ich einen Mac-Node mit einem Remote-Gateway (Tailscale Serve)?">
    Serve stellt die **Gateway Control UI + WS** bereit. Nodes verbinden sich über denselben Gateway-WS-Endpunkt.

    Empfohlenes Setup:

    1. **Stellen Sie sicher, dass VPS + Mac im selben Tailnet sind**.
    2. **Verwenden Sie die macOS-App im Remote-Modus** (das SSH-Ziel kann der Tailnet-Hostname sein).
       Die App tunnelt den Gateway-Port und verbindet sich als Node.
    3. **Genehmigen Sie den Node** auf dem Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Doku: [Gateway-Protokoll](/de/gateway/protocol), [Discovery](/de/gateway/discovery), [macOS-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Soll ich auf einem zweiten Laptop installieren oder einfach einen Node hinzufügen?">
    Wenn Sie nur **lokale Tools** (Bildschirm/Kamera/Exec) auf dem zweiten Laptop benötigen, fügen Sie ihn als
    **Node** hinzu. Dadurch bleibt ein einzelnes Gateway erhalten und doppelte Konfiguration wird vermieden. Lokale Node-Tools sind
    derzeit nur für macOS verfügbar, aber wir planen, sie auf andere Betriebssysteme auszuweiten.

    Installieren Sie ein zweites Gateway nur, wenn Sie **harte Isolation** oder zwei vollständig getrennte Bots benötigen.

    Doku: [Nodes](/de/nodes), [Nodes CLI](/cli/nodes), [Mehrere Gateways](/de/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen und .env-Laden

<AccordionGroup>
  <Accordion title="Wie lädt OpenClaw Umgebungsvariablen?">
    OpenClaw liest Umgebungsvariablen aus dem Elternprozess (Shell, launchd/systemd, CI usw.) und lädt zusätzlich:

    - `.env` aus dem aktuellen Arbeitsverzeichnis
    - eine globale Fallback-`.env` aus `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`)

    Keine der `.env`-Dateien überschreibt bestehende Umgebungsvariablen.

    Sie können auch Inline-Umgebungsvariablen in der Konfiguration definieren (werden nur angewendet, wenn sie im Prozess-Environment fehlen):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Siehe [/environment](/de/help/environment) für die vollständige Reihenfolge und Quellen.

  </Accordion>

  <Accordion title="Ich habe das Gateway über den Service gestartet und meine Umgebungsvariablen sind verschwunden. Was nun?">
    Zwei häufige Lösungen:

    1. Legen Sie die fehlenden Schlüssel in `~/.openclaw/.env` ab, damit sie auch dann aufgenommen werden, wenn der Service Ihre Shell-Umgebung nicht erbt.
    2. Aktivieren Sie den Shell-Import (Opt-in-Bequemlichkeit):

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

    Dadurch wird Ihre Login-Shell ausgeführt und es werden nur fehlende erwartete Schlüssel importiert (niemals überschrieben). Äquivalente Umgebungsvariablen:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ich habe COPILOT_GITHUB_TOKEN gesetzt, aber models status zeigt "Shell env: off." Warum?'>
    `openclaw models status` meldet, ob **Shell-Env-Import** aktiviert ist. „Shell env: off“
    bedeutet **nicht**, dass Ihre Umgebungsvariablen fehlen - es bedeutet nur, dass OpenClaw Ihre
    Login-Shell nicht automatisch lädt.

    Wenn das Gateway als Service läuft (launchd/systemd), erbt es Ihre Shell-
    Umgebung nicht. Beheben Sie das auf eine dieser Arten:

    1. Legen Sie das Token in `~/.openclaw/.env` ab:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oder aktivieren Sie den Shell-Import (`env.shellEnv.enabled: true`).
    3. Oder fügen Sie es Ihrem Konfigurationsblock `env` hinzu (wird nur angewendet, wenn es fehlt).

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
  <Accordion title="Wie starte ich ein neues Gespräch?">
    Senden Sie `/new` oder `/reset` als eigenständige Nachricht. Siehe [Sitzungsverwaltung](/de/concepts/session).
  </Accordion>

  <Accordion title="Werden Sitzungen automatisch zurückgesetzt, wenn ich nie /new sende?">
    Sitzungen können nach `session.idleMinutes` ablaufen, aber dies ist **standardmäßig deaktiviert** (Standard **0**).
    Setzen Sie einen positiven Wert, um Leerlaufablauf zu aktivieren. Wenn aktiviert, startet die **nächste**
    Nachricht nach dem Leerlaufzeitraum eine neue Sitzungs-ID für diesen Chat-Schlüssel.
    Dadurch werden Transkripte nicht gelöscht - es startet nur eine neue Sitzung.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Gibt es eine Möglichkeit, ein Team aus OpenClaw-Instanzen zu bilden (ein CEO und viele Agents)?">
    Ja, über **Multi-Agent-Routing** und **Sub-Agents**. Sie können einen koordinierenden
    Agenten und mehrere Worker-Agents mit ihren eigenen Workspaces und Modellen erstellen.

    Dennoch sollte dies eher als **spaßiges Experiment** gesehen werden. Es ist tokenintensiv und oft
    weniger effizient, als einen Bot mit getrennten Sitzungen zu verwenden. Das typische Modell, das wir
    uns vorstellen, ist ein Bot, mit dem Sie sprechen, mit unterschiedlichen Sitzungen für parallele Arbeit. Dieser
    Bot kann bei Bedarf auch Sub-Agents starten.

    Doku: [Multi-Agent-Routing](/de/concepts/multi-agent), [Sub-Agents](/de/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Warum wurde der Kontext mitten in der Aufgabe gekürzt? Wie verhindere ich das?">
    Der Sitzungskontext ist durch das Modellfenster begrenzt. Lange Chats, große Tool-Ausgaben oder viele
    Dateien können Kompaktierung oder Kürzung auslösen.

    Was hilft:

    - Bitten Sie den Bot, den aktuellen Zustand zusammenzufassen und in eine Datei zu schreiben.
    - Verwenden Sie `/compact` vor langen Aufgaben und `/new`, wenn Sie das Thema wechseln.
    - Halten Sie wichtigen Kontext im Workspace und bitten Sie den Bot, ihn erneut zu lesen.
    - Verwenden Sie Sub-Agents für lange oder parallele Arbeit, damit der Haupt-Chat kleiner bleibt.
    - Wählen Sie ein Modell mit größerem Kontextfenster, wenn das oft passiert.

  </Accordion>

  <Accordion title="Wie setze ich OpenClaw vollständig zurück, aber behalte es installiert?">
    Verwenden Sie den Reset-Befehl:

    ```bash
    openclaw reset
    ```

    Nicht-interaktiver vollständiger Reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Führen Sie dann das Setup erneut aus:

    ```bash
    openclaw onboard --install-daemon
    ```

    Hinweise:

    - Das Onboarding bietet auch **Reset** an, wenn es eine bestehende Konfiguration erkennt. Siehe [Onboarding (CLI)](/de/start/wizard).
    - Wenn Sie Profile verwendet haben (`--profile` / `OPENCLAW_PROFILE`), setzen Sie jedes State-Dir zurück (Standards sind `~/.openclaw-<profile>`).
    - Dev-Reset: `openclaw gateway --dev --reset` (nur für Dev; löscht Dev-Konfiguration + Credentials + Sitzungen + Workspace).

  </Accordion>

  <Accordion title='Ich bekomme Fehler vom Typ "context too large" - wie setze ich zurück oder komprimiere?'>
    Verwenden Sie eines davon:

    - **Kompaktieren** (behält das Gespräch, fasst aber ältere Turns zusammen):

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

    - Aktivieren oder justieren Sie **Session Pruning** (`agents.defaults.contextPruning`), um alte Tool-Ausgaben zu trimmen.
    - Verwenden Sie ein Modell mit größerem Kontextfenster.

    Doku: [Kompaktierung](/de/concepts/compaction), [Session Pruning](/de/concepts/session-pruning), [Sitzungsverwaltung](/de/concepts/session).

  </Accordion>

  <Accordion title='Warum sehe ich "LLM request rejected: messages.content.tool_use.input field required"?'>
    Dies ist ein Provider-Validierungsfehler: Das Modell hat einen `tool_use`-Block ohne das erforderliche
    `input` ausgegeben. Das bedeutet normalerweise, dass der Sitzungsverlauf veraltet oder beschädigt ist (oft nach langen Threads
    oder einer Tool-/Schema-Änderung).

    Lösung: Starten Sie mit `/new` (eigenständige Nachricht) eine neue Sitzung.

  </Accordion>

  <Accordion title="Warum bekomme ich alle 30 Minuten Heartbeat-Nachrichten?">
    Heartbeats laufen standardmäßig alle **30m** (**1h** bei Verwendung von OAuth-Auth). Passen Sie sie an oder deaktivieren Sie sie:

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

    Wenn `HEARTBEAT.md` existiert, aber effektiv leer ist (nur Leerzeilen und Markdown-
    Überschriften wie `# Heading`), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe zu sparen.
    Wenn die Datei fehlt, läuft der Heartbeat trotzdem und das Modell entscheidet, was zu tun ist.

    Overrides pro Agent verwenden `agents.list[].heartbeat`. Doku: [Heartbeat](/de/gateway/heartbeat).

  </Accordion>

  <Accordion title='Muss ich ein "Bot-Konto" zu einer WhatsApp-Gruppe hinzufügen?'>
    Nein. OpenClaw läuft auf **Ihrem eigenen Konto**, also kann OpenClaw die Gruppe sehen, wenn Sie darin sind.
    Standardmäßig sind Gruppenantworten blockiert, bis Sie Absender erlauben (`groupPolicy: "allowlist"`).

    Wenn Sie möchten, dass nur **Sie** Gruppenantworten auslösen können:

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
    Option 1 (am schnellsten): Verfolgen Sie Logs und senden Sie eine Testnachricht in die Gruppe:

    ```bash
    openclaw logs --follow --json
    ```

    Suchen Sie nach `chatId` (oder `from`), das auf `@g.us` endet, zum Beispiel:
    `1234567890-1234567890@g.us`.

    Option 2 (wenn bereits konfiguriert/auf der Allowlist): Gruppen aus der Konfiguration auflisten:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Doku: [WhatsApp](/de/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Warum antwortet OpenClaw nicht in einer Gruppe?">
    Zwei häufige Ursachen:

    - Mention-Gating ist aktiv (Standard). Sie müssen den Bot mit @ erwähnen (oder `mentionPatterns` treffen).
    - Sie haben `channels.whatsapp.groups` ohne `"*"` konfiguriert und die Gruppe steht nicht auf der Allowlist.

    Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).

  </Accordion>

  <Accordion title="Teilen Gruppen/Threads Kontext mit DMs?">
    Direkt-Chats kollabieren standardmäßig zur Hauptsitzung. Gruppen/Kanäle haben ihre eigenen Sitzungsschlüssel, und Telegram-Themen / Discord-Threads sind getrennte Sitzungen. Siehe [Gruppen](/de/channels/groups) und [Gruppennachrichten](/de/channels/group-messages).
  </Accordion>

  <Accordion title="Wie viele Workspaces und Agents kann ich erstellen?">
    Keine harten Grenzen. Dutzende (sogar Hunderte) sind in Ordnung, aber achten Sie auf:

    - **Speicherwachstum:** Sitzungen + Transkripte liegen unter `~/.openclaw/agents/<agentId>/sessions/`.
    - **Token-Kosten:** mehr Agents bedeuten mehr gleichzeitige Modellnutzung.
    - **Ops-Overhead:** Auth-Profile, Workspaces und Kanal-Routing pro Agent.

    Tipps:

    - Behalten Sie einen **aktiven** Workspace pro Agent (`agents.defaults.workspace`).
    - Bereinigen Sie alte Sitzungen (löschen Sie JSONL- oder Store-Einträge), wenn der Speicher wächst.
    - Verwenden Sie `openclaw doctor`, um verstreute Workspaces und Profil-Mismatches zu finden.

  </Accordion>

  <Accordion title="Kann ich mehrere Bots oder Chats gleichzeitig ausführen (Slack), und wie sollte ich das einrichten?">
    Ja. Verwenden Sie **Multi-Agent-Routing**, um mehrere isolierte Agents auszuführen und eingehende Nachrichten nach
    Kanal/Konto/Peer zu routen. Slack wird als Kanal unterstützt und kann an bestimmte Agents gebunden werden.

    Browser-Zugriff ist mächtig, aber nicht „alles tun, was ein Mensch kann“ - Anti-Bot, CAPTCHAs und MFA können
    Automatisierung weiterhin blockieren. Für die zuverlässigste Browser-Steuerung verwenden Sie lokales Chrome MCP auf dem Host,
    oder verwenden Sie CDP auf der Maschine, die den Browser tatsächlich ausführt.

    Best-Practice-Setup:

    - Always-on-Gateway-Host (VPS/Mac mini).
    - Ein Agent pro Rolle (Bindings).
    - Slack-Kanal/Kanäle an diese Agents gebunden.
    - Lokaler Browser über Chrome MCP oder einen Node, wenn nötig.

    Doku: [Multi-Agent-Routing](/de/concepts/multi-agent), [Slack](/de/channels/slack),
    [Browser](/de/tools/browser), [Nodes](/de/nodes).

  </Accordion>
</AccordionGroup>

## Modelle: Standards, Auswahl, Aliasse, Umschalten

<AccordionGroup>
  <Accordion title='Was ist das "Standardmodell"?'>
    Das Standardmodell von OpenClaw ist das, was Sie setzen als:

    ```
    agents.defaults.model.primary
    ```

    Modelle werden als `provider/model` referenziert (Beispiel: `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID und greift erst danach als veralteten Kompatibilitätspfad auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider/Modell zurück, statt einen veralteten entfernten Standard-Provider anzuzeigen. Sie sollten trotzdem **explizit** `provider/model` setzen.

  </Accordion>

  <Accordion title="Welches Modell empfehlen Sie?">
    **Empfohlener Standard:** Verwenden Sie das stärkste Modell der neuesten Generation, das in Ihrem Provider-Stack verfügbar ist.
    **Für toolaktivierte oder Agents mit nicht vertrauenswürdiger Eingabe:** Priorisieren Sie Modellstärke vor Kosten.
    **Für Routine-/Low-Stakes-Chat:** Verwenden Sie günstigere Fallback-Modelle und routen Sie nach Agent-Rolle.

    MiniMax hat eigene Doku: [MiniMax](/de/providers/minimax) und
    [Lokale Modelle](/de/gateway/local-models).

    Faustregel: Verwenden Sie für hochwichtige Arbeit das **beste Modell, das Sie sich leisten können**, und ein günstigeres
    Modell für Routine-Chat oder Zusammenfassungen. Sie können Modelle pro Agent routen und Sub-Agents verwenden, um
    lange Aufgaben zu parallelisieren (jeder Sub-Agent verbraucht Tokens). Siehe [Modelle](/de/concepts/models) und
    [Sub-Agents](/de/tools/subagents).

    Deutliche Warnung: Schwächere/übermäßig quantisierte Modelle sind anfälliger für Prompt-
    Injection und unsicheres Verhalten. Siehe [Sicherheit](/de/gateway/security).

    Mehr Kontext: [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Wie schalte ich Modelle um, ohne meine Konfiguration zu löschen?">
    Verwenden Sie **Modell-Befehle** oder bearbeiten Sie nur die **Modell**-Felder. Vermeiden Sie vollständiges Ersetzen der Konfiguration.

    Sichere Optionen:

    - `/model` im Chat (schnell, pro Sitzung)
    - `openclaw models set ...` (aktualisiert nur die Modellkonfiguration)
    - `openclaw configure --section model` (interaktiv)
    - bearbeiten Sie `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Vermeiden Sie `config.apply` mit einem partiellen Objekt, es sei denn, Sie möchten die gesamte Konfiguration ersetzen.
    Für RPC-Bearbeitungen zuerst mit `config.schema.lookup` prüfen und `config.patch` bevorzugen. Die Lookup-Nutzlast gibt Ihnen den normalisierten Pfad, flache Schema-Doku/Einschränkungen und Zusammenfassungen der direkten Kinder
    für partielle Aktualisierungen.
    Wenn Sie die Konfiguration überschrieben haben, stellen Sie sie aus einem Backup wieder her oder führen Sie `openclaw doctor` erneut aus, um sie zu reparieren.

    Doku: [Modelle](/de/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/de/gateway/doctor).

  </Accordion>

  <Accordion title="Kann ich selbst gehostete Modelle verwenden (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama ist der einfachste Weg für lokale Modelle.

    Schnellste Einrichtung:

    1. Installieren Sie Ollama von `https://ollama.com/download`
    2. Ziehen Sie ein lokales Modell wie `ollama pull glm-4.7-flash`
    3. Wenn Sie auch Cloud-Modelle möchten, führen Sie `ollama signin` aus
    4. Führen Sie `openclaw onboard` aus und wählen Sie `Ollama`
    5. Wählen Sie `Local` oder `Cloud + Local`

    Hinweise:

    - `Cloud + Local` gibt Ihnen Cloud-Modelle plus Ihre lokalen Ollama-Modelle
    - Cloud-Modelle wie `kimi-k2.5:cloud` benötigen keinen lokalen Pull
    - für manuelles Umschalten verwenden Sie `openclaw models list` und `openclaw models set ollama/<model>`

    Sicherheitshinweis: Kleinere oder stark quantisierte Modelle sind anfälliger für Prompt-
    Injection. Wir empfehlen nachdrücklich **große Modelle** für jeden Bot, der Tools verwenden kann.
    Wenn Sie trotzdem kleine Modelle möchten, aktivieren Sie Sandboxing und strikte Tool-Allowlists.

    Doku: [Ollama](/de/providers/ollama), [Lokale Modelle](/de/gateway/local-models),
    [Modell-Provider](/de/concepts/model-providers), [Sicherheit](/de/gateway/security),
    [Sandboxing](/de/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welche Modelle verwenden OpenClaw, Flawd und Krill?">
    - Diese Deployments können sich unterscheiden und sich im Laufe der Zeit ändern; es gibt keine feste Provider-Empfehlung.
    - Prüfen Sie die aktuelle Laufzeiteinstellung auf jedem Gateway mit `openclaw models status`.
    - Für sicherheitskritische/toolaktivierte Agents verwenden Sie das stärkste Modell der neuesten Generation, das verfügbar ist.
  </Accordion>

  <Accordion title="Wie wechsle ich Modelle on the fly (ohne Neustart)?">
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

    Dies sind die eingebauten Aliasse. Eigene Aliasse können über `agents.defaults.models` hinzugefügt werden.

    Verfügbare Modelle können Sie mit `/model`, `/model list` oder `/model status` auflisten.

    `/model` (und `/model list`) zeigt einen kompakten nummerierten Picker. Auswahl per Nummer:

    ```
    /model 3
    ```

    Sie können auch ein bestimmtes Auth-Profil für den Provider erzwingen (pro Sitzung):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tipp: `/model status` zeigt, welcher Agent aktiv ist, welche Datei `auth-profiles.json` verwendet wird und welches Auth-Profil als Nächstes versucht wird.
    Es zeigt auch den konfigurierten Provider-Endpunkt (`baseUrl`) und den API-Modus (`api`), wenn verfügbar.

    **Wie löse ich ein Profil, das ich mit @profile gesetzt habe?**

    Führen Sie `/model` erneut **ohne** das Suffix `@profile` aus:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Wenn Sie zum Standard zurückkehren möchten, wählen Sie ihn in `/model` aus (oder senden Sie `/model <default provider/model>`).
    Verwenden Sie `/model status`, um zu bestätigen, welches Auth-Profil aktiv ist.

  </Accordion>

  <Accordion title="Kann ich GPT 5.2 für tägliche Aufgaben und Codex 5.3 für Coding verwenden?">
    Ja. Setzen Sie eines als Standard und wechseln Sie bei Bedarf:

    - **Schneller Wechsel (pro Sitzung):** `/model gpt-5.4` für tägliche Aufgaben, `/model openai-codex/gpt-5.4` für Coding mit Codex OAuth.
    - **Standard + Wechsel:** Setzen Sie `agents.defaults.model.primary` auf `openai/gpt-5.4` und wechseln Sie dann beim Coding zu `openai-codex/gpt-5.4` (oder umgekehrt).
    - **Sub-Agents:** Leiten Sie Coding-Aufgaben an Sub-Agents mit einem anderen Standardmodell weiter.

    Siehe [Modelle](/de/concepts/models) und [Slash-Befehle](/de/tools/slash-commands).

  </Accordion>

  <Accordion title="Wie konfiguriere ich den Fast Mode für GPT 5.4?">
    Verwenden Sie entweder einen Sitzungs-Schalter oder einen Standard in der Konfiguration:

    - **Pro Sitzung:** Senden Sie `/fast on`, während die Sitzung `openai/gpt-5.4` oder `openai-codex/gpt-5.4` verwendet.
    - **Standard pro Modell:** Setzen Sie `agents.defaults.models["openai/gpt-5.4"].params.fastMode` auf `true`.
    - **Auch für Codex OAuth:** Wenn Sie zusätzlich `openai-codex/gpt-5.4` verwenden, setzen Sie dort dasselbe Flag.

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

    Für OpenAI wird Fast Mode auf unterstützten nativen Responses-Anfragen auf `service_tier = "priority"` abgebildet. Sitzung `/fast` überschreibt Standards aus der Konfiguration.

    Siehe [Thinking and fast mode](/de/tools/thinking) und [OpenAI fast mode](/de/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Warum sehe ich "Model ... is not allowed" und dann keine Antwort?'>
    Wenn `agents.defaults.models` gesetzt ist, wird es zur **Allowlist** für `/model` und alle
    Sitzungs-Overrides. Die Auswahl eines Modells, das nicht in dieser Liste steht, gibt zurück:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Dieser Fehler wird **anstelle** einer normalen Antwort zurückgegeben. Lösung: Fügen Sie das Modell zu
    `agents.defaults.models` hinzu, entfernen Sie die Allowlist oder wählen Sie ein Modell aus `/model list`.

  </Accordion>

  <Accordion title='Warum sehe ich "Unknown model: minimax/MiniMax-M2.7"?'>
    Das bedeutet, dass der **Provider nicht konfiguriert** ist (es wurde keine MiniMax-Provider-Konfiguration oder kein Auth-
    Profil gefunden), daher kann das Modell nicht aufgelöst werden.

    Checkliste zur Behebung:

    1. Aktualisieren Sie auf eine aktuelle OpenClaw-Version (oder führen Sie den Source-Branch `main` aus) und starten Sie dann das Gateway neu.
    2. Stellen Sie sicher, dass MiniMax konfiguriert ist (Assistent oder JSON) oder dass MiniMax-Auth
       in env/Auth-Profilen vorhanden ist, damit der passende Provider injiziert werden kann
       (`MINIMAX_API_KEY` für `minimax`, `MINIMAX_OAUTH_TOKEN` oder gespeichertes MiniMax-
       OAuth für `minimax-portal`).
    3. Verwenden Sie die exakte Modell-ID (groß-/kleinschreibungssensitiv) für Ihren Auth-Pfad:
       `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed` für die API-Schlüssel-
       Einrichtung oder `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` für die OAuth-Einrichtung.
    4. Führen Sie aus:

       ```bash
       openclaw models list
       ```

       und wählen Sie aus der Liste (oder `/model list` im Chat).

    Siehe [MiniMax](/de/providers/minimax) und [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich MiniMax als Standard und OpenAI für komplexe Aufgaben verwenden?">
    Ja. Verwenden Sie **MiniMax als Standard** und wechseln Sie **pro Sitzung** bei Bedarf die Modelle.
    Fallbacks sind für **Fehler**, nicht für „schwere Aufgaben“, also verwenden Sie `/model` oder einen separaten Agenten.

    **Option A: pro Sitzung umschalten**

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

    **Option B: separate Agents**

    - Agent A Standard: MiniMax
    - Agent B Standard: OpenAI
    - Nach Agent routen oder `/agent` zum Wechseln verwenden

    Doku: [Modelle](/de/concepts/models), [Multi-Agent-Routing](/de/concepts/multi-agent), [MiniMax](/de/providers/minimax), [OpenAI](/de/providers/openai).

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
    Aliasse stammen aus `agents.defaults.models.<modelId>.alias`. Beispiel:

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

  <Accordion title="Wie füge ich Modelle anderer Provider wie OpenRouter oder Z.AI hinzu?">
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

    Wenn Sie ein Provider/Modell referenzieren, aber der erforderliche Provider-Schlüssel fehlt, erhalten Sie einen Laufzeit-Auth-Fehler (z. B. `No API key found for provider "zai"`).

    **No API key found for provider nach dem Hinzufügen eines neuen Agenten**

    Das bedeutet normalerweise, dass der **neue Agent** einen leeren Auth-Store hat. Auth ist pro Agent und
    gespeichert in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Optionen zur Behebung:

    - Führen Sie `openclaw agents add <id>` aus und konfigurieren Sie Auth während des Assistenten.
    - Oder kopieren Sie `auth-profiles.json` aus dem `agentDir` des Haupt-Agenten in das `agentDir` des neuen Agenten.

    Verwenden Sie `agentDir` **nicht** über mehrere Agents hinweg wieder; das verursacht Auth-/Sitzungskollisionen.

  </Accordion>
</AccordionGroup>

## Modell-Failover und "All models failed"

<AccordionGroup>
  <Accordion title="Wie funktioniert Failover?">
    Failover geschieht in zwei Stufen:

    1. **Rotation des Auth-Profils** innerhalb desselben Providers.
    2. **Modell-Fallback** auf das nächste Modell in `agents.defaults.model.fallbacks`.

    Für fehlerhafte Profile gelten Cooldowns (exponentielles Backoff), sodass OpenClaw weiter antworten kann, auch wenn ein Provider rate-limitiert ist oder vorübergehend ausfällt.

    Der Rate-Limit-Bucket umfasst mehr als nur einfache `429`-Antworten. OpenClaw
    behandelt auch Meldungen wie `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` und periodische
    Nutzungsfenster-Limits (`weekly/monthly limit reached`) als für Failover geeignete
    Rate Limits.

    Einige nach Abrechnung aussehende Antworten sind kein `402`, und einige HTTP-`402`-
    Antworten bleiben ebenfalls in diesem transienten Bucket. Wenn ein Provider
    expliziten Billing-Text auf `401` oder `403` zurückgibt, kann OpenClaw das weiterhin im
    Billing-Pfad halten, aber provider-spezifische Text-Matcher bleiben auf den
    Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter `Key limit exceeded`). Wenn eine `402`-
    Meldung stattdessen wie ein wiederholbares Nutzungsfenster oder
    ein Spend-Limit einer Organisation/eines Workspace aussieht (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw sie als
    `rate_limit`, nicht als lange Billing-Deaktivierung.

    Kontextüberlauf-Fehler sind anders: Signaturen wie
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oder `ollama error: context length
    exceeded` bleiben im Pfad für Kompaktierung/Wiederholung, statt den Modell-
    Fallback voranzutreiben.

    Generischer Server-Fehlertext ist absichtlich enger gefasst als „alles mit
    unknown/error darin“. OpenClaw behandelt provider-spezifische transiente Formen
    wie Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, Stop-Reason-Fehler wie `Unhandled stop reason:
    error`, JSON-`api_error`-Payload