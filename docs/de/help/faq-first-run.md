---
read_when:
    - Neue Installation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Zugriff auf docs.openclaw.ai nicht möglich, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-05-02T22:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1205a046617c5d25ca1b180fca1a34fe0a5e7d0fc6a820ef44ebba4d723236f5
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen und Antworten zum ersten Start. Informationen zu alltäglichen Vorgängen, Modellen, Authentifizierung, Sitzungen
  und Fehlerbehebung finden Sie in der Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter, schnellster Weg, wieder voranzukommen">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihre Maschine sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich komme nicht weiter“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht einsehen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und dabei helfen, Ihre maschinenbezogene
    Einrichtung zu reparieren (PATH, Dienste, Berechtigungen, Authentifizierungsdateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (git) Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent Code und Dokumentation lesen und
    über die exakte Version nachdenken kann, die Sie ausführen. Sie können später jederzeit wieder auf Stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu überwachen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter zu prüfen.

    Wenn Sie einen echten Bug oder eine Korrektur finden, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schneller Überblick über Gateway-/Agent-Zustand und Basiskonfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung und Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Erste 60 Sekunden, wenn etwas defekt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Aktivstundenfensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres bzw. nur Header-Gerüst
    - `no-tasks-due`: `HEARTBEAT.md`-Aufgabenmodus ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden fällige Zeitstempel erst vorgerückt, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung und Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlener Weg, OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Source zu starten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann auch UI-Assets automatisch bauen. Nach dem Onboarding führen Sie den Gateway typischerweise auf Port **18789** aus.

    Aus dem Source (Mitwirkende/Entwicklung):

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

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost gegenüber remote?">
    **Localhost (dieselbe Maschine):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Control-UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): behalten Sie bind loopback bei, führen Sie `openclaw gateway --tailscale serve` aus, öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identitäts-Header die Control-UI-/WebSocket-Authentifizierung (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs verlangen weiterhin Shared-Secret-Authentifizierung, sofern Sie nicht absichtlich private-ingress `none` oder trusted-proxy-HTTP-Authentifizierung verwenden.
      Fehlgeschlagene gleichzeitige Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bind**: führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/`, und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: lassen Sie den Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"`, und öffnen Sie dann die Proxy-URL. Same-host loopback-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie das konfigurierte Token oder Passwort ein, wenn Sie dazu aufgefordert werden.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Approval-Konfigurationen für Chat-Approvals?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Approval-Aufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Approval-Client für Exec-Approvals agieren

    Die Host-Exec-Richtlinie bleibt weiterhin das eigentliche Approval-Gate. Die Chat-Konfiguration steuert nur, wo Approval-
    Aufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Approver sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-zuerst-native Approvals, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Approval-Karten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Approvals nicht verfügbar sind oder manuelles Approval der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie Approval-Aufforderungen ausdrücklich zurück in den ursprünglichen Raum/das ursprüngliche Thema posten möchten.
    - Plugin-Approvals sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten zusätzlich plugin-approval-native-Verarbeitung bei.

    Kurzfassung: Weiterleitung ist für Routing, native Client-Konfiguration ist für reichhaltigere kanalspezifische UX.
    Siehe [Exec-Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeitumgebung brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Der Gateway ist schlank - die Dokumentation nennt **512MB-1GB RAM**, **1 Kern** und etwa **500MB**
    Speicherplatz als ausreichend für persönliche Nutzung und merkt an, dass ein **Raspberry Pi 4 ihn ausführen kann**.

    Wenn Sie zusätzlichen Spielraum wünschen (Logs, Medien, andere Dienste), werden **2GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann den Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git) Installation**, damit Sie Logs einsehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills, und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was jetzt?">
    Dieser Bildschirm hängt davon ab, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    beim ersten Schlüpfen automatisch „Wake up, my friend!“. Wenn Sie diese Zeile **ohne Antwort** sehen
    und die Token bei 0 bleiben, wurde der Agent nie ausgeführt.

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

    Wenn der Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und die UI
    auf den richtigen Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf eine neue Maschine (Mac mini) migrieren, ohne das Onboarding erneut zu machen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Workspace**, und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „exakt gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Kanalzustand), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf der neuen Maschine.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) von der alten Maschine.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Das bewahrt Konfiguration, Authentifizierungsprofile, WhatsApp-Credentials, Sitzungen und Memory. Wenn Sie sich im
    Remote-Modus befinden, beachten Sie, dass der Gateway-Host den Sitzungsspeicher und Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace nach GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](/de/help/faq#where-things-live-on-disk),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die neueste ausgelieferte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Dokumentation/weitere Abschnitte bei Bedarf).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist, und versuchen Sie es dann erneut.
    Bitte helfen Sie uns, die Sperre aufzuheben, indem Sie hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Dokumente auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stabiler Version und Beta">
    **Stabil** und **Beta** sind **npm-Dist-Tags**, keine getrennten Codezweige:

    - `latest` = stabil
    - `beta` = früher Build zum Testen

    Normalerweise landet ein stabiler Release zuerst auf **beta**, danach verschiebt ein expliziter
    Veröffentlichungsschritt dieselbe Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können Beta und stabile Version nach der
    Veröffentlichung auf dieselbe **Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen Beta und Dev finden Sie im Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version, und was ist der Unterschied zwischen Beta und Dev?">
    **Beta** ist der npm-Dist-Tag `beta` (kann nach der Veröffentlichung `latest` entsprechen).
    **Dev** ist der bewegliche Kopf von `main` (git); bei Veröffentlichung verwendet er den npm-Dist-Tag `dev`.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Weitere Details: [Entwicklungskanäle](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich den neuesten Stand aus?">
    Zwei Optionen:

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wird zum Branch `main` gewechselt und aus dem Quellcode aktualisiert.

    2. **Bearbeitbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Damit erhalten Sie ein lokales Repository, das Sie bearbeiten und anschließend per git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone erstellen möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Aktualisieren](/de/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installieren](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, je nachdem, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängen bleibt, nutzen Sie [Installer hängt](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich komme nicht weiter](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie erhalte ich mehr Rückmeldung?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine bearbeitbare (git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows-Entsprechung (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Windows-Installation meldet, dass git nicht gefunden wurde oder openclaw nicht erkannt wird">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH liegt.
    - Schließen und öffnen Sie PowerShell erneut, und führen Sie dann den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-Bin-Ordner liegt nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach dem Aktualisieren des PATH erneut.

    Wenn Sie die reibungsloseste Windows-Einrichtung möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt unleserlichen chinesischen Text - was soll ich tun?">
    Dies ist auf nativen Windows-Shells normalerweise ein Konflikt mit der Konsolencodepage.

    Symptome:

    - `system.run`-/`exec`-Ausgabe zeigt Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Umgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie anschließend den Gateway neu und wiederholen Sie Ihren Befehl:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies mit dem neuesten OpenClaw weiterhin reproduzieren können, verfolgen/melden Sie es hier:

    - [Problem #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Nutzen Sie die **bearbeitbare (git-)Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellweg + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation und Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server, und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

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
    liegen auf dem Server, behandeln Sie den Host also als maßgebliche Quelle und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während der
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remotezugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), kann einen sauberen Git-Checkout benötigen und
    kann eine Bestätigung abfragen. Sicherer: Führen Sie Updates als Operator aus einer Shell aus.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie von einem Agenten automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Aktualisieren](/de/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungspfad. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Health Checks** und Auswahl von **Skills**

    Es warnt auch, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Benötige ich ein Claude- oder OpenAI-Abonnement, um dies auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten zur Authentifizierung bei diesen Providern.

    Für Anthropic in OpenClaw gilt praktisch folgende Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeitende
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    besser vorhersagbare Einrichtung. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt auch andere gehostete abonnementartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass Claude CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` für diese Integration
    als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die am besten vorhersagbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration
    als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, sofern verfügbar.
    Für Produktions- oder Mehrbenutzer-Workloads ist Auth über Anthropic-API-Schlüssel weiterhin die
    sicherere, besser vorhersagbare Wahl. Wenn Sie andere abonnementartige gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Rate Limit** für das aktuelle Zeitfenster erschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Tarif. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung genau lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Kontext-Beta von Anthropic zu verwenden (`context1m: true`). Das funktioniert nur, wenn Ihre
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming/Text-Bedrock-Katalog automatisch erkennen und ihn als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Ablauf bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Auth?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` mit `agentRuntime.id: "codex"` für die übliche Einrichtung:
    ChatGPT/Codex-Abonnement-Auth plus native Codex-App-Server-Ausführung. Verwenden Sie
    `openai-codex/gpt-5.5` nur, wenn Sie Codex OAuth über den standardmäßigen
    PI-Runner möchten. Verwenden Sie `openai/gpt-5.5` ohne Codex-Runtime-Override für
    direkten OpenAI-API-Key-Zugriff.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin openai-codex?">
    `openai-codex` ist die Provider- und Auth-Profil-ID für ChatGPT/Codex OAuth.
    Es ist außerdem das explizite PI-Modellpräfix für Codex OAuth:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = ChatGPT/Codex-Abonnement-Auth mit nativer Codex-Runtime
    - `openai-codex/gpt-5.5` = Codex-OAuth-Route in PI
    - `openai/gpt-5.5` ohne Codex-Runtime-Override = direkte OpenAI-API-Key-Route in PI
    - `openai-codex:...` = Auth-Profil-ID, keine Modellreferenz

    Wenn Sie den direkten OpenAI-Platform-Abrechnungs-/Limit-Pfad möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT/Codex-Abonnement-Auth möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an. Für die native Codex-
    Runtime behalten Sie die Modellreferenz als `openai/gpt-5.5` bei und setzen
    `agentRuntime.id: "codex"`. Verwenden Sie `openai-codex/*`-Modellreferenzen nur für PI-
    Läufe.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    Codex OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der ChatGPT-Website/App-Erfahrung unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert jedoch keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchten, verwenden Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Auth (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Subscription OAuth** vollständig.
    OpenAI erlaubt Abonnement-OAuth-Nutzung in externen Tools/Workflows wie
    OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Ablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Melden Sie sich an: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Token in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für zwanglose Chats in Ordnung?">
    In der Regel nein. OpenClaw benötigt großen Kontext und starke Sicherheit; kleine Karten kürzen und leaken. Wenn es sein muss, führen Sie den **größten** Modell-Build aus, den Sie lokal ausführen können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie regional gebundene Endpunkte. OpenRouter stellt in den USA gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während der von Ihnen gewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche kaufen
    einen als Always-on-Host, aber ein kleiner VPS, Home-Server oder eine Raspberry-Pi-Klasse-Box funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für macOS-exklusive Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) - der BlueBubbles-Server läuft auf jedem Mac, und der Gateway kann unter Linux oder anderswo laufen. Wenn Sie andere macOS-exklusive Tools möchten, führen Sie den Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage - der BlueBubbles-Server läuft auf macOS, während der Gateway unter Linux oder anderswo laufen kann.

    Gängige Setups:

    - Führen Sie den Gateway auf Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der bei Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie die einfachste Einzelmaschinen-Einrichtung möchten.

    Docs: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann den Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen den Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Gängiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn zu sehen.

    Docs: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Runtime-Fehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie dies auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Die Einrichtung fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits ältere `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM, führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM, rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie eine DM an `@userinfobot` oder `@getidsbot`.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffssteuerung (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist pro WhatsApp-Konto global. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast Chat“-Agent und einen „Opus for coding“-Agent ausführen?'>
    Ja. Verwenden Sie Multi-Agent Routing: Geben Sie jedem Agent sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an den jeweiligen Agent. Eine Beispielkonfiguration finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
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
    Neuere Builds stellen außerdem gängige Benutzer-bin-Verzeichnisse bei Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm-Installation">
    - **Hackbare (Git-)Installation:** vollständiger Source-Checkout, editierbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Docs patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen aus npm-Dist-Tags.

    Docs: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dies **löscht Ihre Daten nicht** - es ändert nur die OpenClaw-Code-Installation.
    Ihr Status (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu Git:

    ```bash
    openclaw update --channel dev
    ```

    Von Git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zuerst in der Vorschau zu sehen. Der Updater führt
    Doctor-Follow-ups aus, aktualisiert Plugin-Quellen für den Ziel-Channel und
    startet den Gateway neu, sofern Sie nicht `--no-restart` übergeben.

    Der Installer kann ebenfalls einen der beiden Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich den Gateway auf meinem Laptop oder einem VPS ausführen?">
    Kurzantwort: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung möchten und Schlafmodus/Neustarts für Sie in Ordnung sind, führen Sie ihn lokal aus.

    **Laptop (lokaler Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, Live-Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkausfälle = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** dauerhaft aktiv, stabiles Netzwerk, keine Probleme durch Laptop-Ruhezustand, einfacher dauerhaft zu betreiben.
    - **Nachteile:** läuft oft headless (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen Updates per SSH durchführen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Abwägungspunkt ist **Headless-Browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist hervorragend, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit einem sichtbaren Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** dauerhaft aktiv, weniger Unterbrechungen durch Ruhezustand/Neustarts, klarere Berechtigungen, einfacher dauerhaft zu betreiben.
    - **Geteilter Laptop/Desktop:** völlig in Ordnung für Tests und aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner in den Ruhezustand wechselt oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, behalten Sie das Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitshinweise finden Sie unter [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und welches OS wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein einfaches Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr für Reserven (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenintensiv sein.

    OS: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gelten?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss dauerhaft aktiv, erreichbar sein und genug
    RAM für das Gateway und alle Kanäle haben, die Sie aktivieren.

    Grundlegende Richtwerte:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medien-Tools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 die einfachste VM-artige Einrichtung** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
