---
read_when:
    - Neue Installation, festhängendes Onboarding oder Fehler beim ersten Start
    - Auswahl von Authentifizierung und Provider-Abonnements
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-04-25T18:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  Fragen und Antworten zu Schnellstart und Einrichtung beim ersten Start. Für den alltäglichen Betrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich hänge fest – was ist der schnellste Weg, wieder weiterzukommen?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver, als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind,
    die Remote-Helfer nicht untersuchen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repository lesen, Befehle ausführen, Logs prüfen und dabei helfen, Ihre Rechner-Einrichtung
    zu reparieren (PATH, Dienste, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (Git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code und die Docs lesen und
    auf Grundlage der exakten Version argumentieren kann, die Sie ausführen. Sie können später jederzeit wieder auf Stable wechseln,
    indem Sie das Installationsprogramm ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Behebung **zu planen und zu begleiten** (Schritt für Schritt) und dann nur die
    notwendigen Befehle auszuführen. So bleiben Änderungen klein und leichter prüfbar.

    Wenn Sie einen echten Fehler oder eine echte Behebung entdecken, eröffnen Sie bitte ein GitHub-Issue oder senden Sie einen PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Beginnen Sie mit diesen Befehlen (teilen Sie die Ausgaben, wenn Sie um Hilfe bitten):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Was sie tun:

    - `openclaw status`: schnelle Übersicht über Gateway-/Agent-Zustand und grundlegende Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung und Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Statusprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird immer übersprungen. Was bedeuten die Überspringgründe?">
    Häufige Gründe dafür, dass Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Active-Hours-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere bzw. nur Header-Gerüste
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle ausgeschaltet)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach Abschluss eines echten Heartbeat-Laufs weitergeschoben.
    Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode, OpenClaw zu installieren und einzurichten">
    Das Repository empfiehlt, aus dem Quellcode zu starten und das Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie das Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (für Mitwirkende/Entwickler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Wenn Sie noch keine globale Installation haben, führen Sie sie mit `pnpm openclaw onboard` aus.

  </Accordion>

  <Accordion title="Wie öffne ich das Dashboard nach dem Onboarding?">
    Der Assistent öffnet direkt nach dem Onboarding Ihren Browser mit einer sauberen Dashboard-URL (ohne Token) und gibt den Link auch in der Zusammenfassung aus. Lassen Sie diesen Tab geöffnet; wenn er nicht gestartet wurde, kopieren Sie die ausgegebene URL und fügen Sie sie auf demselben Rechner ein.
  </Accordion>

  <Accordion title="Wie authentifiziere ich das Dashboard auf localhost bzw. remote?">
    **Localhost (derselbe Rechner):**

    - Öffnen Sie `http://127.0.0.1:18789/`.
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Control-UI-Einstellungen ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie ein Token mit `openclaw doctor --generate-gateway-token`.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Behalten Sie local loopback als Bind-Adresse bei, führen Sie `openclaw gateway --tailscale serve` aus und öffnen Sie `https://<magicdns>/`. Wenn `gateway.auth.allowTailscale` auf `true` gesetzt ist, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, sofern Sie nicht bewusst private-ingress `none` oder HTTP-Authentifizierung über einen trusted proxy verwenden.
      Gleichzeitige fehlerhafte Serve-Authentifizierungsversuche desselben Clients werden serialisiert, bevor der Limiter für fehlgeschlagene Authentifizierungen sie erfasst; daher kann bereits der zweite fehlerhafte Wiederholungsversuch `retry later` anzeigen.
    - **Tailnet-Bind**: Führen Sie `openclaw gateway --bind tailnet --token "<token>"` aus (oder konfigurieren Sie Passwort-Authentifizierung), öffnen Sie `http://<tailscale-ip>:18789/` und fügen Sie dann das passende Shared Secret in den Dashboard-Einstellungen ein.
    - **Identitätsbewusster Reverse Proxy**: Betreiben Sie das Gateway hinter einem trusted proxy ohne loopback, konfigurieren Sie `gateway.auth.mode: "trusted-proxy"` und öffnen Sie dann die Proxy-URL.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt weiterhin über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/de/web/dashboard) und [Web-Oberflächen](/de/web) für Details zu Bind-Modi und Authentifizierung.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsabfragen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Channel zu einem nativen Genehmigungs-Client für Exec-Genehmigungen

    Die Host-Exec-Richtlinie ist weiterhin das eigentliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wohin Genehmigungsabfragen
    erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beides:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Channel Genehmigende sicher ableiten kann, aktiviert OpenClaw nun automatisch DM-first native Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt ist oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte einen manuellen `/approve`-Befehl nur aufnehmen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur, wenn Abfragen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur, wenn Sie ausdrücklich möchten, dass Genehmigungsabfragen zurück in den ursprünglichen Raum/das ursprüngliche Thema gepostet werden.
    - Plugin-Genehmigungen sind nochmals getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optional die Weiterleitung `approvals.plugin`, und nur manche nativen Channels behalten darüber hinaus eine native Behandlung für Plugin-Genehmigungen bei.

    Kurz gesagt: Weiterleitung ist für Routing da, native Client-Konfiguration für eine reichhaltigere channel-spezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeit brauche ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig – in der Dokumentation werden **512 MB bis 1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung genannt, und es wird vermerkt, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie mehr Reserven möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das
    ist kein hartes Minimum.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-Betriebssystem und behalten Sie Node >= 22 bei.
    - Bevorzugen Sie die **hackbare (Git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Channels/Skills und fügen Sie sie dann nacheinander hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist das meist ein **ARM-Kompatibilitätsproblem**.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei „wake up my friend“ / das Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Das TUI sendet beim
    ersten Schlüpfen auch automatisch „Wake up, my friend!“. Wenn Sie diese Zeile **ohne Antwort**
    sehen und die Token bei 0 bleiben, wurde der Agent nie ausgeführt.

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

    3. Falls es weiterhin hängt, führen Sie aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding erneut zu machen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace** und führen Sie dann Doctor einmal aus. Dadurch
    bleibt Ihr Bot „genau gleich“ (Speicher, Sitzungsverlauf, Authentifizierung und Channel-Status),
    solange Sie **beide** Speicherorte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Auth-Profile, WhatsApp-Zugangsdaten, Sitzungen und Speicher erhalten. Wenn Sie
    im Remote-Modus sind, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern Sie
    **Speicher + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf der Festplatte liegen](#where-things-live-on-disk),
    [Agent-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Sehen Sie im GitHub-Changelog nach:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt mit **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt veröffentlichte Version. Einträge sind nach **Highlights**, **Änderungen** und
    **Fehlerbehebungen** gruppiert (plus Docs-/sonstige Abschnitte, wenn nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie diese Funktion oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns beim Entsperren, indem Sie es hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen können, werden die Docs auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen Stable und Beta">
    **Stable** und **Beta** sind **npm-dist-tags**, keine separaten Code-Linien:

    - `latest` = Stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine Stable-Version zuerst auf **beta**, dann verschiebt ein expliziter
    Promotion-Schritt genau diese Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können Beta und Stable nach der Promotion auf **dieselbe Version**
    zeigen.

    Sehen Sie nach, was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Einzeiler für die Installation und den Unterschied zwischen Beta und Dev finden Sie im Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version, und was ist der Unterschied zwischen Beta und Dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Head von `main` (Git); wenn veröffentlicht, verwendet es das npm-dist-tag `dev`.

    Einzeiler (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows-Installer (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Mehr Details: [Development channels](/de/install/development-channels) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie probiere ich die neuesten Bits aus?">
    Zwei Optionen:

    1. **Dev-Channel (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechseln Sie auf den Branch `main` und aktualisieren aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch erhalten Sie ein lokales Repository, das Sie bearbeiten und dann über Git aktualisieren können.

    Wenn Sie stattdessen lieber manuell einen sauberen Clone möchten, verwenden Sie:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Dokumentation: [Update](/de/cli/update), [Development channels](/de/install/development-channels),
    [Installieren](/de/install).

  </Accordion>

  <Accordion title="Wie lange dauern Installation und Onboarding normalerweise?">
    Grobe Orientierung:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, abhängig davon, wie viele Channels/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt fest](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife in [Ich hänge fest](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt fest? Wie bekomme ich mehr Feedback?">
    Führen Sie den Installer mit **ausführlicher Ausgabe** erneut aus:

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

  <Accordion title="Bei der Windows-Installation steht git not found oder openclaw not recognized">
    Zwei häufige Windows-Probleme:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie dann den Installer erneut aus.

    **2) openclaw is not recognized nach der Installation**

    - Ihr globaler npm-bin-Ordner ist nicht in PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis Ihrem Benutzer-PATH hinzu (unter Windows ist kein Suffix `\bin` nötig; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut, nachdem Sie PATH aktualisiert haben.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Windows-Exec-Ausgabe zeigt verstümmelten chinesischen Text – was soll ich tun?">
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

    Wenn Sie dies weiterhin mit der neuesten OpenClaw-Version reproduzieren können, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Docs haben meine Frage nicht beantwortet – wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (Git-)Installation**, damit Sie den vollständigen Quellcode und die Docs lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repository lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurze Antwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Dienstinstallation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installation & Updates](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Installationsanleitungen für Cloud/VPS?">
    Wir pflegen einen **Hosting-Hub** mit den gängigen Anbietern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Anbieter an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI darauf zu (oder über Tailscale/SSH). Ihr Status + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Source of Truth und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um
    auf lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während
    das Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurze Antwort: **möglich, aber nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung getrennt wird), möglicherweise einen sauberen Git-Checkout benötigen und
    um Bestätigung bitten. Sicherer ist es, Updates als Betreiber aus einer Shell auszuführen.

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

    Dokumentation: [Update](/de/cli/update), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Was macht das Onboarding eigentlich?">
    `openclaw onboard` ist der empfohlene Einrichtungsweg. Im **lokalen Modus** führt es Sie durch:

    - **Modell-/Auth-Einrichtung** (Provider-OAuth, API-Keys, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - Speicherort des **Workspace** + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Channel-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-User-Unit unter Linux/WSL2)
    - **Health Checks** und Auswahl von **Skills**

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Auth fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Keys** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Key**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Authentifizierung in OpenClaw**: Anthropic-Mitarbeiter
      haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Nutzung von `claude -p`
      als für diese Integration freigegeben, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Keys weiterhin das
    besser vorhersagbare Setup. OpenAI Codex OAuth wird ausdrücklich für externe
    Tools wie OpenClaw unterstützt.

    OpenClaw unterstützt außerdem andere gehostete abonnementähnliche Optionen, darunter
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM Models](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich Claude-Max-Abonnement ohne API-Key verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass die Claude-CLI-Nutzung im Stil von OpenClaw wieder erlaubt ist, daher
    behandelt OpenClaw die Claude-Abonnement-Authentifizierung und die Nutzung von `claude -p` als für diese
    Integration freigegeben, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie das
    am besten vorhersagbare serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic-API-Key.

  </Accordion>

  <Accordion title="Unterstützt ihr Claude-Abonnement-Authentifizierung (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns mitgeteilt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als für diese Integration freigegeben,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Das Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktion oder Multi-User-Workloads ist die Authentifizierung per Anthropic-API-Key weiterhin die
    sicherere, besser vorhersagbare Wahl. Wenn Sie andere abonnementähnliche gehostete
    Optionen in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM
    Models](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Ratenlimit** für das aktuelle Zeitfenster ausgeschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Zeitfenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Key** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung konkret lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    das 1M-Context-Beta von Anthropic (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Zugangsdaten für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktiviertem Extra Usage).

    Tipp: Legen Sie ein **Fallback-Modell** fest, damit OpenClaw weiter antworten kann, während ein Provider rate-limited ist.
    Siehe [Models](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten Provider **Amazon Bedrock (Converse)**. Wenn AWS-Umgebungsmarker vorhanden sind, kann OpenClaw den Bedrock-Katalog für Streaming/Text automatisch erkennen und ihn als impliziten Provider `amazon-bedrock` zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Providereintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Flow bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai-codex/gpt-5.5` für Codex-OAuth über den Standard-PI-Runner. Verwenden Sie
    `openai/gpt-5.5` für direkten OpenAI-API-Key-Zugriff. GPT-5.5 kann auch
    Abonnement/OAuth über `openai-codex/gpt-5.5` oder native Codex-App-Server-
    Läufe mit `openai/gpt-5.5` und `embeddedHarness.runtime: "codex"` verwenden.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw immer noch openai-codex?">
    `openai-codex` ist die Provider- und Auth-Profile-ID für ChatGPT/Codex-OAuth.
    Es ist außerdem das explizite PI-Modellpräfix für Codex-OAuth:

    - `openai/gpt-5.5` = aktueller direkter OpenAI-API-Key-Pfad in PI
    - `openai-codex/gpt-5.5` = Codex-OAuth-Pfad in PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = nativer Codex-App-Server-Pfad
    - `openai-codex:...` = Auth-Profile-ID, keine Modellreferenz

    Wenn Sie den direkten Abrechnungs-/Limitpfad der OpenAI Platform möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT/Codex-Abonnement-Authentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an und verwenden Sie
    `openai-codex/*`-Modellreferenzen für PI-Läufe.

  </Accordion>

  <Accordion title="Warum können sich Codex-OAuth-Limits von ChatGPT Web unterscheiden?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der Erfahrung auf der ChatGPT-Website/-App unterscheiden, selbst wenn
    beide mit demselben Konto verknüpft sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, aber es erfindet oder normalisiert keine ChatGPT-Web-
    Berechtigungen zu direktem API-Zugriff. Wenn Sie den direkten Abrechnungs-/Limitpfad der OpenAI Platform
    möchten, verwenden Sie `openai/*` mit einem API-Key.

  </Accordion>

  <Accordion title="Unterstützt ihr OpenAI-Abonnement-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt **OpenAI Code (Codex) subscription OAuth** vollständig.
    OpenAI erlaubt ausdrücklich die Nutzung von subscription OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Flow für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Auth-Flow**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` in `PATH` ist
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmeldung: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach der Anmeldung: `google-gemini-cli/gemini-3-flash-preview`
    5. Falls Anfragen fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Auth-Profilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats in Ordnung?">
    Meistens nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten kürzen ab und leaken. Falls Sie unbedingt eines verwenden müssen, führen Sie das **größte** Modell-Build aus, das Sie lokal betreiben können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko von Prompt Injection – siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich Traffic zu gehosteten Modellen in einer bestimmten Region?">
    Wählen Sie Endpunkte mit festgelegter Region. OpenRouter stellt US-gehostete Optionen für MiniMax, Kimi und GLM bereit; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben aufführen, indem Sie `models.mode: "merge"` verwenden, damit Fallbacks verfügbar bleiben und gleichzeitig der regional festgelegte Provider respektiert wird, den Sie auswählen.
  </Accordion>

  <Accordion title="Muss ich einen Mac mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional – manche
    kaufen einen als ständig aktiven Host, aber auch ein kleiner VPS, Heimserver oder eine Box in Raspberry-Pi-Klasse funktioniert.

    Sie brauchen einen Mac nur **für macOS-only Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) – der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere nur unter macOS verfügbare Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich einen Mac mini für iMessage-Unterstützung?">
    Sie benötigen **irgendein macOS-Gerät**, das in Messages angemeldet ist. Es muss **kein** Mac mini sein –
    jeder Mac funktioniert. Verwenden Sie für iMessage **[BlueBubbles](/de/channels/bluebubbles)** (empfohlen) – der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Gängige Setups:

    - Führen Sie das Gateway auf Linux/VPS aus und den BlueBubbles-Server auf einem beliebigen Mac, der in Messages angemeldet ist.
    - Führen Sie alles auf dem Mac aus, wenn Sie das einfachste Setup auf einem einzelnen Rechner möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac remote mode](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Begleitgerät) verbinden. Nodes führen das Gateway nicht aus – sie stellen zusätzliche
    Fähigkeiten wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät bereit.

    Häufiges Muster:

    - Gateway auf dem Mac mini (always-on).
    - Das MacBook Pro führt die macOS-App oder einen Node-Host aus und koppelt sich mit dem Gateway.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es zu sehen.

    Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie trotzdem mit Bun experimentieren möchten, tun Sie dies auf einem nicht produktiven Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Beim Setup werden nur numerische Benutzer-IDs abgefragt. Wenn Sie bereits veraltete `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (ohne Drittanbieter-Bot):

    - Schreiben Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Schreiben Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Schreiben Sie `@userinfobot` oder `@getidsbot` eine DM.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, damit jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffssteuerung (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für "fast chat" und einen Agenten "Opus for coding" ausführen?'>
    Ja. Verwenden Sie Multi-Agent Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Eine Beispielkonfiguration finden Sie unter [Multi-Agent Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelles Setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der Dienst-PATH `/home/linuxbrew/.linuxbrew/bin` (oder Ihr brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen unter Linux-systemd-Diensten außerdem gängige Benutzer-bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn sie gesetzt sind.

  </Accordion>

  <Accordion title="Unterschied zwischen hackbarer Git-Installation und npm install">
    - **Hackbare (Git-)Installation:** vollständiger Source-Checkout, editierbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Docs patchen.
    - **npm install:** globale CLI-Installation, kein Repository, am besten für „einfach nur ausführen“.
      Updates kommen von npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja. Installieren Sie die andere Variante und führen Sie dann Doctor aus, damit der Gateway-Dienst auf den neuen Entry Point zeigt.
    Dadurch werden **Ihre Daten nicht gelöscht** – es ändert nur die OpenClaw-Codeinstallation. Ihr Status
    (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unberührt.

    Von npm zu Git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Von Git zu npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor erkennt einen Mismatch beim Entry Point des Gateway-Dienstes und bietet an, die Dienstkonfiguration so umzuschreiben, dass sie zur aktuellen Installation passt (verwenden Sie `--repair` in der Automatisierung).

    Tipps zur Sicherung: siehe [Backup-Strategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurze Antwort: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung möchten und Schlafmodus/Neustarts akzeptieren, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster in Echtzeit.
    - **Nachteile:** Schlafmodus/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss aktiv bleiben.

    **VPS / Cloud**

    - **Vorteile:** always-on, stabiles Netzwerk, keine Probleme durch Laptop-Schlafmodus, einfacher dauerhaft zu betreiben.
    - **Nachteile:** oft headless betrieben (Screenshots verwenden), nur Remote-Dateizugriff, Sie müssen Updates per SSH durchführen.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren auf einem VPS problemlos. Der einzige echte Trade-off ist **headless browser** gegenüber einem sichtbaren Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlene Standardwahl:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist ideal, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit einem sichtbaren Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einem dedizierten Rechner auszuführen?">
    Nicht erforderlich, aber **für Zuverlässigkeit und Isolierung empfohlen**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** always-on, weniger Unterbrechungen durch Schlafmodus/Neustarts, sauberere Berechtigungen, einfacher dauerhaft zu betreiben.
    - **Gemeinsam genutzter Laptop/Desktop:** für Tests und aktive Nutzung völlig in Ordnung, aber rechnen Sie mit Pausen, wenn der Rechner in den Schlafmodus geht oder Updates ausführt.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie das Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitsrichtlinien lesen Sie [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die minimalen VPS-Anforderungen und welches Betriebssystem wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein grundlegendes Gateway + einen Chat-Channel:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Festplattenspeicher.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Channels). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    Betriebssystem: Verwenden Sie **Ubuntu LTS** (oder ein anderes modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen, und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM genauso wie einen VPS: Sie muss always-on sein, erreichbar sein und genug
    RAM für das Gateway und alle aktivierten Channels haben.

    Grundlegende Orientierung:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Channels, Browser-Automatisierung oder Medientools ausführen.
    - **Betriebssystem:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie Windows verwenden, ist **WSL2 das einfachste VM-artige Setup** und bietet die beste
    Tooling-Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit und mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
