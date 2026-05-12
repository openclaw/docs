---
read_when:
    - Neue Installation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Ersteinrichtung — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Ersteinrichtung'
x-i18n:
    generated_at: "2026-05-12T00:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen zur Ersteinrichtung. Für den Alltagsbetrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung lesen Sie die zentrale [FAQ](/de/help/faq).

  ## Schnellstart und Ersteinrichtung

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter, der schnellste Weg zur Lösung">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen** kann. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich komme nicht weiter“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repository lesen, Befehle ausführen, Logs prüfen und bei der Einrichtung auf Rechnerebene
    helfen (PATH, Dienste, Berechtigungen, Authentifizierungsdateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (Git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent Code und Dokumentation lesen und
    über genau die Version nachdenken kann, die Sie ausführen. Sie können später jederzeit wieder zu Stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu überwachen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Fehler oder eine Korrektur finden, erstellen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schnelle Momentaufnahme von Gateway-/Agent-Zustand und Basiskonfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung und Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations- und Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas defekt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer wieder übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Heartbeat-Überspringgründe:

    - `quiet-hours`: außerhalb des konfigurierten Zeitfensters für aktive Stunden
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres oder nur aus Überschriften bestehendes Grundgerüst
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber keines der Aufgabenintervalle ist bereits fällig
    - `alerts-disabled`: Die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle ausgeschaltet)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst fortgeschrieben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen ist. Übersprungene Läufe markieren Aufgaben nicht als erledigt.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zur Installation und Einrichtung von OpenClaw">
    Das Repository empfiehlt, aus dem Quellcode zu laufen und Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding läuft der Gateway typischerweise auf Port **18789**.

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
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link außerdem in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; falls er nicht gestartet wurde, kopieren Sie die ausgegebene URL auf demselben Rechner und fügen Sie sie dort ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn Shared-Secret-Authentifizierung verlangt wird, fügen Sie das konfigurierte Token oder Passwort in den Control-UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwortquelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Lassen Sie das Binding auf local loopback, führen Sie `openclaw gateway --tailscale serve` aus, öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identity-Header die Control-UI-/WebSocket-Authentifizierung (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, außer Sie verwenden bewusst private-ingress `none` oder Trusted-Proxy-HTTP-Authentifizierung.
      Fehlerhafte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie aufzeichnet, sodass der zweite fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bind**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Betreiben Sie den Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL. Loopback-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Details zu Bind-Modi und Authentifizierung finden Sie unter [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web).

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Kanal zu einem nativen Genehmigungsclient für Exec-Genehmigungen

    Die Host-Exec-Policy bleibt weiterhin die eigentliche Genehmigungsschranke. Die Chat-Konfiguration steuert nur, wo
    Genehmigungsaufforderungen erscheinen und wie Personen darauf antworten können.

    In den meisten Setups brauchen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmigende zuverlässig ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-Buttons verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen zurück in den ursprünglichen Raum bzw. das ursprüngliche Thema gepostet werden.
    - Plugin-Genehmigungen sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten zusätzlich native Plugin-Genehmigungsbehandlung bei.

    Kurzfassung: Weiterleitung ist für Routing, native Client-Konfiguration für eine reichere kanalspezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für den Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Der Gateway ist leichtgewichtig – die Dokumentation nennt **512 MB–1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für private Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 ihn ausführen kann**.

    Wenn Sie mehr Reserven möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    keine harte Mindestanforderung.

    Tipp: Ein kleiner Pi/VPS kann den Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln, um
    lokalen Bildschirm, Kamera, Canvas oder Befehlsausführung zu nutzen. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (Git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn merkwürdige Binärprobleme auftreten, ist es normalerweise ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass der Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    „Wake up, my friend!“ automatisch beim ersten Schlüpfen. Wenn Sie diese Zeile mit **keiner Antwort**
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

    Wenn der Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf den richtigen Gateway zeigt. Siehe [Remotezugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding erneut durchzuführen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Arbeitsbereich** und führen Sie dann einmal Doctor aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Speicher, Sitzungsverlauf, Authentifizierung und Kanalzustand), solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Arbeitsbereich (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Zugangsdaten, Sitzungen und Speicher erhalten. Wenn Sie im
    Remote-Modus sind, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Arbeitsbereich besitzt.

    **Wichtig:** Wenn Sie nur Ihren Arbeitsbereich zu GitHub committen/pushen, sichern Sie
    **Speicher + Bootstrap-Dateien**, aber **nicht** den Sitzungsverlauf oder die Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](/de/help/faq#where-things-live-on-disk),
    [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die neueste ausgelieferte Version. Einträge sind nach **Highlights**, **Änderungen** und
    **Korrekturen** gruppiert (plus Dokumentation/andere Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns bei der Entsperrung, indem Sie hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Site weiterhin nicht erreichen können, ist die Dokumentation auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm dist-tags**, keine separaten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet ein stabiles Release zuerst auf **beta**, dann verschiebt ein expliziter
    Promotion-Schritt dieselbe Version auf `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen beta und dev finden Sie im Akkordeon unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist der npm dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Kopf von `main` (git); wenn veröffentlicht, verwendet er den npm dist-tag `dev`.

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

    1. **Dev-Kanal (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dies wechselt zum Branch `main` und aktualisiert aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repo, das Sie bearbeiten und dann über git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Klon erstellen möchten, verwenden Sie:

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

    Wenn es hängt, verwenden Sie [Installer hängt](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich stecke fest](#quick-start-and-first-run-setup).

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

    Für eine hackbare (git-)Installation:

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

    **1) npm error spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut, und führen Sie dann den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-Bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` erforderlich; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach dem Aktualisieren von PATH erneut.

    Wenn Sie die reibungsloseste Windows-Einrichtung möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Dies ist normalerweise ein Konflikt mit der Konsolen-Codepage in nativen Windows-Shells.

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

    Starten Sie dann den Gateway neu und versuchen Sie Ihren Befehl erneut:

    ```powershell
    openclaw gateway restart
    ```

    Wenn Sie dies auf der neuesten OpenClaw-Version weiterhin reproduzieren können, verfolgen/melden Sie es in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git-)Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation und Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Der **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie den Host daher als Quelle der Wahrheit und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während der
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), kann einen sauberen git-Checkout benötigen und
    kann zur Bestätigung auffordern. Sicherer: Führen Sie Updates als Operator aus einer Shell aus.

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

    Dokumentation: [Aktualisieren](/de/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent auf macOS; systemd-Benutzereinheit auf Linux/WSL2)
    - **Health Checks** und **Skills**-Auswahl

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **nur lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, sich bei diesen Providern zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeitende
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    besser vorhersehbare Einrichtung. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt auch andere gehostete Optionen im Abonnementstil, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich das Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` als für
    diese Integration genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die am besten vorhersehbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeitende haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als für diese Integration
    genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.

    Der Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Mehrbenutzer-Workloads ist Auth per Anthropic-API-Schlüssel weiterhin die
    sicherere, besser vorhersehbare Wahl. Wenn Sie andere gehostete Optionen im Abonnementstil
    in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Rate Limit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder aktualisieren Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie in der Anthropic Console
    Nutzung/Abrechnung und erhöhen Sie bei Bedarf die Limits.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropics 1M-Kontext-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Anmeldedaten für Long-Context-Abrechnung berechtigt sind (API-Schlüssel-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider durch Ratenbegrenzung eingeschränkt ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Flow bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` für die gängige Einrichtung: ChatGPT-/Codex-Abonnement-Authentifizierung plus
    native Codex-App-Server-Ausführung. `openai-codex/gpt-*`-Modell-Refs sind
    Legacy-Konfiguration, die durch `openclaw doctor --fix` repariert wird. Direkter OpenAI-API-Key-Zugriff
    bleibt für OpenAI-API-Oberflächen ohne Agent und für Agent-
    Modelle über ein geordnetes `openai-codex`-API-Key-Profil verfügbar.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin openai-codex?">
    `openai-codex` ist die Provider- und Authentifizierungsprofil-ID für ChatGPT-/Codex-OAuth.
    Ältere Konfigurationen verwendeten sie außerdem als Modellpräfix:

    - `openai/gpt-5.5` = ChatGPT-/Codex-Abonnement-Authentifizierung mit nativer Codex-Laufzeit für Agent-Turns
    - `openai-codex/gpt-5.5` = Legacy-Modellroute, die durch `openclaw doctor --fix` repariert wird
    - `openai/gpt-5.5` plus ein geordnetes `openai-codex`-API-Key-Profil = API-Key-Authentifizierung für ein OpenAI-Agent-Modell
    - `openai-codex:...` = Authentifizierungsprofil-ID, keine Modell-Ref

    Wenn Sie den direkten Abrechnungs-/Limit-Pfad der OpenAI Platform verwenden möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT-/Codex-Abonnement-Authentifizierung verwenden möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an. Behalten Sie die Modell-Ref als
    `openai/gpt-5.5` bei; `openai-codex/*`-Modell-Refs sind Legacy-Konfiguration, die
    `openclaw doctor --fix` umschreibt.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der Erfahrung auf der ChatGPT-Website/App unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert jedoch keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff. Wenn Sie den direkten Abrechnungs-/Limit-Pfad der OpenAI Platform verwenden möchten,
    nutzen Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Authentifizierung (Codex-OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) Subscription OAuth** vollständig.
    OpenAI erlaubt die Nutzung von Subscription OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Flow für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsflow**, keine Client-ID und kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` in `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    Normalerweise nein. OpenClaw benötigt großen Kontext und starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn Sie müssen, führen Sie lokal den **größten** Modell-Build aus, den Sie können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie regionsgebundene Endpunkte. OpenRouter stellt in den USA gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben, während der von Ihnen ausgewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche kaufen
    einen als Always-on-Host, aber ein kleiner VPS, Heimserver oder eine Raspberry-Pi-Klasse-Box funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für macOS-exklusive Tools**. Für iMessage verwenden Sie [iMessage](/de/channels/imessage) mit `imsg` auf einem beliebigen Mac, der in Nachrichten angemeldet ist. Wenn der Gateway auf Linux oder anderswo läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf diesem Mac ausführt. Wenn Sie andere macOS-exklusive Tools verwenden möchten, führen Sie den Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das in Nachrichten angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [iMessage](/de/channels/imessage)** mit `imsg`; der Gateway kann auf diesem Mac laufen oder andernorts mit einem SSH-Wrapper `cliPath`.

    Gängige Setups:

    - Führen Sie den Gateway auf Linux/VPS aus und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf einem Mac ausführt, der in Nachrichten angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Ein-Maschinen-Setup möchten.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann den Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen den Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Gängiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn anzuzeigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, insbesondere mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie dies auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn Ihre Konfiguration bereits Legacy-`@username`-Einträge enthält, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM, führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM, rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Session Store erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast Chat“-Agent und einen „Opus for coding“-Agent ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agent sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an den jeweiligen Agent. Eine Beispielkonfiguration finden Sie in [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew auf Linux?">
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

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und der npm-Installation">
    - **Hackbare (git) Installation:** vollständiger Source-Checkout, editierbar, am besten für Beitragende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen aus npm-Dist-Tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dies **löscht Ihre Daten nicht** - es ändert nur die OpenClaw-Codeinstallation.
    Ihr Zustand (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unverändert.

    Von npm zu git:

    ```bash
    openclaw update --channel dev
    ```

    Von git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um den geplanten Moduswechsel zunächst in der Vorschau zu sehen. Der Updater führt
    Doctor-Follow-ups aus, aktualisiert Plugin-Quellen für den Zielkanal und
    startet den Gateway neu, sofern Sie nicht `--no-restart` übergeben.

    Der Installer kann ebenfalls beide Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich den Gateway auf meinem Laptop oder einem VPS ausführen?">
    Kurzantwort: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie
    möglichst wenig Reibung möchten und mit Ruhezustand/Neustarts einverstanden sind, führen Sie ihn lokal aus.

    **Laptop (lokaler Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, Live-Browserfenster.
    - **Nachteile:** Ruhezustand/Netzwerkausfälle = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** immer aktiv, stabiles Netzwerk, keine Probleme durch Laptop-Ruhezustand, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** läuft oft headless (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen für Updates per SSH zugreifen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige wirkliche Kompromiss ist **headless Browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardeinstellung:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist ideal, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit einem sichtbaren Browser wünschen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** immer aktiv, weniger Unterbrechungen durch Ruhezustand/Neustarts, sauberere Berechtigungen, leichter dauerhaft am Laufen zu halten.
    - **Geteilter Laptop/Desktop:** für Tests und aktive Nutzung völlig in Ordnung, aber rechnen Sie mit Pausen, wenn die Maschine in den Ruhezustand geht oder Updates installiert.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie den Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitsleitlinien finden Sie unter [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und das empfohlene Betriebssystem?">
    OpenClaw ist leichtgewichtig. Für einen einfachen Gateway und einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenintensiv sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Doku: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss dauerhaft eingeschaltet, erreichbar und mit ausreichend
    RAM für den Gateway und alle aktivierten Kanäle ausgestattet sein.

    Grundlegende Empfehlungen:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medientools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 die einfachste VM-ähnliche Einrichtung** und bietet die beste Tooling-Kompatibilität.
    Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
