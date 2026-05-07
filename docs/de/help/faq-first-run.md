---
read_when:
    - Neue Installation, Onboarding hängt oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Ersteinrichtung — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-05-07T13:18:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Fragen und Antworten zum Schnellstart und ersten Start. Für den täglichen Betrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Ersteinrichtung

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter, der schnellste Weg zur Lösung">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten „Ich komme nicht weiter“-Fälle **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, Ihr maschinenbezogenes
    Setup zu reparieren (PATH, Dienste, Berechtigungen, Authentifizierungsdateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (git) Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git Checkout** installiert, sodass der Agent den Code und die Dokumentation lesen und
    die exakt von Ihnen ausgeführte Version nachvollziehen kann. Sie können später jederzeit wieder zu stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu beaufsichtigen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Fehler oder eine Korrektur finden, erstellen Sie bitte ein GitHub Issue oder senden Sie einen PR:
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

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas defekt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installation](/de/install), [Installer-Flags](/de/install/installer), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Übersprungsgründe?">
    Häufige Heartbeat-Übersprungsgründe:

    - `quiet-hours`: außerhalb des konfigurierten Aktivstundenfensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres/nur aus Headern bestehendes Gerüst
    - `no-tasks-due`: `HEARTBEAT.md`-Aufgabenmodus ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: alle Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst weitergeschaltet, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung und Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlener Weg, OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Quellcode zu starten und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie den Gateway üblicherweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Entwicklung):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie sie über `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet Ihren Browser direkt nach dem Onboarding mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; falls er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn Shared-Secret-Authentifizierung angefordert wird, fügen Sie das konfigurierte Token oder Passwort in die Control UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie bind loopback bei, führen Sie `openclaw gateway --tailscale serve` aus, öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identitäts-Header die Control UI-/WebSocket-Authentifizierung (kein eingefügtes Shared Secret, vertrauenswürdiger Gateway-Host wird vorausgesetzt); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst private-ingress `none` oder trusted-proxy HTTP auth.
      Fehlerhafte gleichzeitige Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet bind**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwort-Authentifizierung), öffnen Sie `http://<tailscale-ip>:18789/`, und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Betreiben Sie den Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"`, und öffnen Sie dann die Proxy-URL. Same-host local loopback-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; fügen Sie das konfigurierte Token oder Passwort ein, wenn Sie dazu aufgefordert werden.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Approval-Konfigurationen für Chat-Freigaben?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Freigabeaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Freigabe-Client für Exec-Freigaben agieren

    Die Host-Exec-Policy bleibt weiterhin das eigentliche Freigabe-Gate. Die Chat-Konfiguration steuert nur, wo Freigabeaufforderungen
    erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Freigebende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first native Freigaben, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Freigabekarten/-buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl enthalten, wenn das Tool-Ergebnis meldet, dass Chat-Freigaben nicht verfügbar sind oder manuelle Freigabe der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie explizit möchten, dass Freigabeaufforderungen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Freigaben sind wiederum getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten zusätzlich plugin-approval-native-Handling bei.

    Kurzfassung: Forwarding dient dem Routing, native Client-Konfiguration bietet eine reichhaltigere kanalspezifische UX.
    Siehe [Exec-Freigaben](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Der Gateway ist leichtgewichtig - die Dokumentation nennt **512 MB bis 1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 ihn ausführen kann**.

    Wenn Sie zusätzlichen Spielraum wünschen (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann den Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit rauen Kanten.

    - Verwenden Sie ein **64-bit** OS und behalten Sie Node >= 22 bei.
    - Bevorzugen Sie die **hackbare (git) Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie diese dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installation](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / das Onboarding schlüpft nicht. Was jetzt?">
    Dieser Bildschirm hängt davon ab, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    beim ersten Schlüpfen automatisch „Wake up, my friend!“. Wenn Sie diese Zeile **ohne Antwort**
    sehen und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

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

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding zu wiederholen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace**, und führen Sie dann Doctor einmal aus. Dadurch
    bleibt Ihr Bot „exakt gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Kanalstatus), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Zugangsdaten, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus arbeiten, beachten Sie, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace nach GitHub committen/pushen, sichern Sie
    **Memory + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder die Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migration](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](/de/help/faq#where-things-live-on-disk),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die neueste ausgelieferte Version. Einträge sind nach **Highlights**, **Änderungen** und
    **Korrekturen** gruppiert (plus Dokumentations-/sonstige Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Allowlist, und versuchen Sie es erneut.
    Bitte helfen Sie uns bei der Entsperrung, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm dist-tags**, keine getrennten Codezweige:

    - `latest` = Stable
    - `beta` = früher Build zum Testen

    Normalerweise landet ein Stable Release zuerst auf **beta**; anschließend verschiebt ein expliziter
    Promotion-Schritt dieselbe Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können Beta und Stable nach der Promotion auf
    **dieselbe Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen Beta und Dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen Beta und Dev?">
    **Beta** ist der npm dist-tag `beta` (kann nach der Promotion `latest` entsprechen).
    **Dev** ist der bewegliche Stand von `main` (Git); bei Veröffentlichung verwendet er den npm dist-tag `dev`.

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

  <Accordion title="Wie teste ich die neuesten Bits?">
    Zwei Optionen:

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Das wechselt zum Branch `main` und aktualisiert aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Damit erhalten Sie ein lokales Repo, das Sie bearbeiten und anschließend über Git aktualisieren können.

    Wenn Sie lieber manuell sauber klonen möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs: [Aktualisieren](/de/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installieren](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, abhängig davon, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängen bleibt, verwenden Sie [Installer hängt fest](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich komme nicht weiter](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt fest? Wie bekomme ich mehr Feedback?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine hackbare (Git-)Installation:

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

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Windows-Installation meldet git nicht gefunden oder openclaw nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen Sie PowerShell, öffnen Sie es erneut und führen Sie den Installer nochmals aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen Sie PowerShell und öffnen Sie es nach dem Aktualisieren des PATH erneut.

    Wenn Sie die reibungsloseste Windows-Einrichtung möchten, verwenden Sie **WSL2** statt nativem Windows.
    Docs: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec-Ausgabe zeigt unleserlichen chinesischen Text - was soll ich tun?">
    Dies ist bei nativen Windows-Shells meist ein Konflikt mit der Konsolen-Codepage.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` rendert Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schnelle Umgehung in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie dann den Gateway neu und versuchen Sie Ihren Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies mit dem neuesten OpenClaw weiterhin reproduzieren können, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Docs haben meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (Git-)Installation**, damit Sie den vollständigen Quellcode und die Docs lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurze Antwort: Folgen Sie dem Linux-Leitfaden und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation und Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

    Leitfäden: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Cloud-/VPS-Installationsleitfäden?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie dem Leitfaden:

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

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurze Antwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), kann einen sauberen Git-Checkout benötigen und
    kann eine Bestätigung anfordern. Sicherer: Führen Sie Updates als Operator aus einer Shell aus.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie aus einem Agent automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Docs: [Update](/de/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Health Checks** und Auswahl von **Skills**

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um dies auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeitende
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts bleiben Anthropic-API-Schlüssel weiterhin die
    besser vorhersehbare Einrichtung. OpenAI Codex OAuth wird für externe
    Tools wie OpenClaw ausdrücklich unterstützt.

    OpenClaw unterstützt außerdem weitere gehostete Optionen im Abonnementstil, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM-Modelle](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass Claude CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` als genehmigt
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die am besten vorhersehbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt
    OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt für diese Integration,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads ist Anthropic-API-Schlüssel-Auth weiterhin die
    sicherere und besser vorhersehbare Wahl. Wenn Sie weitere gehostete Optionen im Abonnementstil
    in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM-
    Modelle](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie in der Anthropic Console
    Nutzung/Abrechnung und erhöhen Sie bei Bedarf die Limits.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropics 1M-Kontext-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Anmeldedaten für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider rate-limited ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming/Text-Bedrock-Katalog automatisch erkennen und als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert die Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` mit `agentRuntime.id: "codex"` für die übliche Einrichtung:
    ChatGPT/Codex-Abonnement-Authentifizierung plus native Codex-App-Server-Ausführung. Verwenden Sie
    `openai-codex/gpt-5.5` nur, wenn Sie Codex-OAuth über die standardmäßige
    Codex-Runtime möchten. Direkter OpenAI-API-Schlüssel-Zugriff bleibt für Nicht-Agent-
    OpenAI-API-Oberflächen und für Agent-Modelle über ein geordnetes
    `openai-codex`-API-Schlüsselprofil verfügbar.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin openai-codex?">
    `openai-codex` ist die Provider- und Authentifizierungsprofil-ID für ChatGPT/Codex-OAuth.
    Ältere Konfigurationen verwendeten sie außerdem als Modellpräfix:

    - `openai/gpt-5.5` = ChatGPT/Codex-Abonnement-Authentifizierung mit nativer Codex-Runtime für Agent-Turns
    - `openai-codex/gpt-5.5` = veraltete Modellroute, die von `openclaw doctor --fix` repariert wird
    - `openai/gpt-5.5` plus ein geordnetes `openai-codex`-API-Schlüsselprofil = API-Schlüssel-Authentifizierung für ein OpenAI-Agent-Modell
    - `openai-codex:...` = Authentifizierungsprofil-ID, kein Modellverweis

    Wenn Sie den direkten OpenAI-Platform-Abrechnungs-/Limitpfad möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT/Codex-Abonnement-Authentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an. Behalten Sie den Modellverweis als
    `openai/gpt-5.5`; `openai-codex/*`-Modellverweise sind veraltete Konfiguration, die
    `openclaw doctor --fix` umschreibt.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT im Web unterscheiden?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der ChatGPT-Website/App-Erfahrung unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert jedoch keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limitpfad möchten, verwenden Sie `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Authentifizierung (Codex-OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex)-Abonnement-OAuth** vollständig.
    OpenAI erlaubt die Nutzung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Flow für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsfluss**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, damit `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Melden Sie sich an: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Token in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats geeignet?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn es sein muss, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko für Prompt-Injection - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie regional gebundene Endpunkte. OpenRouter bietet in den USA gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während der von Ihnen ausgewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche Personen
    kaufen einen als Always-on-Host, aber ein kleiner VPS, Homeserver oder eine Box der Raspberry-Pi-Klasse funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für Tools, die nur unter macOS verfügbar sind**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) - der BlueBubbles-Server läuft auf jedem Mac, und der Gateway kann unter Linux oder anderswo laufen. Wenn Sie andere macOS-only Tools verwenden möchten, führen Sie den Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **ein macOS-Gerät**, das bei Nachrichten angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [BlueBubbles](/de/channels/bluebubbles)** (empfohlen) für iMessage - der BlueBubbles-Server läuft unter macOS, während der Gateway unter Linux oder anderswo laufen kann.

    Übliche Setups:

    - Führen Sie den Gateway unter Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der bei Nachrichten angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Single-Machine-Setup möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann den Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen den Gateway nicht aus - sie stellen zusätzliche
    Funktionen wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Übliches Muster:

    - Gateway auf dem Mac mini (always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Runtime-Fehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie dies auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Die Einrichtung fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits veraltete `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM, führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM, rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit verschiedenen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender E.164 wie `+15551234567`) an eine andere `agentId`, damit jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **selben WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen "schnellen Chat"-Agent und einen "Opus zum Coden"-Agent ausführen?'>
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

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Aktuelle Builds stellen außerdem häufige Benutzer-bin-Verzeichnisse bei Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm-Installation">
    - **Hackbare (git-)Installation:** vollständiger Source-Checkout, bearbeitbar, am besten für Beitragende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen aus npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dadurch werden **Ihre Daten nicht gelöscht** - es ändert nur die OpenClaw-Code-Installation.
    Ihr Zustand (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu git:

    ```bash
    openclaw update --channel dev
    ```

    Von git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zuerst in der Vorschau zu sehen. Der Updater führt
    Doctor-Nacharbeiten aus, aktualisiert Plugin-Quellen für den Zielkanal und
    startet den Gateway neu, sofern Sie nicht `--no-restart` übergeben.

    Auch der Installer kann beide Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich den Gateway auf meinem Laptop oder einem VPS ausführen?">
    Kurze Antwort: **Wenn Sie Zuverlässigkeit rund um die Uhr möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung möchten und Schlafmodus/Neustarts für Sie in Ordnung sind, führen Sie ihn lokal aus.

    **Laptop (lokaler Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkausfälle = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer aktiv, stabiles Netzwerk, keine Probleme durch Laptop-Ruhezustand, einfacher dauerhaft zu betreiben.
    - **Nachteile:** läuft oft headless (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen Updates per SSH durchführen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Kompromiss ist **headless Browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardeinstellung:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist ideal, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser wünschen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** immer aktiv, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, einfacher dauerhaft zu betreiben.
    - **Gemeinsam genutzter Laptop/Desktop:** für Tests und aktive Nutzung völlig in Ordnung, aber rechnen Sie mit Pausen, wenn der Rechner in den Ruhezustand wechselt oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie den Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitshinweise finden Sie unter [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für einen VPS und welches OS wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für einen einfachen Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenintensiv sein.

    OS: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM genauso wie einen VPS: Sie muss immer aktiv, erreichbar und mit ausreichend
    RAM für den Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Empfehlung:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medien-Tools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 die einfachste VM-artige Einrichtung** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
