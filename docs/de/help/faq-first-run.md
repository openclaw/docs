---
read_when:
    - Neuinstallation, hängendes Onboarding oder Fehler beim ersten Start
    - Authentifizierung und Provider-Abonnements auswählen
    - Kein Zugriff auf docs.openclaw.ai, Dashboard lässt sich nicht öffnen, Installation hängt fest
sidebarTitle: First-run FAQ
summary: 'FAQ: Schnellstart und Einrichtung beim ersten Start — Installation, Onboarding, Authentifizierung, Abonnements, anfängliche Fehler'
title: 'FAQ: Einrichtung beim ersten Start'
x-i18n:
    generated_at: "2026-04-26T11:31:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Fragen und Antworten zu Schnellstart und Einrichtung beim ersten Start. Für den täglichen Betrieb, Modelle, Authentifizierung, Sitzungen
  und Fehlerbehebung siehe die Haupt-[FAQ](/de/help/faq).

  ## Schnellstart und Einrichtung beim ersten Start

  <AccordionGroup>
  <Accordion title="Ich hänge fest — was ist der schnellste Weg, wieder weiterzukommen?">
    Verwenden Sie einen lokalen KI-Agenten, der **Ihren Rechner sehen kann**. Das ist deutlich effektiver als
    in Discord zu fragen, weil die meisten Fälle von „Ich hänge fest“ **lokale Konfigurations- oder Umgebungsprobleme** sind, die
    Remote-Helfer nicht prüfen können.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Diese Tools können das Repo lesen, Befehle ausführen, Logs prüfen und Ihnen helfen, Ihr Setup auf Maschinenebene
    zu reparieren (PATH, Dienste, Berechtigungen, Auth-Dateien). Geben Sie ihnen den **vollständigen Source-Checkout** über
    die hackbare (Git-)Installation:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Dadurch wird OpenClaw **aus einem Git-Checkout** installiert, sodass der Agent den Code + die Dokumentation lesen und
    über die genaue Version nachdenken kann, die Sie ausführen. Sie können später jederzeit wieder auf stable wechseln,
    indem Sie den Installer ohne `--install-method git` erneut ausführen.

    Tipp: Bitten Sie den Agenten, die Korrektur **zu planen und zu beaufsichtigen** (Schritt für Schritt) und dann nur die
    nötigen Befehle auszuführen. So bleiben Änderungen klein und lassen sich leichter auditieren.

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

    - `openclaw status`: schneller Snapshot des Zustands von Gateway/Agent + grundlegender Konfiguration.
    - `openclaw models status`: prüft Provider-Authentifizierung + Modellverfügbarkeit.
    - `openclaw doctor`: validiert und repariert häufige Konfigurations-/Statusprobleme.

    Weitere nützliche CLI-Prüfungen: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Schnelle Debug-Schleife: [Die ersten 60 Sekunden, wenn etwas kaputt ist](#first-60-seconds-if-something-is-broken).
    Installationsdokumentation: [Installieren](/de/install), [Installer-Flags](/de/install/installer), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Heartbeat wird ständig übersprungen. Was bedeuten die Skip-Gründe?">
    Häufige Gründe, warum Heartbeat übersprungen wird:

    - `quiet-hours`: außerhalb des konfigurierten Aktivstunden-Fensters
    - `empty-heartbeat-file`: `HEARTBEAT.md` existiert, enthält aber nur leere/header-only-Struktur
    - `no-tasks-due`: Der Aufgabenmodus von `HEARTBEAT.md` ist aktiv, aber noch keines der Aufgabenintervalle ist fällig
    - `alerts-disabled`: die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus)

    Im Aufgabenmodus werden Fälligkeitszeitstempel erst nach einem echten Heartbeat-Durchlauf
    weitergesetzt. Übersprungene Läufe markieren Aufgaben nicht als abgeschlossen.

    Dokumentation: [Heartbeat](/de/gateway/heartbeat), [Automatisierung & Aufgaben](/de/automation).

  </Accordion>

  <Accordion title="Empfohlene Methode zum Installieren und Einrichten von OpenClaw">
    Das Repo empfiehlt, aus dem Quellcode zu laufen und das Onboarding zu verwenden:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Der Assistent kann UI-Assets auch automatisch bauen. Nach dem Onboarding führen Sie das Gateway typischerweise auf Port **18789** aus.

    Aus dem Quellcode (Mitwirkende/Dev):

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
    - Wenn nach Shared-Secret-Authentifizierung gefragt wird, fügen Sie das konfigurierte Token oder Passwort in die Einstellungen der Control UI ein.
    - Token-Quelle: `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
    - Passwort-Quelle: `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
    - Wenn noch kein Shared Secret konfiguriert ist, erzeugen Sie mit `openclaw doctor --generate-gateway-token` ein Token.

    **Nicht auf localhost:**

    - **Tailscale Serve** (empfohlen): Bind auf Loopback belassen, `openclaw gateway --tailscale serve` ausführen, `https://<magicdns>/` öffnen. Wenn `gateway.auth.allowTailscale` `true` ist, erfüllen Identitäts-Header die Authentifizierung für Control UI/WebSocket (kein eingefügtes Shared Secret, setzt einen vertrauenswürdigen Gateway-Host voraus); HTTP-APIs erfordern weiterhin Shared-Secret-Authentifizierung, sofern Sie nicht absichtlich `none` für privaten Ingress oder HTTP-Authentifizierung per trusted-proxy verwenden.
      Schlechte gleichzeitige Serve-Authentifizierungsversuche vom selben Client werden serialisiert, bevor der Failed-Auth-Limiter sie aufzeichnet, sodass bereits der zweite fehlerhafte Retry `retry later` anzeigen kann.
    - **Tailnet-Bind**: `openclaw gateway --bind tailnet --token "<token>"` ausführen (oder Passwort-Authentifizierung konfigurieren), `http://<tailscale-ip>:18789/` öffnen und dann das passende Shared Secret in die Dashboard-Einstellungen einfügen.
    - **Identitätsbewusster Reverse Proxy**: Das Gateway hinter einem nicht-loopback trusted-proxy belassen, `gateway.auth.mode: "trusted-proxy"` konfigurieren und dann die Proxy-URL öffnen.
    - **SSH-Tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, dann `http://127.0.0.1:18789/` öffnen. Shared-Secret-Authentifizierung gilt auch über den Tunnel; fügen Sie bei Aufforderung das konfigurierte Token oder Passwort ein.

    Siehe [Dashboard](/de/web/dashboard) und [Weboberflächen](/de/web) für Details zu Bind-Modi und Authentifizierung.

  </Accordion>

  <Accordion title="Warum gibt es zwei Exec-Genehmigungskonfigurationen für Chat-Genehmigungen?">
    Sie steuern unterschiedliche Ebenen:

    - `approvals.exec`: leitet Genehmigungsaufforderungen an Chat-Ziele weiter
    - `channels.<channel>.execApprovals`: macht diesen Kanal zu einem nativen Genehmigungs-Client für Exec-Genehmigungen

    Die Host-Exec-Richtlinie ist weiterhin das eigentliche Genehmigungs-Gate. Die Chat-Konfiguration steuert nur, wo Genehmigungsaufforderungen
    erscheinen und wie Personen darauf antworten können.

    In den meisten Setups benötigen Sie **nicht** beide:

    - Wenn der Chat bereits Befehle und Antworten unterstützt, funktioniert `/approve` im selben Chat über den gemeinsamen Pfad.
    - Wenn ein unterstützter nativer Kanal Genehmiger sicher ableiten kann, aktiviert OpenClaw jetzt automatisch DM-first-native-Genehmigungen, wenn `channels.<channel>.execApprovals.enabled` nicht gesetzt oder `"auto"` ist.
    - Wenn native Genehmigungskarten/-Schaltflächen verfügbar sind, ist diese native UI der primäre Pfad; der Agent sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Pfad ist.
    - Verwenden Sie `approvals.exec` nur dann, wenn Aufforderungen zusätzlich an andere Chats oder explizite Ops-Räume weitergeleitet werden müssen.
    - Verwenden Sie `channels.<channel>.execApprovals.target: "channel"` oder `"both"` nur dann, wenn Sie explizit möchten, dass Genehmigungsaufforderungen zurück in den Ursprungsraum/-Topic gepostet werden.
    - Plugin-Genehmigungen sind nochmals getrennt: Sie verwenden standardmäßig `/approve` im selben Chat, optionales `approvals.plugin`-Weiterleiten, und nur einige native Kanäle behalten darüber hinaus Plugin-Genehmigungen mit nativer Behandlung.

    Kurzfassung: Weiterleitung ist für Routing da, die native Client-Konfiguration für reichhaltigere kanalspezifische UX.
    Siehe [Exec-Genehmigungen](/de/tools/exec-approvals).

  </Accordion>

  <Accordion title="Welche Laufzeit benötige ich?">
    Node **>= 22** ist erforderlich. `pnpm` wird empfohlen. Bun wird für das Gateway **nicht empfohlen**.
  </Accordion>

  <Accordion title="Läuft es auf Raspberry Pi?">
    Ja. Das Gateway ist leichtgewichtig — die Dokumentation nennt **512 MB bis 1 GB RAM**, **1 Kern** und etwa **500 MB**
    Speicherplatz als ausreichend für die persönliche Nutzung und weist darauf hin, dass ein **Raspberry Pi 4 es ausführen kann**.

    Wenn Sie mehr Reserve möchten (Logs, Medien, andere Dienste), werden **2 GB empfohlen**, aber das
    ist keine harte Mindestanforderung.

    Tipp: Ein kleiner Pi/VPS kann das Gateway hosten, und Sie können **Nodes** auf Ihrem Laptop/Telefon koppeln für
    lokalen Bildschirm/Kamera/Canvas oder Befehlsausführung. Siehe [Nodes](/de/nodes).

  </Accordion>

  <Accordion title="Gibt es Tipps für Installationen auf Raspberry Pi?">
    Kurz gesagt: Es funktioniert, aber rechnen Sie mit Ecken und Kanten.

    - Verwenden Sie ein **64-Bit**-OS und behalten Sie Node >= 22 bei.
    - Bevorzugen Sie die **hackbare (Git-)Installation**, damit Sie Logs sehen und schnell aktualisieren können.
    - Starten Sie ohne Kanäle/Skills und fügen Sie sie dann einzeln hinzu.
    - Wenn Sie auf seltsame Binärprobleme stoßen, ist es meist ein **ARM-Kompatibilitäts**problem.

    Dokumentation: [Linux](/de/platforms/linux), [Installieren](/de/install).

  </Accordion>

  <Accordion title="Es hängt bei wake up my friend / Onboarding schlüpft nicht. Was nun?">
    Dieser Bildschirm hängt davon ab, dass das Gateway erreichbar und authentifiziert ist. Die TUI sendet
    beim ersten Schlüpfen außerdem automatisch „Wake up, my friend!“. Wenn Sie diese Zeile mit **keiner Antwort**
    sehen und die Tokens bei 0 bleiben, wurde der Agent nie ausgeführt.

    1. Starten Sie das Gateway neu:

    ```bash
    openclaw gateway restart
    ```

    2. Prüfen Sie Status + Authentifizierung:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Wenn es weiterhin hängt, führen Sie aus:

    ```bash
    openclaw doctor
    ```

    Wenn das Gateway remote ist, stellen Sie sicher, dass die Tunnel-/Tailscale-Verbindung aktiv ist und dass die UI
    auf das richtige Gateway zeigt. Siehe [Remote-Zugriff](/de/gateway/remote).

  </Accordion>

  <Accordion title="Kann ich mein Setup auf einen neuen Rechner (Mac mini) migrieren, ohne das Onboarding neu zu machen?">
    Ja. Kopieren Sie das **Statusverzeichnis** und den **Workspace**, und führen Sie dann einmal Doctor aus. So
    bleibt Ihr Bot „genau gleich“ (Memory, Sitzungsverlauf, Authentifizierung und Kanal-
    status), solange Sie **beide** Orte kopieren:

    1. Installieren Sie OpenClaw auf dem neuen Rechner.
    2. Kopieren Sie `$OPENCLAW_STATE_DIR` (Standard: `~/.openclaw`) vom alten Rechner.
    3. Kopieren Sie Ihren Workspace (Standard: `~/.openclaw/workspace`).
    4. Führen Sie `openclaw doctor` aus und starten Sie den Gateway-Dienst neu.

    Dadurch bleiben Konfiguration, Authentifizierungsprofile, WhatsApp-Anmeldedaten, Sitzungen und Memory erhalten. Wenn Sie im
    Remote-Modus sind, denken Sie daran, dass der Gateway-Host den Sitzungsspeicher und den Workspace besitzt.

    **Wichtig:** Wenn Sie nur Ihren Workspace in GitHub committen/pushen, sichern
    Sie **Memory + Bootstrap-Dateien**, aber **nicht** Sitzungsverlauf oder Authentifizierung. Diese liegen
    unter `~/.openclaw/` (zum Beispiel `~/.openclaw/agents/<agentId>/sessions/`).

    Verwandt: [Migrieren](/de/install/migrating), [Wo Dinge auf dem Datenträger liegen](#where-things-live-on-disk),
    [Agenten-Workspace](/de/concepts/agent-workspace), [Doctor](/de/gateway/doctor),
    [Remote-Modus](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sehe ich, was in der neuesten Version neu ist?">
    Prüfen Sie das GitHub-Changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Die neuesten Einträge stehen oben. Wenn der oberste Abschnitt als **Unreleased** markiert ist, ist der nächste datierte
    Abschnitt die zuletzt ausgelieferte Version. Einträge sind nach **Highlights**, **Changes** und
    **Fixes** gruppiert (plus Dokumentation/andere Abschnitte, falls nötig).

  </Accordion>

  <Accordion title="Kein Zugriff auf docs.openclaw.ai (SSL-Fehler)">
    Einige Comcast-/Xfinity-Verbindungen blockieren `docs.openclaw.ai` fälschlicherweise über Xfinity
    Advanced Security. Deaktivieren Sie dies oder setzen Sie `docs.openclaw.ai` auf die Allowlist und versuchen Sie es erneut.
    Bitte helfen Sie uns, die Blockierung aufzuheben, indem Sie hier melden: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Wenn Sie die Website weiterhin nicht erreichen, werden die Dokumente auf GitHub gespiegelt:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Unterschied zwischen stable und beta">
    **Stable** und **beta** sind **npm-dist-tags**, keine separaten Code-Linien:

    - `latest` = stable
    - `beta` = früher Build zum Testen

    Normalerweise landet eine Stable-Version zuerst auf **beta**, dann verschiebt ein expliziter
    Promotion-Schritt genau diese Version nach `latest`. Maintainer können bei Bedarf auch
    direkt nach `latest` veröffentlichen. Deshalb können beta und stable nach der Promotion auf **dieselbe Version** zeigen.

    Was sich geändert hat:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Für Einzeiler zur Installation und den Unterschied zwischen beta und dev siehe das Accordion unten.

  </Accordion>

  <Accordion title="Wie installiere ich die Beta-Version und was ist der Unterschied zwischen beta und dev?">
    **Beta** ist das npm-dist-tag `beta` (kann nach der Promotion mit `latest` übereinstimmen).
    **Dev** ist der bewegliche Stand von `main` (Git); wenn veröffentlicht, verwendet es das npm-dist-tag `dev`.

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

    1. **Dev-Kanal (Git-Checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Dadurch wechseln Sie auf den Branch `main` und aktualisieren aus dem Quellcode.

    2. **Hackbare Installation (von der Installer-Website):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Damit erhalten Sie ein lokales Repo, das Sie bearbeiten und dann per Git aktualisieren können.

    Wenn Sie lieber manuell einen sauberen Clone möchten, verwenden Sie:

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
    Ungefähre Richtwerte:

    - **Installation:** 2–5 Minuten
    - **Onboarding:** 5–15 Minuten, abhängig davon, wie viele Kanäle/Modelle Sie konfigurieren

    Wenn es hängt, verwenden Sie [Installer hängt fest](#quick-start-and-first-run-setup)
    und die schnelle Debug-Schleife unter [Ich hänge fest](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer hängt fest? Wie bekomme ich mehr Rückmeldung?">
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
    # install.ps1 hat noch kein dediziertes -Verbose-Flag.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Weitere Optionen: [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Windows-Installation meldet git not found oder openclaw not recognized">
    Zwei häufige Probleme unter Windows:

    **1) npm-Fehler spawn git / git not found**

    - Installieren Sie **Git for Windows** und stellen Sie sicher, dass `git` in Ihrem PATH ist.
    - Schließen und öffnen Sie PowerShell erneut und führen Sie den Installer erneut aus.

    **2) openclaw is not recognized nach der Installation**

    - Ihr globaler npm-bin-Ordner ist nicht im PATH.
    - Prüfen Sie den Pfad:

      ```powershell
      npm config get prefix
      ```

    - Fügen Sie dieses Verzeichnis zu Ihrem Benutzer-PATH hinzu (unter Windows ohne Suffix `\bin`; auf den meisten Systemen ist es `%AppData%\npm`).
    - Schließen und öffnen Sie PowerShell erneut, nachdem Sie PATH aktualisiert haben.

    Wenn Sie das reibungsloseste Windows-Setup möchten, verwenden Sie **WSL2** statt nativem Windows.
    Dokumentation: [Windows](/de/platforms/windows).

  </Accordion>

  <Accordion title="Die Exec-Ausgabe unter Windows zeigt verstümmelten chinesischen Text — was soll ich tun?">
    Das ist normalerweise ein Mismatch der Konsolen-Codepage in nativen Windows-Shells.

    Symptome:

    - Die Ausgabe von `system.run`/`exec` rendert Chinesisch als Mojibake
    - Derselbe Befehl sieht in einem anderen Terminalprofil korrekt aus

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

    Wenn sich das weiterhin mit der neuesten OpenClaw-Version reproduzieren lässt, verfolgen/melden Sie es hier:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Die Dokumentation hat meine Frage nicht beantwortet — wie bekomme ich eine bessere Antwort?">
    Verwenden Sie die **hackbare (Git-)Installation**, damit Sie den vollständigen Quellcode und die Dokumentation lokal haben, und fragen Sie dann
    Ihren Bot (oder Claude/Codex) _aus diesem Ordner heraus_, damit er das Repo lesen und präzise antworten kann.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mehr Details: [Installieren](/de/install) und [Installer-Flags](/de/install/installer).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw unter Linux?">
    Kurze Antwort: Folgen Sie der Linux-Anleitung und führen Sie dann das Onboarding aus.

    - Linux-Schnellpfad + Service-Installation: [Linux](/de/platforms/linux).
    - Vollständige Schritt-für-Schritt-Anleitung: [Erste Schritte](/de/start/getting-started).
    - Installer + Updates: [Installieren & Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Wie installiere ich OpenClaw auf einem VPS?">
    Jeder Linux-VPS funktioniert. Installieren Sie auf dem Server und verwenden Sie dann SSH/Tailscale, um das Gateway zu erreichen.

    Anleitungen: [exe.dev](/de/install/exe-dev), [Hetzner](/de/install/hetzner), [Fly.io](/de/install/fly).
    Remote-Zugriff: [Gateway remote](/de/gateway/remote).

  </Accordion>

  <Accordion title="Wo sind die Cloud-/VPS-Installationsanleitungen?">
    Wir haben einen **Hosting-Hub** mit den gängigen Providern. Wählen Sie einen aus und folgen Sie der Anleitung:

    - [VPS-Hosting](/de/vps) (alle Provider an einem Ort)
    - [Fly.io](/de/install/fly)
    - [Hetzner](/de/install/hetzner)
    - [exe.dev](/de/install/exe-dev)

    So funktioniert es in der Cloud: Das **Gateway läuft auf dem Server**, und Sie greifen
    von Ihrem Laptop/Telefon über die Control UI (oder Tailscale/SSH) darauf zu. Ihr Status + Workspace
    liegen auf dem Server, behandeln Sie den Host also als Source of Truth und sichern Sie ihn.

    Sie können **Nodes** (Mac/iOS/Android/headless) mit diesem Cloud-Gateway koppeln, um auf
    lokalen Bildschirm/Kamera/Canvas zuzugreifen oder Befehle auf Ihrem Laptop auszuführen, während das
    Gateway in der Cloud bleibt.

    Hub: [Plattformen](/de/platforms). Remote-Zugriff: [Gateway remote](/de/gateway/remote).
    Nodes: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich OpenClaw bitten, sich selbst zu aktualisieren?">
    Kurz gesagt: **möglich, aber nicht empfohlen**. Der Update-Ablauf kann das
    Gateway neu starten (wodurch die aktive Sitzung unterbrochen wird), möglicherweise einen sauberen Git-Checkout benötigen und
    eine Bestätigung verlangen. Sicherer ist es, Updates als Operator aus einer Shell auszuführen.

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

    - **Modell-/Authentifizierungseinrichtung** (Provider-OAuth, API-Schlüssel, Anthropic-Setup-Token sowie lokale Modelloptionen wie LM Studio)
    - **Workspace**-Speicherort + Bootstrap-Dateien
    - **Gateway-Einstellungen** (Bind/Port/Auth/Tailscale)
    - **Kanäle** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage sowie gebündelte Kanal-Plugins wie QQ Bot)
    - **Daemon-Installation** (LaunchAgent unter macOS; systemd-User-Unit unter Linux/WSL2)
    - **Integritätsprüfungen** und **Skills**-Auswahl

    Es warnt außerdem, wenn Ihr konfiguriertes Modell unbekannt ist oder Authentifizierung fehlt.

  </Accordion>

  <Accordion title="Brauche ich ein Claude- oder OpenAI-Abonnement, um das auszuführen?">
    Nein. Sie können OpenClaw mit **API-Schlüsseln** (Anthropic/OpenAI/andere) oder mit
    **rein lokalen Modellen** ausführen, sodass Ihre Daten auf Ihrem Gerät bleiben. Abonnements (Claude
    Pro/Max oder OpenAI Codex) sind optionale Möglichkeiten, diese Provider zu authentifizieren.

    Für Anthropic in OpenClaw ist die praktische Aufteilung:

    - **Anthropic-API-Schlüssel**: normale Anthropic-API-Abrechnung
    - **Claude CLI / Claude-Abonnement-Authentifizierung in OpenClaw**: Anthropic-Mitarbeiter
      haben uns gesagt, dass diese Nutzung wieder erlaubt ist, und OpenClaw behandelt die Verwendung von `claude -p`
      als für diese Integration zulässig, sofern Anthropic keine neue
      Richtlinie veröffentlicht

    Für langlebige Gateway-Hosts sind Anthropic-API-Schlüssel weiterhin das besser
    vorhersagbare Setup. OpenAI-Codex-OAuth wird für externe
    Tools wie OpenClaw explizit unterstützt.

    OpenClaw unterstützt auch andere gehostete Abonnement-ähnliche Optionen, einschließlich
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** und
    **Z.AI / GLM Coding Plan**.

    Dokumentation: [Anthropic](/de/providers/anthropic), [OpenAI](/de/providers/openai),
    [Qwen Cloud](/de/providers/qwen),
    [MiniMax](/de/providers/minimax), [GLM-Modelle](/de/providers/glm),
    [Lokale Modelle](/de/gateway/local-models), [Modelle](/de/concepts/models).

  </Accordion>

  <Accordion title="Kann ich ein Claude-Max-Abonnement ohne API-Schlüssel verwenden?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass eine OpenClaw-artige Nutzung der Claude CLI wieder erlaubt ist, daher
    behandelt OpenClaw die Claude-Abonnement-Authentifizierung und die Verwendung von `claude -p` als für
    diese Integration zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn Sie
    das am besten vorhersagbare serverseitige Setup möchten, verwenden Sie stattdessen einen Anthropic-API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie Claude-Abonnement-Authentifizierung (Claude Pro oder Max)?">
    Ja.

    Anthropic-Mitarbeiter haben uns gesagt, dass diese Nutzung wieder erlaubt ist, daher behandelt OpenClaw
    die Wiederverwendung der Claude CLI und die Verwendung von `claude -p` als für diese Integration zulässig,
    sofern Anthropic keine neue Richtlinie veröffentlicht.

    Das Anthropic-Setup-Token ist weiterhin als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt Wiederverwendung der Claude CLI und `claude -p`, wenn verfügbar.
    Für Produktions- oder Multi-User-Workloads bleibt die Authentifizierung per Anthropic-API-Schlüssel
    die sicherere, besser vorhersagbare Wahl. Wenn Sie andere gehostete Optionen im Abonnementstil
    in OpenClaw möchten, siehe [OpenAI](/de/providers/openai), [Qwen / Model
    Cloud](/de/providers/qwen), [MiniMax](/de/providers/minimax) und [GLM-
    Modelle](/de/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Warum sehe ich HTTP 429 rate_limit_error von Anthropic?">
    Das bedeutet, dass Ihr **Anthropic-Kontingent/Rate Limit** für das aktuelle Fenster erschöpft ist. Wenn Sie
    **Claude CLI** verwenden, warten Sie, bis das Fenster zurückgesetzt wird, oder upgraden Sie Ihren Plan. Wenn Sie
    einen **Anthropic-API-Schlüssel** verwenden, prüfen Sie die Anthropic Console
    auf Nutzung/Abrechnung und erhöhen Sie die Limits bei Bedarf.

    Wenn die Meldung speziell lautet:
    `Extra usage is required for long context requests`, versucht die Anfrage,
    die 1M-Kontext-Beta von Anthropic (`context1m: true`) zu verwenden. Das funktioniert nur, wenn Ihre
    Anmeldedaten für Long-Context-Abrechnung berechtigt sind (API-Key-Abrechnung oder der
    OpenClaw-Claude-Login-Pfad mit aktivierter Extra Usage).

    Tipp: Setzen Sie ein **Fallback-Modell**, damit OpenClaw weiter antworten kann, während ein Provider rate-limited ist.
    Siehe [Modelle](/de/cli/models), [OAuth](/de/concepts/oauth) und
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Wird AWS Bedrock unterstützt?">
    Ja. OpenClaw hat einen gebündelten **Amazon Bedrock (Converse)**-Provider. Wenn AWS-Env-Marker vorhanden sind, kann OpenClaw den Bedrock-Katalog für Streaming/Text automatisch erkennen und als impliziten Provider `amazon-bedrock` zusammenführen; andernfalls können Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` explizit aktivieren oder einen manuellen Provider-Eintrag hinzufügen. Siehe [Amazon Bedrock](/de/providers/bedrock) und [Modell-Provider](/de/providers/models). Wenn Sie einen verwalteten Key-Ablauf bevorzugen, ist ein OpenAI-kompatibler Proxy vor Bedrock weiterhin eine gültige Option.
  </Accordion>

  <Accordion title="Wie funktioniert die Codex-Authentifizierung?">
    OpenClaw unterstützt **OpenAI Code (Codex)** über OAuth (ChatGPT-Anmeldung). Verwenden Sie
    `openai-codex/gpt-5.5` für Codex-OAuth über den Standard-PI-Runner. Verwenden Sie
    `openai/gpt-5.5` für direkten Zugriff per OpenAI-API-Schlüssel. GPT-5.5 kann auch
    Abonnement/OAuth über `openai-codex/gpt-5.5` oder native Codex-App-Server-
    Läufe mit `openai/gpt-5.5` und `agentRuntime.id: "codex"` verwenden.
    Siehe [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).
  </Accordion>

  <Accordion title="Warum erwähnt OpenClaw immer noch openai-codex?">
    `openai-codex` ist die Provider- und Authentifizierungsprofil-ID für ChatGPT-/Codex-OAuth.
    Es ist auch das explizite PI-Modellpräfix für Codex-OAuth:

    - `openai/gpt-5.5` = aktueller direkter OpenAI-API-Key-Pfad in PI
    - `openai-codex/gpt-5.5` = Codex-OAuth-Pfad in PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = nativer Codex-App-Server-Pfad
    - `openai-codex:...` = Authentifizierungsprofil-ID, keine Modell-Referenz

    Wenn Sie den direkten OpenAI-Platform-Abrechnungs-/Limit-Pfad möchten, setzen Sie
    `OPENAI_API_KEY`. Wenn Sie ChatGPT-/Codex-Abonnement-Authentifizierung möchten, melden Sie sich mit
    `openclaw models auth login --provider openai-codex` an und verwenden Sie
    `openai-codex/*`-Modell-Referenzen für PI-Läufe.

  </Accordion>

  <Accordion title="Warum können Codex-OAuth-Limits von ChatGPT-Web abweichen?">
    Codex-OAuth verwendet von OpenAI verwaltete, planabhängige Kontingentfenster. In der Praxis
    können sich diese Limits von der Erfahrung auf der ChatGPT-Website/App unterscheiden, selbst wenn
    beide an dasselbe Konto gebunden sind.

    OpenClaw kann die aktuell sichtbaren Provider-Nutzungs-/Kontingentfenster in
    `openclaw models status` anzeigen, erfindet oder normalisiert aber keine ChatGPT-Web-
    Berechtigungen in direkten API-Zugriff hinein. Wenn Sie den direkten OpenAI-Platform-
    Abrechnungs-/Limit-Pfad möchten, verwenden Sie `openai/*` mit einem API-Schlüssel.

  </Accordion>

  <Accordion title="Unterstützen Sie OpenAI-Abonnement-Authentifizierung (Codex OAuth)?">
    Ja. OpenClaw unterstützt vollständig **OpenAI Code (Codex) Subscription OAuth**.
    OpenAI erlaubt ausdrücklich die Verwendung von Subscription OAuth in externen Tools/Workflows
    wie OpenClaw. Das Onboarding kann den OAuth-Ablauf für Sie ausführen.

    Siehe [OAuth](/de/concepts/oauth), [Modell-Provider](/de/concepts/model-providers) und [Onboarding (CLI)](/de/start/wizard).

  </Accordion>

  <Accordion title="Wie richte ich Gemini CLI OAuth ein?">
    Gemini CLI verwendet einen **Plugin-Authentifizierungsablauf**, keine Client-ID oder kein Secret in `openclaw.json`.

    Schritte:

    1. Installieren Sie Gemini CLI lokal, sodass `gemini` im `PATH` ist
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Aktivieren Sie das Plugin: `openclaw plugins enable google`
    3. Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Standardmodell nach dem Login: `google-gemini-cli/gemini-3-flash-preview`
    5. Wenn Requests fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host

    Dadurch werden OAuth-Tokens in Authentifizierungsprofilen auf dem Gateway-Host gespeichert. Details: [Modell-Provider](/de/concepts/model-providers).

  </Accordion>

  <Accordion title="Ist ein lokales Modell für lockere Chats okay?">
    Normalerweise nein. OpenClaw benötigt großen Kontext + starke Sicherheit; kleine Karten truncaten und leaken. Wenn es unbedingt sein muss, führen Sie lokal den **größten** Modell-Build aus, den Sie lokal betreiben können (LM Studio), und siehe [/gateway/local-models](/de/gateway/local-models). Kleinere/quantisierte Modelle erhöhen das Risiko von Prompt Injection — siehe [Sicherheit](/de/gateway/security).
  </Accordion>

  <Accordion title="Wie halte ich den Datenverkehr gehosteter Modelle in einer bestimmten Region?">
    Wählen Sie regionfixierte Endpunkte. OpenRouter bietet US-gehostete Optionen für MiniMax, Kimi und GLM; wählen Sie die US-gehostete Variante, um Daten in der Region zu halten. Sie können Anthropic/OpenAI weiterhin daneben aufführen, indem Sie `models.mode: "merge"` verwenden, damit Fallbacks verfügbar bleiben und gleichzeitig der von Ihnen gewählte regionale Provider respektiert wird.
  </Accordion>

  <Accordion title="Muss ich einen Mac Mini kaufen, um das zu installieren?">
    Nein. OpenClaw läuft auf macOS oder Linux (Windows über WSL2). Ein Mac mini ist optional — manche Leute
    kaufen einen als Always-on-Host, aber auch ein kleiner VPS, Home-Server oder eine Raspberry-Pi-Klasse-Box funktioniert.

    Sie benötigen einen Mac nur **für macOS-only-Tools**. Für iMessage verwenden Sie [BlueBubbles](/de/channels/bluebubbles) (empfohlen) — der BlueBubbles-Server läuft auf jedem Mac, und das Gateway kann auf Linux oder anderswo laufen. Wenn Sie andere nur unter macOS verfügbare Tools möchten, führen Sie das Gateway auf einem Mac aus oder koppeln Sie einen macOS-Node.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes), [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Brauche ich für iMessage-Unterstützung einen Mac mini?">
    Sie benötigen **irgendein macOS-Gerät**, das bei Messages angemeldet ist. Es muss **kein** Mac mini sein —
    jeder Mac funktioniert. Verwenden Sie für iMessage **[BlueBubbles](/de/channels/bluebubbles)** (empfohlen) — der BlueBubbles-Server läuft auf macOS, während das Gateway auf Linux oder anderswo laufen kann.

    Häufige Setups:

    - Gateway auf Linux/VPS ausführen und den BlueBubbles-Server auf irgendeinem bei Messages angemeldeten Mac ausführen.
    - Alles auf dem Mac ausführen, wenn Sie das einfachste Setup mit nur einem Rechner möchten.

    Dokumentation: [BlueBubbles](/de/channels/bluebubbles), [Nodes](/de/nodes),
    [Mac-Remote-Modus](/de/platforms/mac/remote).

  </Accordion>

  <Accordion title="Wenn ich einen Mac mini kaufe, um OpenClaw auszuführen, kann ich ihn mit meinem MacBook Pro verbinden?">
    Ja. Der **Mac mini kann das Gateway ausführen**, und Ihr MacBook Pro kann sich als
    **Node** (Companion-Gerät) verbinden. Nodes führen das Gateway nicht aus — sie liefern zusätzliche
    Funktionen wie Bildschirm/Kamera/Canvas und `system.run` auf diesem Gerät.

    Häufiges Muster:

    - Gateway auf dem Mac mini (Always-on).
    - Auf dem MacBook Pro läuft die macOS-App oder ein Node-Host und wird mit dem Gateway gekoppelt.
    - Verwenden Sie `openclaw nodes status` / `openclaw nodes list`, um es anzuzeigen.

    Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

  </Accordion>

  <Accordion title="Kann ich Bun verwenden?">
    Bun wird **nicht empfohlen**. Wir sehen Laufzeitfehler, besonders mit WhatsApp und Telegram.
    Verwenden Sie **Node** für stabile Gateways.

    Wenn Sie dennoch mit Bun experimentieren möchten, tun Sie das auf einem nicht produktiven Gateway
    ohne WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: Was gehört in allowFrom?">
    `channels.telegram.allowFrom` ist **die Telegram-Benutzer-ID des menschlichen Absenders** (numerisch). Es ist nicht der Bot-Benutzername.

    Das Setup fragt nur nach numerischen Benutzer-IDs. Wenn Sie bereits veraltete `@username`-Einträge in der Konfiguration haben, kann `openclaw doctor --fix` versuchen, sie aufzulösen.

    Sicherer (kein Drittanbieter-Bot):

    - Senden Sie Ihrem Bot eine DM und führen Sie dann `openclaw logs --follow` aus und lesen Sie `from.id`.

    Offizielle Bot API:

    - Senden Sie Ihrem Bot eine DM und rufen Sie dann `https://api.telegram.org/bot<bot_token>/getUpdates` auf und lesen Sie `message.from.id`.

    Drittanbieter (weniger privat):

    - Senden Sie eine DM an `@userinfobot` oder `@getidsbot`.

    Siehe [/channels/telegram](/de/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Können mehrere Personen eine WhatsApp-Nummer mit unterschiedlichen OpenClaw-Instanzen verwenden?">
    Ja, über **Multi-Agent-Routing**. Binden Sie die WhatsApp-**DM** jedes Absenders (Peer `kind: "direct"`, Absender-E.164 wie `+15551234567`) an eine andere `agentId`, sodass jede Person ihren eigenen Workspace und Sitzungsspeicher erhält. Antworten kommen weiterhin vom **gleichen WhatsApp-Konto**, und die DM-Zugriffskontrolle (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) ist global pro WhatsApp-Konto. Siehe [Multi-Agent-Routing](/de/concepts/multi-agent) und [WhatsApp](/de/channels/whatsapp).
  </Accordion>

  <Accordion title='Kann ich einen Agenten für "schnellen Chat" und einen "Opus fürs Programmieren"-Agenten ausführen?'>
    Ja. Verwenden Sie Multi-Agent-Routing: Geben Sie jedem Agenten sein eigenes Standardmodell und binden Sie dann eingehende Routen (Provider-Konto oder bestimmte Peers) an jeden Agenten. Beispielkonfiguration unter [Multi-Agent-Routing](/de/concepts/multi-agent). Siehe auch [Modelle](/de/concepts/models) und [Konfiguration](/de/gateway/configuration).
  </Accordion>

  <Accordion title="Funktioniert Homebrew unter Linux?">
    Ja. Homebrew unterstützt Linux (Linuxbrew). Schnelles Setup:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Wenn Sie OpenClaw über systemd ausführen, stellen Sie sicher, dass der PATH des Dienstes `/home/linuxbrew/.linuxbrew/bin` (oder Ihr Brew-Präfix) enthält, damit mit `brew` installierte Tools in Nicht-Login-Shells aufgelöst werden.
    Neuere Builds stellen unter Linux-systemd-Diensten auch gängige Benutzer-Bin-Verzeichnisse voran (zum Beispiel `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) und berücksichtigen `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` und `FNM_DIR`, wenn gesetzt.

  </Accordion>

  <Accordion title="Unterschied zwischen der hackbaren Git-Installation und npm install">
    - **Hackbare (Git-)Installation:** vollständiger Source-Checkout, bearbeitbar, am besten für Mitwirkende.
      Sie führen Builds lokal aus und können Code/Dokumentation patchen.
    - **npm install:** globale CLI-Installation, kein Repo, am besten für „einfach ausführen“.
      Updates kommen von npm-dist-tags.

    Dokumentation: [Erste Schritte](/de/start/getting-started), [Aktualisieren](/de/install/updating).

  </Accordion>

  <Accordion title="Kann ich später zwischen npm- und Git-Installationen wechseln?">
    Ja. Verwenden Sie `openclaw update --channel ...`, wenn OpenClaw bereits installiert ist.
    Dadurch werden Ihre Daten **nicht gelöscht** — es ändert nur die OpenClaw-Code-Installation.
    Ihr Status (`~/.openclaw`) und Workspace (`~/.openclaw/workspace`) bleiben unberührt.

    Von npm zu Git:

    ```bash
    openclaw update --channel dev
    ```

    Von Git zu npm:

    ```bash
    openclaw update --channel stable
    ```

    Fügen Sie `--dry-run` hinzu, um die geplante Modusumstellung zuerst in der Vorschau anzuzeigen. Der Updater führt
    Doctor-Nachläufe aus, aktualisiert Plugin-Quellen für den Zielkanal und
    startet das Gateway neu, es sei denn, Sie übergeben `--no-restart`.

    Der Installer kann ebenfalls einen der beiden Modi erzwingen:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Backup-Tipps: siehe [Backup-Strategie](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Soll ich das Gateway auf meinem Laptop oder auf einem VPS ausführen?">
    Kurz gesagt: **Wenn Sie 24/7-Zuverlässigkeit möchten, verwenden Sie einen VPS**. Wenn Sie die
    geringste Reibung wollen und mit Sleep/Neustarts leben können, führen Sie es lokal aus.

    **Laptop (lokales Gateway)**

    - **Vorteile:** keine Serverkosten, direkter Zugriff auf lokale Dateien, sichtbares Browserfenster.
    - **Nachteile:** Sleep/Netzwerkabbrüche = Verbindungsabbrüche, OS-Updates/Neustarts unterbrechen, muss wach bleiben.

    **VPS / Cloud**

    - **Vorteile:** Always-on, stabiles Netzwerk, keine Laptop-Sleep-Probleme, leichter dauerhaft am Laufen zu halten.
    - **Nachteile:** läuft oft headless (verwenden Sie Screenshots), nur Remote-Dateizugriff, Sie müssen für Updates per SSH arbeiten.

    **OpenClaw-spezifischer Hinweis:** WhatsApp/Telegram/Slack/Mattermost/Discord funktionieren auf einem VPS alle problemlos. Der einzige echte Trade-off ist **headless Browser** vs. sichtbares Fenster. Siehe [Browser](/de/tools/browser).

    **Empfohlener Standard:** VPS, wenn Sie zuvor Gateway-Verbindungsabbrüche hatten. Lokal ist großartig, wenn Sie den Mac aktiv verwenden und lokalen Dateizugriff oder UI-Automatisierung mit sichtbarem Browser möchten.

  </Accordion>

  <Accordion title="Wie wichtig ist es, OpenClaw auf einer dedizierten Maschine auszuführen?">
    Nicht erforderlich, aber **empfohlen für Zuverlässigkeit und Isolation**.

    - **Dedizierter Host (VPS/Mac mini/Pi):** Always-on, weniger Unterbrechungen durch Sleep/Neustarts, sauberere Berechtigungen, einfacher dauerhaft am Laufen zu halten.
    - **Geteilter Laptop/Desktop:** völlig in Ordnung zum Testen und für aktive Nutzung, aber rechnen Sie mit Pausen, wenn die Maschine schläft oder Updates ausführt.

    Wenn Sie das Beste aus beiden Welten möchten, lassen Sie das Gateway auf einem dedizierten Host laufen und koppeln Sie Ihren Laptop als **Node** für lokale Bildschirm-/Kamera-/Exec-Tools. Siehe [Nodes](/de/nodes).
    Für Sicherheitshinweise lesen Sie [Sicherheit](/de/gateway/security).

  </Accordion>

  <Accordion title="Was sind die Mindestanforderungen an einen VPS und welches OS wird empfohlen?">
    OpenClaw ist leichtgewichtig. Für ein einfaches Gateway + einen Chat-Kanal:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM, ~500 MB Speicherplatz.
    - **Empfohlen:** 1–2 vCPU, 2 GB RAM oder mehr als Reserve (Logs, Medien, mehrere Kanäle). Node-Tools und Browser-Automatisierung können ressourcenhungrig sein.

    OS: Verwenden Sie **Ubuntu LTS** (oder ein modernes Debian/Ubuntu). Der Linux-Installationspfad ist dort am besten getestet.

    Dokumentation: [Linux](/de/platforms/linux), [VPS-Hosting](/de/vps).

  </Accordion>

  <Accordion title="Kann ich OpenClaw in einer VM ausführen und was sind die Anforderungen?">
    Ja. Behandeln Sie eine VM wie einen VPS: Sie muss immer eingeschaltet, erreichbar sein und genug
    RAM für das Gateway und alle aktivierten Kanäle haben.

    Grundlegende Richtwerte:

    - **Absolutes Minimum:** 1 vCPU, 1 GB RAM.
    - **Empfohlen:** 2 GB RAM oder mehr, wenn Sie mehrere Kanäle, Browser-Automatisierung oder Medien-Tools ausführen.
    - **OS:** Ubuntu LTS oder ein anderes modernes Debian/Ubuntu.

    Wenn Sie unter Windows sind, ist **WSL2 das einfachste VM-artige Setup** und hat die beste
    Tooling-Kompatibilität. Siehe [Windows](/de/platforms/windows), [VPS-Hosting](/de/vps).
    Wenn Sie macOS in einer VM ausführen, siehe [macOS-VM](/de/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — die Haupt-FAQ (Modelle, Sitzungen, Gateway, Sicherheit, mehr)
- [Installationsübersicht](/de/install)
- [Erste Schritte](/de/start/getting-started)
- [Fehlerbehebung](/de/help/troubleshooting)
