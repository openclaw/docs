---
read_when:
    - Sie möchten API-Schlüssel aus openclaw.json entfernen und in 1Password speichern
    - Sie führen das Gateway headless aus und benötigen eine Dienstkonto-Authentifizierung für op
    - Sie möchten, dass Agenten mit der op CLI Geheimnisse lesen oder einschleusen.
summary: Gateway-Secrets mit der 1Password CLI auflösen und Agenten die Verwendung des gebündelten 1password-Skills ermöglichen
title: 1Password
x-i18n:
    generated_at: "2026-07-24T04:24:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bb14944f0b3ce1ee3f90bf666a53e8673e7a9861e3e138a5fabe9c8e070cbd7
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw lässt sich auf drei unabhängige Arten mit **1Password** kombinieren:

- **Konfigurationsgeheimnisse:** Jedes [SecretRef](/de/gateway/secrets)-Feld in `openclaw.json` kann zur Laufzeit über die `op`-CLI aufgelöst werden, sodass API-Schlüssel nie in der Konfigurationsdatei gespeichert werden.
- **Agenten-Workflows:** Das mitgelieferte Skill `1password` vermittelt Agenten, wie sie sich anmelden und mit `op` Geheimnisse für ihre eigenen Aufgaben lesen oder einspeisen.
- **Browser-Anmeldung:** Das `claude-cli`-Backend kann die Chrome-Integration von Claude Code mit [1Password für Claude](https://support.1password.com/1password-claude/) verwenden, sodass sich der Agent bei Websites anmelden kann, ohne dass das Passwort jemals an das Modell oder OpenClaw gelangt.

## Voraussetzungen

- Die [1Password-CLI](https://developer.1password.com/docs/cli/get-started/) (`op`) muss auf dem Gateway-Host installiert sein (`brew install 1password-cli` unter macOS).
- Ein Authentifizierungsmodus für `op`:
  - **Servicekonto** (für Headless-Gateways empfohlen): Exportieren Sie `OP_SERVICE_ACCOUNT_TOKEN` in der Umgebung des Gateway-Dienstes. Keine Desktop-App, keine interaktive Anmeldung.
  - **Desktop-App-Integration**: Die 1Password-App wird auf demselben Rechner ausgeführt und die CLI-Integration ist aktiviert. Die ersten Aufrufe können Touch ID oder eine Systemauthentifizierung auslösen.
  - **Eigenständige Anmeldung**: `op signin` fordert pro Sitzung zur Eingabe auf. Für Agenten über das Skill praktikabel, aber nicht zur Auflösung von Konfigurationsgeheimnissen auf einem Headless-Gateway geeignet.

## Konfigurationsgeheimnisse mit op auflösen

Deklarieren Sie einen Exec-Geheimnis-Provider, der `op read` mit einer `op://vault/item/field`-Referenz ausführt, und verweisen Sie dann mit jedem SecretRef-fähigen Feld darauf:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // für über Homebrew installierte Binärdateien mit symbolischen Verknüpfungen erforderlich
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Zusammenspiel der Komponenten:

- `command` muss ein absoluter Pfad sein; `trustedDirs` kennzeichnet dessen Verzeichnis als vertrauenswürdig, und `allowSymlinkCommand` ist erforderlich, da Homebrew `op` als symbolische Verknüpfung installiert.
- `args` übergibt die `op://vault/item/field`-Referenz unverändert. OpenClaw analysiert das `op://`-Schema nicht selbst; die Binärdatei `op` löst es auf.
- `passEnv` leitet die aufgeführten Variablen aus der Gateway-Umgebung weiter. Die Desktop-App-Integration benötigt `HOME`; bei Servicekonten muss außerdem `OP_SERVICE_ACCOUNT_TOKEN` in der Umgebung des Gateway-Dienstes vorhanden sein (fügen Sie es zu `passEnv` hinzu, oder legen Sie es nur dann über `env` fest, wenn Sie akzeptieren, dass das Token in der Konfigurationsdatei lesbar ist).
- Behalten Sie für die Ausgabe eines einzelnen Werts `id: "value"` bei. Verwenden Sie bei `jsonOnly: true` und einer JSON-Nutzlast stattdessen eine JSON-Pointer-ID, um Felder zu adressieren.
- Ein Provider-Eintrag pro Geheimnis sorgt dafür, dass Referenzen überprüfbar bleiben; benennen Sie Provider nach ihrem Verbraucher (`onepassword_openai`, `onepassword_telegram`).

Unter [Gateway-Geheimnisse](/de/gateway/secrets) finden Sie Informationen zur Auflösungsreihenfolge, Zwischenspeicherung und Fehlersemantik. Die [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) führt alle Felder auf, die SecretRefs akzeptieren.

## Servicekonto für Headless-Gateways einrichten

1. Erstellen Sie in Ihrem 1Password-Konto ein Servicekonto und gewähren Sie ihm ausschließlich Lesezugriff auf die Tresorelemente, die das Gateway benötigt.
2. Stellen Sie `OP_SERVICE_ACCOUNT_TOKEN` für den Gateway-Dienst bereit (launchd-Plist, systemd-Unit oder Container-Umgebung).
3. Fügen Sie `"OP_SERVICE_ACCOUNT_TOKEN"` zur `passEnv`-Liste des Providers hinzu.
4. Überprüfen Sie dies in der Umgebung des Gateway-Hosts: `op whoami` sollte das Servicekonto ohne Eingabeaufforderung ausgeben.

Zum Lesen mit einem Servicekonto muss der Tresor in der `op://`-Referenz explizit benannt sein. Begrenzen Sie den Umfang des Kontos strikt; es handelt sich um Anmeldedaten nach dem Bearer-Prinzip.

## Das Skill 1password für Agenten

OpenClaw enthält ein `1password`-Skill, das Agenten zu kompetenten Bedienern von `op` macht: Es erkennt den verfügbaren Authentifizierungsmodus (Servicekonto, Desktop-App-Integration oder eigenständige Anmeldung), überprüft vor dem Lesen den Zugriff mit `op whoami` und bevorzugt `op run` / `op inject`, statt Geheimniswerte auf den Datenträger zu schreiben. Das Skill erfordert die Binärdatei `op` und bietet eine Homebrew-Installation an, wenn sie fehlt.

Agenten verwenden es für ihre eigenen Workflows, beispielsweise um während einer Aufgabe ein Bereitstellungs-Token zu lesen oder Umgebungsvariablen in einen Befehl einzuspeisen. Es ist von der Auflösung von Konfigurationsgeheimnissen unabhängig; das Gateway löst SecretRefs ohne Beteiligung eines Skills auf.

## Browser-Anmeldung mit 1Password für Claude

[1Password für Claude](https://support.1password.com/1password-claude/) ermöglicht Claude, eine Anmeldung anzufordern, während die 1Password-Browsererweiterung die Anmeldedaten über einen verschlüsselten Kanal direkt in die Seite einträgt. Das Geheimnis gelangt nie in den Modellkontext, das Transkript oder OpenClaw. Wenn OpenClaw das [`claude-cli`-Backend](/de/gateway/cli-backends#claude-cli-specifics) mit aktivierter Chrome-Integration von Claude Code ausführt, können Agentenaufgaben diesen Ablauf für Websites verwenden, die eine echte angemeldete Sitzung erfordern.

Zusätzlich zum Backend selbst ist Folgendes erforderlich:

- Ein macOS-Gateway-Host mit Chrome, einer verbundenen [Claude in Chrome extension](https://code.claude.com/docs/en/chrome), der 1Password-Desktop-App und der 1Password-Browsererweiterung (beide in Version 8.12.28 oder neuer).
- Claude Code muss bei einem direkten Anthropic-Tarif angemeldet sein (Pro, Max, Team oder Enterprise). Die Chrome-Integration ist über Amazon Bedrock, Google Cloud oder andere Drittanbieter nicht verfügbar.
- Die einmalige 1Password-Verbindung auf Anthropic-Seite: 1Password für Claude wird über die Claude-Desktop-App oder den in der [Anleitung von 1Password](https://support.1password.com/1password-claude/) beschriebenen Erweiterungsablauf eingerichtet und befindet sich derzeit unter macOS in der Betaphase. Bei 1Password Business muss ein Administrator zunächst unter Policies die Option "Allow AI agents to autofill for users" aktivieren; bei Anthropic-Team-/Enterprise-Tarifen ist die Integration ebenfalls zunächst deaktiviert, bis sie von einem Owner aktiviert wird.
- Ein [CLI-Backend-Plugin](/de/plugins/cli-backend-plugins), das `--chrome` zu den Startargumenten von Claude hinzufügt; das mitgelieferte Backend aktiviert Chrome nicht.
- Eine Person am Gateway-Host: Bei jeder Verwendung von Anmeldedaten wird dort eine 1Password-Eingabeaufforderung angezeigt und bestätigt (beispielsweise mit Touch ID). Bei einer restriktiven Exec-Richtlinie werden auch die Aufrufe der Browser-Tools zunächst als OpenClaw-Genehmigungen an Ihren Kanal weitergeleitet.

Bevor Sie dies mit OpenClaw verbinden, überprüfen Sie die Komponenten in einer interaktiven Sitzung auf dem Gateway-Host: Führen Sie `claude --chrome` aus, bestätigen Sie, dass die Erweiterung eine Verbindung herstellt, und prüfen Sie, ob die `claude-in-chrome`-Tools die Anmeldedaten-Tools enthalten. Wenn sie dort nicht angezeigt werden, werden sie auch über OpenClaw nicht angezeigt.

Einmalpasswörter werden von 1Password auf derselben Seite eingetragen; übermitteln Sie niemals Verifizierungscodes oder Passwörter per Chat. Headless- oder Remote-Gateways können diesen Ablauf derzeit nicht verwenden, da sowohl die Genehmigung als auch der Browser auf dem Gateway-Host ausgeführt werden.

## Sicherheitshinweise

- Über Exec-Provider aufgelöste Geheimniswerte verbleiben im Arbeitsspeicher des Gateways; Konfigurations-Snapshots und `config.get`-Antworten schwärzen SecretRef-Felder.
- Speichern Sie Geheimniswerte niemals in `openclaw.json`, Protokollen oder Chats. Speichern Sie Elementnamen in der Konfiguration und Werte in 1Password.
- Der 1Password-Audit-Trail zeigt jeden Lesezugriff eines Servicekontos, wodurch Schlüsselrotationen und die Überprüfung von Vorfällen praktikabel werden.

## Fehlerbehebung

- `command not found` oder Erzeugungsfehler: Verwenden Sie den absoluten Pfad `op` und nehmen Sie dessen Verzeichnis in `trustedDirs` auf.
- `op` wird aufgelöst, Lesevorgänge schlagen jedoch mit Fehlern zu symbolischen Verknüpfungen fehl: Legen Sie für Homebrew-Installationen `allowSymlinkCommand: true` fest.
- `account is not signed in`: Vergewissern Sie sich bei Servicekonten, dass `OP_SERVICE_ACCOUNT_TOKEN` den Gateway-Dienst erreicht und in `passEnv` aufgeführt ist; stellen Sie bei der Desktop-Integration sicher, dass die App ausgeführt wird und entsperrt ist.
- Langsame erste Lesevorgänge: Erhöhen Sie `timeoutMs` beim Provider; Kaltstarts von `op` können auf ausgelasteten Hosts strikte Zeitüberschreitungen überschreiten.
