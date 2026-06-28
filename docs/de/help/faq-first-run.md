---
read_when:
    - Neuinstallation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard kann nicht geöffnet werden, Installation hängt
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-06-28T20:42:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen und Antworten zum ersten Start. Für den Alltagsbetrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter, der schnellste Weg zur Lösung">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihre Maschine sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich komme nicht weiter“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    Helfer aus der Ferne nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Werkzeuge können das Repository lesen, Befehle ausführen, Logs prüfen und helfen, Ihre maschinenbezogene
    Einrichtung zu reparieren (PATH, Dienste, Berechtigungen, Authentifizierungsdateien). Geben Sie ihnen den **vollständigen Quellcode-Checkout** über
    die hackbare (git) Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent Code und Dokumentation lesen und
    über die exakte Version nachdenken kann, die Sie ausführen. Sie können später jederzeit zurück zur stabilen Version wechseln,
    indem Sie den Installer erneut ohne `--install-method git` ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu überwachen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Fehler oder eine Korrektur entdecken, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schnelle Übersicht über Gateway-/Agent-Zustand und Basiskonfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung und Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Statusprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Aktivzeitenfensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen, Kommentare, Überschriften, Code-Fences oder leere Checklisten-Gerüste
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: Die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeits-Zeitstempel erst fortgeschrieben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen wurde. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Empfohlener Weg, OpenClaw zu installieren und einzurichten">
    Das Repository empfiehlt, aus dem Quellcode zu starten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie den Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (Beitragende/Entwicklung):

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
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; falls er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf derselben Maschine und fügen Sie sie ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (dieselbe Maschine):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Control-UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie Bindung an loopback bei, führen Sie `openclaw gateway --tailscale serve` aus, öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identity-Header die Control-UI-/WebSocket-Authentifizierung (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs benötigen weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst private-ingress `none` oder trusted-proxy-HTTP-Authentifizierung.
      Fehlgeschlagene gleichzeitige Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite fehlerhafte erneute Versuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identity-aware Reverse Proxy**: Betreiben Sie den Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL. Same-Host-loopback-Proxys benötigen explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie das konfigurierte Token oder Passwort ein, wenn Sie dazu aufgefordert werden.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Approval-Konfigurationen für Chat-Approvals?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Approval-Aufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Approval-Client für Exec-Approvals agieren

    Die Host-Exec-Policy ist weiterhin das eigentliche Approval-Gate. Die Chat-Konfiguration steuert nur, wo Approval-
    Aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Approver sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first native Approvals, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Approval-Karten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Approvals nicht verfügbar sind oder manuelle Approval der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Approval-Aufforderungen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Approvals sind wieder separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten zusätzlich native Behandlung für Plugin-Approvals bei.

    Kurzfassung: Forwarding dient dem Routing, native Client-Konfiguration der reichhaltigeren kanalspezifischen UX.
    Siehe [Exec-Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Der Gateway ist leichtgewichtig - die Dokumentation nennt **512 MB bis 1 GB RAM**, **1 Core** und etwa **500 MB**
    Speicherplatz als ausreichend für persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 ihn ausführen kann**.

    Wenn Sie zusätzlichen Spielraum wünschen (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Raspberry Pi/VPS kann den Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon für
    lokale Bildschirm-/Kamera-/Canvas- oder Befehlsausführung koppeln. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-bit** OS und behalten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git) Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf merkwürdige Binärprobleme stoßen, ist es meistens ein Problem mit **ARM-Kompatibilität**.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    beim ersten Hatch automatisch „Wake up, my friend!“. Wenn Sie diese Zeile mit **keiner Antwort** sehen
    und Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

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

    3. Wenn es weiterhin hängt, führen Sie aus:

    ```bash
    openclaw doctor
    ```

    Wenn der Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf den richtigen Gateway zeigt. Siehe [Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf eine neue Maschine (Mac mini) migrieren, ohne das Onboarding zu wiederholen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Arbeitsbereich**, und führen Sie dann Doctor einmal aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Speicher, Sitzungsverlauf, Authentifizierung und Kanalstatus), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf der neuen Maschine.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) von der alten Maschine.
    3. Kopieren Sie Ihren Arbeitsbereich (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Das erhält Konfiguration, Authentifizierungsprofile, WhatsApp-Zugangsdaten, Sitzungen und Speicher. Wenn Sie im
    Remote-Modus sind, beachten Sie, dass der Gateway-Host den Sitzungsspeicher und Arbeitsbereich besitzt.

    **Wichtig:** Wenn Sie nur Ihren Arbeitsbereich nach GitHub committen/pushen, sichern Sie
    **Speicher + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf dem Datenträger liegen](/de/help/faq#where-things-live-on-disk),
    [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die neueste ausgelieferte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Dokumentations-/andere Abschnitte bei Bedarf).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, werden die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine separaten Code-Zweige:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet ein Stable-Release zuerst auf **beta**; anschließend verschiebt ein expliziter
    Promotion-Schritt dieselbe Version nach `latest`. Maintainer können bei Bedarf auch
    direkt auf `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Einzeilige Installationsbefehle und den Unterschied zwischen beta und dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist der npm-dist-tag `beta` (kann nach der Promotion `latest` entsprechen).
    **Dev** ist der bewegliche Stand von `main` (git); wenn er veröffentlicht wird, verwendet er den npm-dist-tag `dev`.

    Einzeilige Befehle (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mehr Details: [Development channels](/de/install/development-channels) und [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich den neuesten Stand aus?">
    Zwei Optionen:

    1. **Dev-Kanal (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dies wechselt zum Branch `main` und aktualisiert aus dem Quellcode.

    2. **Anpassbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und anschließend per git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Klon erstellen möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Update](/de/cli/update), [Development channels](/de/install/development-channels),
    [Install](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **QuickStart-Onboarding:** normalerweise wenige Minuten
    - **Vollständiges Onboarding:** länger, wenn Provider-Anmeldung, Channel-Kopplung, Daemon-Installation,
      Netzwerkdownloads, Skills oder optionale Plugins zusätzliche Einrichtung benötigen

    Der CLI-Assistent zeigt diesen Zeitplan vorab an. Sie können optionale Schritte überspringen und
    später mit `openclaw configure` zurückkehren.

    Wenn es hängen bleibt, verwenden Sie [Installer stuck](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie erhalte ich mehr Feedback?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine anpassbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Äquivalent (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer flags](/de/install/installer).

  </Accordion>

  <Accordion title="Windows-Installation meldet git not found oder openclaw not recognized">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH enthalten ist.
    - Schließen und öffnen Sie PowerShell erneut, und führen Sie dann den Installer noch einmal aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht in PATH enthalten.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` erforderlich; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach der Aktualisierung von PATH erneut.

    Für die Desktop-Einrichtung verwenden Sie die native **Windows Hub**-App. Für eine reine Terminal-
    Einrichtung werden sowohl der PowerShell-Installer als auch WSL2-Gateway-Pfade unterstützt.
    Docs: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Dies ist auf nativen Windows-Shells normalerweise eine Abweichung der Konsolen-Codepage.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Umgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie anschließend den Gateway neu und versuchen Sie den Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies weiterhin mit der neuesten OpenClaw-Version reproduzieren können, verfolgen/melden Sie es unter:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git) Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie anschließend das Onboarding aus.

    - Linux-Schnellweg + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remotezugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Der **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    befinden sich auf dem Server; behandeln Sie den Host daher als Source of Truth und sichern Sie ihn.

    Sie können **Knoten** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokale Bildschirm-/Kamera-/Canvas-Funktionen zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während der
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remotezugriff: [Gateway remote](/de/gateway/remote).
    Knoten: [Knoten](/de/nodes), [Knoten-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, aber nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), kann einen sauberen git-Checkout benötigen und
    kann eine Bestätigung anfordern. Sicherer: Führen Sie Updates als Operator in einer Shell aus.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie von einem Agenten aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Update](/de/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Health Checks** und Auswahl der **Skills**

    Außerdem legt es Dauererwartungen fest, bevor die Hauptaufforderungen beginnen, und warnt, wenn Ihr
    konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnementauthentifizierung in OpenClaw**: Anthropic-Mitarbeiter
      teilten uns mit, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    besser vorhersehbare Einrichtung. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete abonnementähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter teilten uns mit, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnementauthentifizierung und die Nutzung von `claude -p` als genehmigt
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die am besten vorhersehbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnementauthentifizierung (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter teilten uns mit, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt für diese Integration,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Mehrbenutzer-Workloads ist Authentifizierung per Anthropic-API-Schlüssel weiterhin die
    sicherere, besser vorhersehbare Wahl. Wenn Sie andere abonnementähnliche gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster erschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder aktualisieren Sie Ihren Tarif. Wenn Sie
    einen **Anthropic API key** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage, das
    1M-Kontextfenster von Anthropic zu verwenden (ein GA-fähiges 1M-Modell Claude 4.x oder eine Legacy-Konfiguration
    `context1m: true`). Das funktioniert nur, wenn Ihre Anmeldedaten für
    Long-Context-Abrechnung berechtigt sind (API-key-Abrechnung oder der OpenClaw Claude-Login-Pfad
    mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider ratenbegrenzt ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Streaming/Text-Bedrock-Katalog automatisch erkennen und als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` für die übliche Einrichtung: ChatGPT/Codex-Abonnementauthentifizierung plus
    native Codex-App-Server-Ausführung. Legacy-Codex-GPT-Referenzen sind
    Legacy-Konfigurationen, die durch `openclaw doctor --fix` repariert werden. Direkter OpenAI-API-key-Zugriff
    bleibt für OpenAI-API-Oberflächen ohne Agent und für Agent-Modelle
    über ein geordnetes `openai`-API-key-Profil verfügbar.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin das Legacy-Präfix OpenAI Codex?">
    `openai` ist die Provider- und Authentifizierungsprofil-ID für sowohl OpenAI-API-keys als auch
    ChatGPT/Codex-OAuth. In Legacy-Konfigurationen und
    Migrationswarnungen sehen Sie möglicherweise weiterhin das Legacy-Präfix OpenAI Codex.
    Ältere Konfigurationen verwendeten es auch als Modellpräfix:

    - `openai/gpt-5.5` = ChatGPT/Codex-Abonnementauthentifizierung mit nativer Codex-Laufzeit für Agent-Turns
    - Legacy-Codex-GPT-5.5-Referenz = Legacy-Modellroute, die durch `openclaw doctor --fix` repariert wird
    - `openai/gpt-5.5` plus ein geordnetes `openai`-API-key-Profil = API-key-Authentifizierung für ein OpenAI-Agent-Modell
    - Legacy-Codex-Authentifizierungsprofil-IDs = Legacy-Authentifizierungsprofil-ID, die durch `openclaw doctor --fix` migriert wird

    Wenn Sie den direkten Abrechnungs-/Limitpfad der OpenAI Platform möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT/Codex-Abonnementauthentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai` an. Behalten Sie die Modellreferenz als
    `openai/gpt-5.5`; Legacy-Codex-Modellreferenzen sind Legacy-Konfigurationen, die
    `openclaw doctor --fix` umschreibt.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT im Web unterscheiden?">
    Codex-OAuth verwendet von OpenAI verwaltete, tarifabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der Erfahrung auf der ChatGPT-Website/App unterscheiden, auch wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine ChatGPT-Web-
    Berechtigungen in direkten API-Zugriff. Wenn Sie den direkten Abrechnungs-/Limitpfad der OpenAI Platform
    möchten, verwenden Sie `openai/*` mit einem API key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnementauthentifizierung (Codex-OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) subscription OAuth** vollständig.
    OpenAI erlaubt die Nutzung von subscription OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Fluss für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsfluss**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn es sein muss, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Hosted-Model-Traffic in einer bestimmten Region?">
    Wählen Sie regional gebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, damit Fallbacks verfügbar bleiben, während der von Ihnen ausgewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche Menschen
    kaufen einen als Always-on-Host, aber ein kleiner VPS, Heimserver oder eine Box der Raspberry Pi-Klasse funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Für iMessage verwenden Sie [iMessage](/de/channels/imessage) mit `imsg` auf einem beliebigen Mac, der bei Messages angemeldet ist. Wenn der Gateway auf Linux oder anderswo läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf diesem Mac ausführt. Wenn Sie andere macOS-only-Tools möchten, führen Sie den Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [iMessage](/de/channels/imessage)** mit `imsg`; der Gateway kann auf diesem Mac laufen oder andernorts mit einem SSH-Wrapper `cliPath`.

    Gängige Setups:

    - Führen Sie den Gateway auf Linux/VPS aus und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf einem bei Messages angemeldeten Mac ausführt.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Single-Machine-Setup möchten.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann den Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen den Gateway nicht aus - sie stellen zusätzliche
    Funktionen wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Gängiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie dies auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Die Einrichtung fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits Legacy-`@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM, führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM, rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie eine DM an `@userinfobot` oder `@getidsbot`.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Session Store erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "Fast Chat"-Agent und einen "Opus for Coding"-Agent ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agent sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an den jeweiligen Agent. Eine Beispielkonfiguration finden Sie in [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Non-Login-Shells aufgelöst werden.
    Aktuelle Builds stellen außerdem häufige Benutzer-bin-Verzeichnisse bei Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und der npm-Installation">
    - **Hackbare (Git-)Installation:** vollständiger Source-Checkout, bearbeitbar, am besten für Beitragende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen aus npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dies **löscht Ihre Daten nicht** - es ändert nur die OpenClaw-Codeinstallation.
    Ihr Status (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu Git:

    ```bash
    openclaw update --channel dev
    ```

    Von Git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zuerst als Vorschau anzuzeigen. Der Updater führt
    Doctor-Follow-ups aus, aktualisiert Plugin-Quellen für den Zielkanal und
    startet den Gateway neu, sofern Sie nicht `--no-restart` übergeben.

    Der Installer kann ebenfalls einen der beiden Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich den Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurzantwort: **Wenn Sie Zuverlässigkeit rund um die Uhr möchten, verwenden Sie einen VPS**. Wenn Sie
    möglichst wenig Aufwand möchten und Ruhezustand/Neustarts für Sie in Ordnung sind, führen Sie ihn lokal aus.

    **Laptop (lokaler Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, Live-Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkunterbrechungen = Verbindungsabbrüche, Betriebssystem-Updates/Neustarts unterbrechen den Betrieb, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer aktiv, stabiles Netzwerk, keine Probleme durch Laptop-Ruhezustand, leichter dauerhaft in Betrieb zu halten.
    - **Nachteile:** oft headless ausgeführt (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen Updates per SSH durchführen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Kompromiss ist **headless Browser** im Vergleich zu einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardeinstellung:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist ideal, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser wünschen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Raspberry Pi):** immer aktiv, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, leichter dauerhaft in Betrieb zu halten.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig ausreichend zum Testen und für aktive Nutzung, rechnen Sie aber mit Pausen, wenn die Maschine in den Ruhezustand geht oder Updates ausführt.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie den Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitsrichtlinien finden Sie unter [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für einen einfachen Gateway + einen Chatkanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ca. 500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenintensiv sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gelten?">
    Ja. Behandeln Sie eine VM genauso wie einen VPS: Sie muss immer aktiv, erreichbar und mit ausreichend
    RAM für den Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Empfehlungen:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medien-Tools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, nutzen Sie **Windows Hub** für die Desktop-Einrichtung oder WSL2, wenn
    Sie ausdrücklich eine Gateway-VM im Linux-Stil mit breiter Tooling-
    Kompatibilität möchten. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
