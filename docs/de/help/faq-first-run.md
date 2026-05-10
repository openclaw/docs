---
read_when:
    - Neue Installation, festhängende Einrichtung oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung bei der ersten Ausführung — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-05-10T19:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  Schnellstart und Fragen und Antworten zur Ersteinrichtung. Informationen zu alltäglichen Vorgängen, Modellen, Authentifizierung, Sitzungen
  und Fehlerbehebung finden Sie in der Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Ersteinrichtung

  <AccordionGroup>
  <Accordion title="Ich komme nicht weiter, schnellster Weg zur Lösung">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver, als
    in Discord zu fragen, da die meisten Fälle von „Ich komme nicht weiter“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    entfernte Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Protokolle prüfen und dabei helfen, Ihre Einrichtung auf Rechnerebene
    zu beheben (PATH, Dienste, Berechtigungen, Authentifizierungsdateien). Geben Sie ihnen den **vollständigen Quellcode-Checkout** über
    die hackbare (git) Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem git-Checkout** installiert, sodass der Agent Code und Dokumentation lesen und
    über genau die Version nachdenken kann, die Sie ausführen. Sie können später jederzeit zurück zur stabilen Version wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung **zu planen und zu beaufsichtigen** (Schritt für Schritt), und führen Sie dann nur die
    notwendigen Befehle aus. So bleiben Änderungen klein und leichter zu prüfen.

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

    - `openclaw status`: schnelle Übersicht über Gateway-/Agent-Gesundheit und Basiskonfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung und Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Zustandsprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas defekt ist](/de/help/faq#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat überspringt weiterhin Läufe. Was bedeuten die Gründe für das Überspringen?">
    Häufige Gründe für das Überspringen von Heartbeats:

    - `quiet-hours`: außerhalb des konfigurierten Fensters für aktive Zeiten
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leeres oder nur aus Überschriften bestehendes Gerüst
    - `no-tasks-due`: der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle ausgeschaltet)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst weitergeschoben, nachdem ein echter Heartbeat-Lauf
    abgeschlossen wurde. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung und Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlener Weg zur Installation und Einrichtung von OpenClaw">
    Das Repo empfiehlt, aus dem Quellcode zu starten und das Onboarding zu verwenden:

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
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen (nicht tokenisierten) Dashboard-URL und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab offen; falls er nicht gestartet wurde, kopieren Sie die ausgegebene URL und fügen Sie sie auf demselben Rechner ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost im Vergleich zu remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Control-UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie die Bindung an local loopback bei, führen Sie `openclaw gateway --tailscale serve` aus und öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, sofern Sie nicht bewusst Private-Ingress `none` oder Trusted-Proxy-HTTP-Authentifizierung verwenden.
      Fehlerhafte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie erfasst, sodass der zweite fehlerhafte Wiederholungsversuch bereits `retry later` anzeigen kann.
    - **Tailnet-Bindung**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwortauthentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Lassen Sie das Gateway hinter einem vertrauenswürdigen Proxy, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL. local loopback-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie das konfigurierte Token oder Passwort ein, falls Sie dazu aufgefordert werden.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Bind-Modi und Authentifizierungsdetails.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Schichten:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: lässt diesen Kanal als nativen Genehmigungs-Client für Exec-Genehmigungen agieren

    Die Exec-Policy des Hosts bleibt weiterhin das eigentliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wo Genehmigungsaufforderungen
    erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmigende sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Aufforderungen auch an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsaufforderungen wieder in den ursprünglichen Raum bzw. das ursprüngliche Thema gepostet werden.
    - Plugin-Genehmigungen sind wiederum separat: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Forwarding, und nur einige native Kanäle behalten zusätzlich native Behandlung für Plugin-Genehmigungen bei.

    Kurzfassung: Forwarding ist für Routing gedacht, native Client-Konfiguration für eine reichhaltigere kanalspezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Runtime benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf einem Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig - die Dokumentation nennt **512 MB bis 1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie zusätzlichen Spielraum wünschen (Protokolle, Medien, andere Dienste), werden **2 GB empfohlen**, aber das ist
    kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln, um
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung zu verwenden. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Tipps für Raspberry-Pi-Installationen?">
    Kurzfassung: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und halten Sie Node >= 22.
    - Bevorzugen Sie die **hackbare (git) Installation**, damit Sie Protokolle sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, handelt es sich meist um ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei „Weck auf, mein Freund“ / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet außerdem
    „Weck auf, mein Freund!“ automatisch beim ersten Schlüpfen. Wenn Sie diese Zeile **ohne Antwort** sehen
    und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

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

    3. Wenn es weiterhin hängt, führen Sie Folgendes aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding erneut durchzuführen?">
    Ja. Kopieren Sie das **Zustandsverzeichnis** und den **Arbeitsbereich**, und führen Sie anschließend einmal Doctor aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Speicher, Sitzungsverlauf, Authentifizierung und Kanalzustand), solange Sie **beide** Orte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Arbeitsbereich (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Zugangsdaten, Sitzungen und Speicher erhalten. Wenn Sie im
    Remote-Modus sind, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Arbeitsbereich besitzt.

    **Wichtig:** Wenn Sie nur Ihren Arbeitsbereich nach GitHub committen/pushen, sichern Sie
    **Speicher und Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](/de/help/faq#where-things-live-on-disk),
    [Agent-Arbeitsbereich](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt ausgelieferte Version. Einträge sind nach **Highlights**, **Änderungen** und
    **Korrekturen** gruppiert (plus Dokumentations-/sonstige Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie es oder setzen Sie `docs.openclaw.ai` auf die Allowlist, und versuchen Sie es erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, sind die Dokumente auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm dist-tags**, keine getrennten Codezweige:

    - `latest` = stabil
    - `beta` = früher Build zum Testen

    Normalerweise landet ein Stable-Release zuerst auf **Beta**, dann verschiebt ein expliziter
    Promotionsschritt dieselbe Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können Beta und Stable nach der Promotion
    auf **dieselbe Version** zeigen.

    Sehen Sie, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Installations-Einzeiler und den Unterschied zwischen Beta und Dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen Beta und Dev?">
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

    Weitere Details: [Entwicklungskanäle](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Builds aus?">
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

    Das gibt Ihnen ein lokales Repo, das Sie bearbeiten und anschließend über git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Klon verwenden möchten, nutzen Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Update](/de/cli/update), [Entwicklungskanäle](/de/install/development-channels),
    [Installieren](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2-5 Minuten
    - **Onboarding:** 5-15 Minuten, je nachdem, wie viele Kanäle/Modelle Sie konfigurieren

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

    Für eine hackbare (git-)Installation:

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

  <Accordion title="Windows-Installation meldet git nicht gefunden oder openclaw wird nicht erkannt">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git nicht gefunden**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann den Installer erneut aus.

    **2) openclaw wird nach der Installation nicht erkannt**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell nach dem Aktualisieren des PATH erneut.

    Wenn Sie die reibungsloseste Windows-Einrichtung möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Windows-exec-Ausgabe zeigt verstümmelten chinesischen Text - was soll ich tun?">
    Dies ist in nativen Windows-Shells normalerweise ein Konflikt mit der Konsolen-Codepage.

    Symptome:

    - `system.run`/`exec`-Ausgabe stellt Chinesisch als Mojibake dar
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

    Wenn Sie dies mit der neuesten OpenClaw-Version weiterhin reproduzieren können, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet - wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (git-)Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Weitere Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurzantwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um den Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Fernzugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Der **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Zustand + Workspace
    liegen auf dem Server, behandeln Sie den Host daher als maßgebliche Quelle und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während der
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Fernzugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurzantwort: **möglich, nicht empfohlen**. Der Update-Ablauf kann den
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), einen sauberen git checkout benötigen und
    eine Bestätigung abfragen. Sicherer: Führen Sie Updates als Operator aus einer Shell aus.

    Verwenden Sie die CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Wenn Sie von einem Agent aus automatisieren müssen:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokumentation: [Update](/de/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt er Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-Benutzereinheit unter Linux/WSL2)
    - **Integritätsprüfungen** und **Skills**-Auswahl

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um dies auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, damit Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw gilt praktisch folgende Aufteilung:

    - **Anthropic API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Auth in OpenClaw**: Anthropic-Mitarbeiter
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      für diese Integration als genehmigt, solange Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin die
    besser vorhersagbare Einrichtung. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem weitere gehostete abonnementartige Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher
    behandelt OpenClaw Claude-Abonnement-Auth und die Nutzung von `claude -p` als
    für diese Integration genehmigt, solange Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    die am besten vorhersagbare serverseitige Einrichtung möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Auth (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als für diese Integration genehmigt,
    solange Anthropic keine neue Richtlinie veröffentlicht.

    Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Mehrbenutzer-Workloads ist die Authentifizierung per Anthropic-API-Schlüssel weiterhin die
    sicherere, besser vorhersagbare Wahl. Wenn Sie andere abonnementartige gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder aktualisieren Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits nach Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    Anthropics 1M-Kontext-Beta (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider ratenbegrenzt ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw enthält einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Streaming-/Text-Bedrock-Katalog automatisch erkennen und als impliziten `amazon-bedrock`-Provider zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Flow bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert die Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai/gpt-5.5` für die übliche Einrichtung: ChatGPT-/Codex-Abonnement-Authentifizierung plus
    native Codex-App-Server-Ausführung. `openai-codex/gpt-*`-Modell-Refs sind
    Legacy-Konfiguration, die durch `openclaw doctor --fix` repariert wird. Direkter OpenAI-API-Key-
    Zugriff bleibt für OpenAI-API-Oberflächen ohne Agent und für Agent-
    Modelle über ein geordnetes `openai-codex`-API-Key-Profil verfügbar.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw weiterhin openai-codex?">
    `openai-codex` ist die Provider- und Auth-Profil-ID für ChatGPT-/Codex-OAuth.
    Ältere Konfigurationen haben sie auch als Modellpräfix verwendet:

    - `openai/gpt-5.5` = ChatGPT-/Codex-Abonnement-Authentifizierung mit nativer Codex-Laufzeit für Agent-Turns
    - `openai-codex/gpt-5.5` = Legacy-Modellroute, die durch `openclaw doctor --fix` repariert wird
    - `openai/gpt-5.5` plus ein geordnetes `openai-codex`-API-Key-Profil = API-Key-Authentifizierung für ein OpenAI-Agent-Modell
    - `openai-codex:...` = Auth-Profil-ID, keine Modell-Ref

    Wenn Sie den direkten OpenAI-Platform-Abrechnungs-/Limit-Pfad möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT-/Codex-Abonnement-Authentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an. Belassen Sie die Modell-Ref bei
    `openai/gpt-5.5`; `openai-codex/*`-Modell-Refs sind Legacy-Konfiguration, die
    `openclaw doctor --fix` umschreibt.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der ChatGPT-Website-/App-Erfahrung unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert ChatGPT-Web-
    Berechtigungen aber nicht zu direktem API-Zugriff. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchten, verwenden Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Authentifizierung (Codex-OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex)-Abonnement-OAuth** vollständig.
    OpenAI erlaubt die Verwendung von Abonnement-OAuth in externen Tools/Workflows
    wie OpenClaw ausdrücklich. Das Onboarding kann den OAuth-Flow für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Flow**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` im `PATH` liegt
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Melden Sie sich an: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Token in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats geeignet?">
    In der Regel nein. OpenClaw benötigt großen Kontext und starke Sicherheit; kleine Karten kürzen ab und leaken. Wenn es sein muss, führen Sie den **größten** Modell-Build lokal aus, den Sie können (LM Studio), und lesen Sie [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Prompt-Injection-Risiko - siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich gehosteten Modell-Traffic in einer bestimmten Region?">
    Wählen Sie regiongebundene Endpunkte. OpenRouter stellt in den USA gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die in den USA gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben auflisten, indem Sie `models.mode: "merge"` verwenden, sodass Fallbacks verfügbar bleiben und zugleich der von Ihnen ausgewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um dies zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional - manche kaufen
    einen als Always-on-Host, aber ein kleiner VPS, Homeserver oder eine Raspberry Pi-Klasse-Box funktioniert ebenfalls.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Verwenden Sie für iMessage [iMessage](/de/channels/imessage) mit `imsg` auf einem beliebigen Mac, der in Messages angemeldet ist. Wenn der Gateway auf Linux oder anderswo läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf diesem Mac ausführt. Wenn Sie andere macOS-only-Tools möchten, führen Sie den Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Benötige ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **ein macOS-Gerät**, das in Messages angemeldet ist. Es muss **kein** Mac mini sein -
    jeder Mac funktioniert. **Verwenden Sie [iMessage](/de/channels/imessage)** mit `imsg`; der Gateway kann auf diesem Mac laufen, oder er kann anderswo mit einem SSH-Wrapper `cliPath` laufen.

    Übliche Setups:

    - Führen Sie den Gateway auf Linux/VPS aus und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf einem Mac ausführt, der in Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Single-Machine-Setup möchten.

    Dokumentation: [iMessage](/de/channels/imessage), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann den Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen den Gateway nicht aus - sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Übliches Muster:

    - Gateway auf dem Mac mini (always-on).
    - MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um ihn zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie dies auf einem Nicht-Produktions-Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn Ihre Konfiguration bereits Legacy-`@username`-Einträge enthält, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Schreiben Sie Ihrem Bot eine DM, führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot-API:

    - Schreiben Sie Ihrem Bot eine DM, rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Schreiben Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Session Store erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist pro WhatsApp-Konto global. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen „Fast Chat“-Agent und einen „Opus for Coding“-Agent ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agent ein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agent. Eine Beispielkonfiguration finden Sie in [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnellsetup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Dienst-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Aktuelle Builds stellen außerdem häufige Benutzer-bin-Verzeichnisse auf Linux-systemd-Diensten voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm-Installation">
    - **Hackbare (Git-)Installation:** vollständiger Source-Checkout, editierbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm-Installation:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen von npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dies **löscht Ihre Daten nicht** - es ändert nur die OpenClaw-Code-Installation.
    Ihr Zustand (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unverändert.

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

    Auch der Installer kann beide Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](/de/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Sollte ich den Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurzfassung: **Wenn Sie Zuverlässigkeit rund um die Uhr möchten, verwenden Sie einen VPS**. Wenn Sie
    möglichst wenig Aufwand möchten und Standby/Neustarts akzeptabel sind, führen Sie ihn lokal aus.

    **Laptop (lokaler Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Standby-/Netzwerkausfälle = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** dauerhaft verfügbar, stabiles Netzwerk, keine Standby-Probleme des Laptops, einfacher dauerhaft am Laufen zu halten.
    - **Nachteile:** oft headless ausgeführt (Screenshots verwenden), nur Remote-Dateizugriff, für Updates müssen Sie SSH verwenden.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren alle problemlos von einem VPS aus. Der einzige echte Kompromiss ist **headless Browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardeinstellung:** VPS, wenn es zuvor Gateway-Verbindungsabbrüche gab. Lokal ist ideal, wenn Sie den Mac aktiv nutzen und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser wünschen.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolation empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** dauerhaft verfügbar, weniger Standby-/Neustart-Unterbrechungen, sauberere Berechtigungen, einfacher dauerhaft am Laufen zu halten.
    - **Gemeinsam genutzter Laptop/Desktop:** völlig ausreichend für Tests und aktive Nutzung, aber rechnen Sie mit Pausen, wenn der Rechner in den Standby wechselt oder Updates ausführt.

    Wenn Sie das Beste aus beiden Welten möchten, belassen Sie den Gateway auf einem dedizierten Host und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Ausführungs-Tools. Siehe [Nodes](/de/nodes).
    Sicherheitsleitlinien finden Sie unter [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und das empfohlene OS?">
    OpenClaw ist leichtgewichtig. Für einen einfachen Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1-2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenintensiv sein.

    OS: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM genauso wie einen VPS: Sie muss dauerhaft eingeschaltet, erreichbar sein und genügend
    RAM für den Gateway und alle aktivierten Kanäle haben.

    Grundlegende Leitlinien:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medien-Tools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 die einfachste VM-artige Einrichtung** und bietet die beste Tooling-
    Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandte Themen

- [FAQ](/de/help/faq) — die wichtigsten FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
