---
read_when:
    - Sie möchten API-Schlüssel aus openclaw.json entfernen und in 1Password speichern
    - Sie führen den Gateway ohne grafische Oberfläche aus und benötigen eine Dienstkontoauthentifizierung für op
    - Sie möchten, dass Agenten mit der op CLI Geheimnisse lesen oder einschleusen.
summary: Lösen Sie Gateway-Secrets mit der 1Password CLI auf und ermöglichen Sie Agenten die Nutzung des mitgelieferten 1password-Skills
title: 1Password
x-i18n:
    generated_at: "2026-07-16T12:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw lässt sich auf zwei unabhängige Arten mit **1Password** kombinieren:

- **Konfigurationsgeheimnisse:** Jedes [SecretRef](/de/gateway/secrets)-Feld in `openclaw.json` kann zur Laufzeit über die `op`-CLI aufgelöst werden, sodass API-Schlüssel niemals in der Konfigurationsdatei gespeichert werden.
- **Agenten-Workflows:** Der mitgelieferte `1password`-Skill bringt Agenten bei, sich anzumelden und mit `op` Geheimnisse für ihre eigenen Aufgaben zu lesen oder einzuschleusen.

## Voraussetzungen

- Die [1Password CLI](https://developer.1password.com/docs/cli/get-started/) (`op`) muss auf dem Gateway-Host installiert sein (`brew install 1password-cli` unter macOS).
- Ein Authentifizierungsmodus für `op`:
  - **Dienstkonto** (für Headless-Gateways empfohlen): Exportieren Sie `OP_SERVICE_ACCOUNT_TOKEN` in der Umgebung des Gateway-Dienstes. Keine Desktop-App, keine interaktive Anmeldung.
  - **Desktop-App-Integration**: Die 1Password-App wird auf demselben Computer ausgeführt und die CLI-Integration ist aktiviert. Bei den ersten Aufrufen kann eine Touch-ID- oder Systemauthentifizierung ausgelöst werden.
  - **Eigenständige Anmeldung**: `op signin` fordert pro Sitzung zur Anmeldung auf. Für Agenten über den Skill praktikabel, aber nicht für die Auflösung von Konfigurationsgeheimnissen auf einem Headless-Gateway geeignet.

## Konfigurationsgeheimnisse mit op auflösen

Deklarieren Sie einen Exec-Secret-Provider, der `op read` mit einer `op://vault/item/field`-Referenz ausführt, und verweisen Sie anschließend mit jedem SecretRef-fähigen Feld darauf:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // für durch Homebrew symbolisch verknüpfte Binärdateien erforderlich
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

- `command` muss ein absoluter Pfad sein; `trustedDirs` kennzeichnet sein Verzeichnis als vertrauenswürdig, und `allowSymlinkCommand` ist erforderlich, weil Homebrew `op` als symbolischen Link installiert.
- `args` übergibt die `op://vault/item/field`-Referenz unverändert. OpenClaw analysiert das `op://`-Schema nicht selbst; die Binärdatei `op` löst es auf.
- `passEnv` leitet die aufgeführten Variablen aus der Gateway-Umgebung weiter. Die Desktop-App-Integration benötigt `HOME`; für Dienstkonten muss außerdem `OP_SERVICE_ACCOUNT_TOKEN` in der Umgebung des Gateway-Dienstes vorhanden sein (fügen Sie es zu `passEnv` hinzu oder legen Sie es nur dann über `env` fest, wenn Sie akzeptieren, dass das Token in der Konfigurationsdatei lesbar ist).
- Behalten Sie für die Ausgabe eines einzelnen Werts `id: "value"` bei. Verwenden Sie bei `jsonOnly: true` und einer JSON-Nutzlast stattdessen eine JSON-Pointer-ID, um Felder zu adressieren.
- Ein Provider-Eintrag pro Geheimnis sorgt dafür, dass Referenzen überprüfbar bleiben; benennen Sie Provider nach ihrem Verbraucher (`onepassword_openai`, `onepassword_telegram`).

Unter [Gateway-Geheimnisse](/de/gateway/secrets) finden Sie Informationen zu Auflösungsreihenfolge, Caching und Fehlersemantik und unter [SecretRef-Anmeldedatenoberfläche](/de/reference/secretref-credential-surface) alle Felder, die SecretRefs akzeptieren.

## Dienstkonto für Headless-Gateways einrichten

1. Erstellen Sie in Ihrem 1Password-Konto ein Dienstkonto und gewähren Sie ihm ausschließlich Lesezugriff auf die Tresoreinträge, die das Gateway benötigt.
2. Stellen Sie dem Gateway-Dienst `OP_SERVICE_ACCOUNT_TOKEN` bereit (launchd-Plist, systemd-Unit oder Container-Umgebungsvariable).
3. Fügen Sie `"OP_SERVICE_ACCOUNT_TOKEN"` zur `passEnv`-Liste des Providers hinzu.
4. Überprüfen Sie dies in der Umgebung des Gateway-Hosts: `op whoami` sollte das Dienstkonto ohne Eingabeaufforderung ausgeben.

Beim Lesen über ein Dienstkonto muss der Tresor in der `op://`-Referenz ausdrücklich benannt sein. Begrenzen Sie den Umfang des Kontos strikt; es handelt sich um einen Bearer-Berechtigungsnachweis.

## Der 1password-Skill für Agenten

OpenClaw enthält einen `1password`-Skill, der Agenten zu kompetenten Bedienern von `op` macht: Er erkennt den verfügbaren Authentifizierungsmodus (Dienstkonto, Desktop-App-Integration oder eigenständige Anmeldung), überprüft vor jedem Lesevorgang den Zugriff mit `op whoami` und bevorzugt `op run` / `op inject`, anstatt Geheimniswerte auf die Festplatte zu schreiben. Der Skill erfordert die Binärdatei `op` und bietet eine Installation über Homebrew an, wenn sie fehlt.

Agenten verwenden ihn für ihre eigenen Workflows, beispielsweise um während einer Aufgabe ein Bereitstellungstoken zu lesen oder Umgebungsvariablen in einen Befehl einzuschleusen. Er ist von der Auflösung von Konfigurationsgeheimnissen unabhängig; das Gateway löst SecretRefs ohne Beteiligung eines Skills auf.

## Sicherheitshinweise

- Über Exec-Provider aufgelöste Geheimniswerte verbleiben im Arbeitsspeicher des Gateways; Konfigurations-Snapshots und `config.get`-Antworten schwärzen SecretRef-Felder.
- Speichern Sie Geheimniswerte niemals in `openclaw.json`, Protokollen oder Chats. Speichern Sie Elementnamen in der Konfiguration und Werte in 1Password.
- Das 1Password-Auditprotokoll zeigt jeden Lesezugriff eines Dienstkontos, wodurch Schlüsselrotation und Vorfallanalyse praktikabel werden.

## Fehlerbehebung

- `command not found` oder Spawn-Fehler: Verwenden Sie den absoluten Pfad zu `op` und nehmen Sie dessen Verzeichnis in `trustedDirs` auf.
- `op` wird aufgelöst, aber Lesevorgänge schlagen mit Symlink-Fehlern fehl: Legen Sie für Homebrew-Installationen `allowSymlinkCommand: true` fest.
- `account is not signed in`: Stellen Sie bei Dienstkonten sicher, dass `OP_SERVICE_ACCOUNT_TOKEN` den Gateway-Dienst erreicht und in `passEnv` aufgeführt ist; stellen Sie bei der Desktop-Integration sicher, dass die App ausgeführt wird und entsperrt ist.
- Langsame erste Lesevorgänge: Erhöhen Sie `timeoutMs` beim Provider; Kaltstarts von `op` können auf ausgelasteten Hosts strenge Zeitlimits überschreiten.
