---
read_when:
    - Neue Installation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Ersteinrichtung — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-06-27T17:35:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen und Antworten zum ersten Start. Informationen zu alltäglichen Vorgängen, Modellen, Authentifizierung, Sitzungen
  und Fehlerbehebung finden Sie in der Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich hänge fest, der schnellste Weg weiterzukommen">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und helfen, Ihre rechnerbezogene
    Einrichtung zu korrigieren (PATH, Dienste, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (git) Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent Code und Dokumentation lesen und
    über genau die Version nachdenken kann, die Sie ausführen. Sie können später jederzeit wieder zu stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu überwachen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Fehler oder eine Korrektur entdecken, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schnelle Momentaufnahme von Gateway-/Agent-Zustand + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Erste 60 Sekunden, wenn etwas kaputt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Heartbeat-Überspringgründe:

    - `quiet-hours`: außerhalb des konfigurierten Zeitfensters aktiver Stunden
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen, Kommentare, Überschriften, Fences oder leere Checklisten-Gerüste
    - `no-tasks-due`: Der `HEARTBEAT.md`-Aufgabenmodus ist aktiv, aber noch kein Aufgabenintervall ist fällig
    - `alerts-disabled`: Die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitpunkte erst fortgeschrieben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode, OpenClaw zu installieren und einzurichten">
    Das Repo empfiehlt, aus dem Source zu laufen und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie den Gateway typischerweise auf Port **18789** aus.

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
    Der Assistent öffnet Ihren Browser direkt nach dem Onboarding mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost gegenüber remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Auth gefragt wird, fügen Sie das konfigurierte Token oder Passwort in den Control UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, generieren Sie ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie bind loopback bei, führen Sie `openclaw gateway --tailscale serve` aus, öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identity-Header die Control UI-/WebSocket-Authentifizierung (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs benötigen weiterhin Shared-Secret-Auth, außer Sie verwenden bewusst private-ingress `none` oder Trusted-Proxy-HTTP-Auth.
      Fehlerhafte gleichzeitige Serve-Auth-Versuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie aufzeichnet, sodass der zweite fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet bind**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwort-Auth), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Platzieren Sie den Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL. Same-host loopback-Proxys benötigen explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Auth gilt weiterhin über den Tunnel; fügen Sie das konfigurierte Token oder Passwort ein, falls Sie dazu aufgefordert werden.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Bind-Modi und Auth-Details.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Approval-Konfigurationen für Chat-Freigaben?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Freigabeaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Channel als nativen Freigabe-Client für Exec-Freigaben handeln

    Die Exec-Policy des Hosts bleibt weiterhin die eigentliche Freigabesperre. Die Chat-Konfiguration steuert nur, wo
    Freigabeaufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Freigebende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first native approvals, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Approval-Karten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Freigaben nicht verfügbar sind oder manuelle Freigabe der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Freigabeaufforderungen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Freigaben sind wieder getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Channels behalten plugin-approval-native-Handling zusätzlich bei.

    Kurzfassung: Forwarding ist fürs Routing, native Client-Konfiguration für reichere channelspezifische UX.
    Siehe [Exec Approvals](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Der Gateway ist leichtgewichtig - die Dokumentation nennt **512 MB-1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 ihn ausführen kann**.

    Wenn Sie zusätzlichen Spielraum möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Raspberry Pi/VPS kann den Gateway hosten, und Sie können **Knoten** auf Ihrem Laptop/Telefon koppeln für
    lokale Bildschirm-/Kamera-/Canvas- oder Befehlsausführung. Siehe [Knoten](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit rauen Kanten.

    - Verwenden Sie ein **64-bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git) Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Channels/Skills und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was jetzt?">
    Dieser Bildschirm hängt davon ab, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    beim ersten Schlüpfen automatisch „Wake up, my friend!“. Wenn Sie diese Zeile **ohne Antwort**
    sehen und Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starten Sie den Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status + Auth:

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
    auf den richtigen Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Workspace** und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „genau derselbe“ (Speicher, Sitzungsverlauf, Auth und Channel-Zustand), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Zugangsdaten, Sitzungen und Speicher erhalten. Wenn Sie im
    Remote-Modus sind, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace nach GitHub committen/pushen, sichern Sie
    **Speicher + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Auth. Diese liegen
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
    **Fixes** gruppiert (plus Dokumentations-/andere Abschnitte bei Bedarf).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm dist-tags**, keine separaten Codezweige:

    - `latest` = Stable
    - `beta` = früher Build zum Testen

    Üblicherweise landet ein Stable-Release zuerst auf **beta**; anschließend verschiebt ein expliziter
    Promotion-Schritt dieselbe Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können Beta und Stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen Beta und Dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und worin besteht der Unterschied zwischen Beta und Dev?">
    **Beta** ist der npm dist-tag `beta` (kann nach der Promotion `latest` entsprechen).
    **Dev** ist der bewegliche Stand von `main` (git); bei Veröffentlichung verwendet er den npm dist-tag `dev`.

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

    Wenn Sie lieber manuell einen sauberen Clone verwenden möchten:

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

    Wenn der Vorgang hängt, verwenden Sie [Installer hängt](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich komme nicht weiter](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt? Wie bekomme ich mehr Rückmeldung?">
    Führen Sie den Installer erneut mit **ausführlicher Ausgabe** aus:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-Installation mit ausführlicher Ausgabe:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Für eine anpassbare Installation (git):

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

  <Accordion title="Windows-Installation meldet git nicht gefunden oder openclaw nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut, und führen Sie den Installer noch einmal aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht in PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` erforderlich; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut, nachdem Sie PATH aktualisiert haben.

    Für die Desktop-Einrichtung verwenden Sie die native **Windows Hub**-App. Für eine reine Terminal-
    Einrichtung werden sowohl der PowerShell-Installer als auch WSL2-Gateway-Pfade unterstützt.
    Docs: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Dies ist auf nativen Windows-Shells normalerweise ein Konsolen-Codepage-Konflikt.

    Symptome:

    - `system.run`/`exec`-Ausgabe stellt Chinesisch als Mojibake dar
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

    Schneller Workaround in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Starten Sie danach den Gateway neu und versuchen Sie Ihren Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies weiterhin mit dem neuesten OpenClaw reproduzieren können, verfolgen/melden Sie es unter:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Docs haben meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **anpassbare Installation (git)**, damit Sie den vollständigen Quellcode und die Docs lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellweg + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation und Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server, und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remotezugriff: [Gateway Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Cloud-/VPS-Installationsanleitungen?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Der **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server; behandeln Sie den Host daher als Quelle der Wahrheit und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während der
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remotezugriff: [Gateway Remotezugriff](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), kann einen sauberen git checkout erfordern und
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

    Docs: [Aktualisieren](/de/cli/update), [Aktualisierung](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt er Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic setup-token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (bind/port/auth/tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Health Checks** und Auswahl von **Skills**

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Benötige ich ein Claude- oder OpenAI-Abonnement, um dies auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, sich bei diesen Providern zu authentifizieren.

    Für Anthropic in OpenClaw gilt praktisch folgende Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeiter
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    besser vorhersehbare Einrichtung. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem weitere gehostete abonnementähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Docs: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [Z.AI (GLM)](/de/providers/zai),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass die OpenClaw-artige Claude CLI-Nutzung wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` als genehmigt
    für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die besser vorhersehbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    Claude CLI-Wiederverwendung und die Nutzung von `claude -p` als genehmigt für diese Integration,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic setup-token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt Claude CLI-Wiederverwendung und `claude -p`, wenn verfügbar.
    Für Produktions- oder Mehrbenutzer-Workloads ist Auth per Anthropic-API-Schlüssel weiterhin die
    sicherere und besser vorhersehbare Wahl. Wenn Sie andere abonnementähnliche gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratelimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie Limits nach Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    das 1M-Kontextfenster von Anthropic zu verwenden (ein GA-fähiges 1M-Claude-4.x-Modell oder die Legacy-Konfiguration
    `context1m: true`). Das funktioniert nur, wenn Ihre Anmeldedaten
    für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der OpenClaw-Claude-Login-Pfad
    mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider rate-limitiert ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming/Text-Bedrock-Katalog automatisch erkennen und als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` für die übliche Einrichtung: ChatGPT/Codex-Abonnementauthentifizierung plus
    native Codex-App-Server-Ausführung. Legacy-Codex-GPT-Refs sind
    Legacy-Konfiguration, die durch `openclaw doctor --fix` repariert wird. Direkter OpenAI-API-Key-
    Zugriff bleibt für OpenAI-API-Oberflächen ohne Agent und für Agent-
    Modelle über ein geordnetes `openai`-API-Key-Profil verfügbar.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw noch das Legacy-OpenAI-Codex-Präfix?">
    `openai` ist die Provider- und Authentifizierungsprofil-ID sowohl für OpenAI-API-Keys als auch für
    ChatGPT/Codex-OAuth. Das Legacy-OpenAI-Codex-Präfix kann Ihnen weiterhin in Legacy-Konfiguration und
    Migrationswarnungen begegnen.
    Ältere Konfigurationen verwendeten es auch als Modellpräfix:

    - `openai/gpt-5.5` = ChatGPT/Codex-Abonnementauthentifizierung mit nativer Codex-Runtime für Agent-Turns
    - Legacy-Codex-GPT-5.5-Ref = Legacy-Modellroute, die durch `openclaw doctor --fix` repariert wird
    - `openai/gpt-5.5` plus ein geordnetes `openai`-API-Key-Profil = API-Key-Authentifizierung für ein OpenAI-Agent-Modell
    - Legacy-Codex-Authentifizierungsprofil-IDs = Legacy-Authentifizierungsprofil-ID, migriert durch `openclaw doctor --fix`

    Wenn Sie den direkten OpenAI-Platform-Abrechnungs-/Limitpfad möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT/Codex-Abonnementauthentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai` an. Behalten Sie die Modell-Ref als
    `openai/gpt-5.5`; Legacy-Codex-Modell-Refs sind Legacy-Konfiguration, die
    `openclaw doctor --fix` umschreibt.

  </Accordion>

  <Accordion title="Warum können Codex-OAuth-Limits von ChatGPT Web abweichen?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der ChatGPT-Website-/App-Erfahrung unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert ChatGPT-Web-
    Berechtigungen aber nicht zu direktem API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limitpfad möchten, verwenden Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnementauthentifizierung (Codex-OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex)-Abonnement-OAuth** vollständig.
    OpenAI erlaubt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` auf `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Melden Sie sich an: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    In der Regel nein. OpenClaw benötigt großen Kontext und starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn es unbedingt sein muss, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich gehosteten Modell-Traffic in einer bestimmten Region?">
    Wählen Sie regionsgebundene Endpunkte. OpenRouter stellt in den USA gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während der von Ihnen ausgewählte regionsgebundene Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche kaufen
    einen als Always-on-Host, aber ein kleiner VPS, Heimserver oder eine Box der Raspberry-Pi-Klasse funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Für iMessage verwenden Sie [iMessage](/de/channels/imessage) mit `imsg` auf einem beliebigen Mac, der bei Nachrichten angemeldet ist. Wenn das Gateway auf Linux oder anderswo läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf diesem Mac ausführt. Wenn Sie andere macOS-only-Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Docs: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remotemodus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Nachrichten angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [iMessage](/de/channels/imessage)** mit `imsg`; das Gateway kann auf diesem Mac laufen, oder es kann anderswo mit einem SSH-Wrapper `cliPath` laufen.

    Übliche Setups:

    - Führen Sie das Gateway auf Linux/VPS aus und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf einem Mac ausführt, der bei Nachrichten angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Einzelmaschinen-Setup möchten.

    Docs: [iMessage](/de/channels/imessage), [Nodes](/de/nodes),
    [Mac-Remotemodus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Übliches Muster:

    - Gateway auf dem Mac mini (Always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn zu sehen.

    Docs: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Runtime-Bugs, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie dies auf einem nicht produktiven Gateway
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
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Session-Speicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast Chat“-Agent und einen „Opus for coding“-Agent ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agent ein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an den jeweiligen Agent. Eine Beispielkonfiguration befindet sich in [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew auf Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelle Einrichtung:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Service-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Non-Login-Shells aufgelöst werden.
    Neuere Builds stellen außerdem häufige Benutzer-bin-Verzeichnisse bei Linux-systemd-Services voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen hackbarer git-Installation und npm-Installation">
    - **Hackbare (git-)Installation:** vollständiger Source-Checkout, editierbar, am besten für Beitragende.
      Sie führen Builds lokal aus und können Code/Docs patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen aus npm-dist-tags.

    Docs: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dies **löscht Ihre Daten nicht** - es ändert nur die OpenClaw-Codeinstallation.
    Ihr State (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unangetastet.

    Von npm zu git:

    ```bash
    openclaw update --channel dev
    ```

    Von git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zuerst in der Vorschau zu sehen. Der Updater führt
    Doctor-Follow-ups aus, aktualisiert Plugin-Quellen für den Ziel-Channel und
    startet das Gateway neu, sofern Sie nicht `--no-restart` übergeben.

    Der Installer kann beide Modi ebenfalls erzwingen:

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

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkausfälle = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen den Betrieb, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer eingeschaltet, stabiles Netzwerk, keine Probleme durch Laptop-Ruhezustand, einfacher dauerhaft laufen zu lassen.
    - **Nachteile:** läuft oft headless (Screenshots verwenden), nur Remote-Dateizugriff, Updates erfordern SSH.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Kompromiss ist **Headless-Browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardeinstellung:** VPS, wenn es bei Ihnen zuvor zu Gateway-Verbindungsabbrüchen kam. Lokal ist hervorragend, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Raspberry Pi):** immer eingeschaltet, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, einfacher dauerhaft laufen zu lassen.
    - **Gemeinsam genutzter Laptop/Desktop:** für Tests und aktive Nutzung völlig in Ordnung, aber rechnen Sie mit Pausen, wenn der Rechner in den Ruhezustand geht oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, belassen Sie den Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitshinweise finden Sie unter [Security](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen für VPS und das empfohlene OS?">
    OpenClaw ist leichtgewichtig. Für einen einfachen Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browserautomatisierung können ressourcenintensiv sein.

    OS: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und welche Anforderungen gelten?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar sein und genügend
    RAM für den Gateway und alle aktivierten Kanäle haben.

    Grundlegende Empfehlungen:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browserautomatisierung oder Medien-Tools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, nutzen Sie **Windows Hub** für die Desktop-Einrichtung oder WSL2, wenn
    Sie gezielt eine Linux-artige Gateway-VM mit breiter Tooling-
    Kompatibilität möchten. Siehe [Windows](/de/platforms/windows), [VPS hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
