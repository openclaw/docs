---
read_when:
    - Fehlerbehebung bei Modellauthentifizierung oder OAuth-Ablauf
    - Dokumentieren der Authentifizierung oder Speicherung von Anmeldedaten
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Einrichtungstoken'
title: Authentifizierung
x-i18n:
    generated_at: "2026-07-12T01:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite behandelt die Authentifizierung bei **Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI, Anthropic-Einrichtungstoken). Informationen zur Authentifizierung für die **Gateway-Verbindung** (Token, Passwort, vertrauenswürdiger Proxy) finden Sie unter [Konfiguration](/de/gateway/configuration) und [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für einen dauerhaft aktiven Gateway-Host ist ein API-Schlüssel die berechenbarste Option; Abonnement-/OAuth-Abläufe funktionieren ebenfalls, sofern sie zum Kontomodell Ihres Providers passen.

- Vollständiger OAuth-Ablauf und Speicherstruktur: [/concepts/oauth](/de/concepts/oauth)
- SecretRef-basierte Authentifizierung (`env`-/`file`-/`exec`-Provider): [Verwaltung von Geheimnissen](/de/gateway/secrets)
- Berechtigung von Anmeldedaten und Ursachencodes, die von `models status --probe` verwendet werden: [Semantik von Authentifizierungsdaten](/de/auth-credential-semantics)

## Empfohlene Einrichtung: API-Schlüssel (beliebiger Provider)

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Providers.
2. Hinterlegen Sie ihn auf dem **Gateway-Host** (dem Computer, auf dem `openclaw gateway` ausgeführt wird):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd ausgeführt wird, hinterlegen Sie den Schlüssel in `~/.openclaw/.env`, damit der Daemon ihn lesen kann:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Starten Sie den Gateway-Prozess (oder den Daemon) neu und prüfen Sie den Status erneut:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` kann API-Schlüssel ebenfalls zur Verwendung durch den Daemon speichern, wenn Sie die Umgebungsvariablen nicht selbst verwalten möchten. Die vollständige Rangfolge beim Laden von Umgebungsvariablen (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) finden Sie unter [Umgebungsvariablen](/de/help/environment).

## Anthropic: Wiederverwendung der Claude CLI

Die Authentifizierung mit einem Anthropic-Einrichtungstoken bleibt ein unterstützter Weg. Die Wiederverwendung der Claude CLI (Verwendung nach Art von `claude -p`) ist für diese Integration ebenfalls freigegeben; wenn auf dem Host eine Claude-CLI-Anmeldung verfügbar ist, wird dieser Weg für die lokale Verwendung bzw. die Desktop-Nutzung bevorzugt. Für langlebige Gateway-Hosts bleibt ein Anthropic-API-Schlüssel die berechenbarste Wahl und bietet eine explizite serverseitige Abrechnungskontrolle.

Host-Einrichtung zur Wiederverwendung der Claude CLI:

```bash
# Auf dem Gateway-Host ausführen
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies umfasst zwei Schritte: Melden Sie Claude Code auf dem Host bei Anthropic an und weisen Sie OpenClaw anschließend an, die Anthropic-Modellauswahl über das lokale `claude-cli`-Backend zu leiten und das entsprechende OpenClaw-Authentifizierungsprofil zu speichern.

Wenn sich `claude` nicht im `PATH` befindet, installieren Sie Claude Code oder setzen Sie `agents.defaults.cliBackends.claude-cli.command` auf den Pfad der Binärdatei.

## Manuelle Token-Eingabe

Funktioniert mit jedem Provider; schreibt in den agentenspezifischen SQLite-Authentifizierungsspeicher und aktualisiert die Konfiguration:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw liest Authentifizierungsprofile aus der Datei `openclaw-agent.sqlite` des jeweiligen Agenten. Endpunktdetails (`baseUrl`, `api`, Modell-IDs, Header, Zeitüberschreitungen) gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in Authentifizierungsprofile.

Wenn eine ältere Installation noch `auth-profiles.json`, `auth-state.json` oder eine flache Struktur wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie in SQLite zu importieren. Doctor legt neben den ursprünglichen JSON-Dateien Sicherungskopien mit Zeitstempel ab.

Externe Authentifizierungsrouten wie `auth: "aws-sdk"` von Bedrock sind keine Anmeldedaten. Legen Sie für eine benannte Bedrock-Route `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json` fest – schreiben Sie nicht `type: "aws-sdk"` in den Speicher für Authentifizierungsprofile. `openclaw doctor --fix` migriert veraltete AWS-SDK-Markierungen aus dem Anmeldedatenspeicher in die Konfigurationsmetadaten.

### SecretRef-gestützte Anmeldedaten

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden.
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden.
- Profile im OAuth-Modus lehnen SecretRef-Anmeldedaten ab: Wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird ein SecretRef-gestütztes `keyRef`/`tokenRef` für dieses Profil abgelehnt.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

Automatisierungsfreundliche Prüfung, die bei abgelaufenen/fehlenden Anmeldedaten den Exit-Code `1` und bei bald ablaufenden Anmeldedaten den Exit-Code `2` zurückgibt:

```bash
openclaw models status --check
```

Live-Prüfungen der Authentifizierung (fügen Sie `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` oder `--probe-max-tokens` hinzu, um den Umfang einzugrenzen):

```bash
openclaw models status --probe
```

Hinweise:

- Prüfzeilen können aus Authentifizierungsprofilen, Umgebungsanmeldedaten oder `models.json` stammen.
- Wenn `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung für dieses Profil `excluded_by_auth_order`, anstatt es zu testen.
- Wenn eine Authentifizierung vorhanden ist, OpenClaw für diesen Provider jedoch kein prüfbares Modell auflösen kann, meldet die Prüfung `status: no_model`.
- Abklingzeiten nach Ratenbegrenzungen können modellspezifisch sein: Ein Profil, das für ein Modell eine Abklingzeit durchläuft, kann weiterhin ein verwandtes Modell beim selben Provider bedienen.

Optionale Betriebsskripte (systemd/Termux): [Skripte zur Authentifizierungsüberwachung](/de/help/scripts#auth-monitoring-scripts).

## Rotation von API-Schlüsseln (Gateway)

Einige Provider wiederholen eine Anfrage mit einem alternativen konfigurierten Schlüssel, wenn bei einem Aufruf die Ratenbegrenzung eines Providers erreicht wird.

Prioritätsreihenfolge der Schlüssel je Provider:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung, legt einen Schlüssel fest)
2. `<PROVIDER>_API_KEYS` (durch Kommas, Leerzeichen oder Semikolons getrennte Liste)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (beliebige Umgebungsvariable mit diesem Präfix)

Google-Provider (`google`, `google-vertex`) greifen zusätzlich auf `GOOGLE_API_KEY` zurück. Vor der Verwendung werden Duplikate aus der zusammengeführten Liste entfernt.

OpenClaw wechselt nur dann zum nächsten Schlüssel, wenn die Fehlermeldung einem der folgenden Ausdrücke entspricht: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` oder `too many requests`. Andere Fehler führen nicht zu einem erneuten Versuch mit alternativen Schlüsseln. Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

<Note>
Providerspezifische Ausdrücke wie `ThrottlingException`, `concurrency limit reached` oder `workers_ai ... quota limit exceeded` bestimmen die **Failover-/Wiederholungs-Klassifizierung** (Wechsel des Modells oder Providers bei wiederholtem Fehlschlag). Dies ist ein separater Mechanismus von der oben beschriebenen API-Schlüsselrotation.
</Note>

Durch das Entfernen einer gespeicherten Authentifizierung wird der Schlüssel beim Provider nicht widerrufen. Rotieren oder widerrufen Sie ihn im Dashboard des Providers, wenn Sie ihn auf Provider-Seite ungültig machen müssen.

## Provider-Authentifizierung bei laufendem Gateway entfernen

Wenn Sie die Provider-Authentifizierung über die Steuerungsebene des Gateways entfernen, löscht OpenClaw die gespeicherten Authentifizierungsprofile für diesen Provider und bricht aktive Chat-/Agentenläufe ab, deren ausgewählter Modell-Provider dem entfernten Provider entspricht. Abgebrochene Läufe geben die normalen Abbruch-/Lebenszyklusereignisse mit `stopReason: "auth-revoked"` aus, damit verbundene Clients anzeigen können, dass der Lauf beendet wurde, weil Anmeldedaten entfernt wurden.

## Verwendete Anmeldedaten steuern

### OpenAI und veraltete `openai-codex`-IDs

Sowohl OpenAI-API-Schlüsselprofile als auch ChatGPT-/Codex-OAuth-Profile verwenden die kanonische Provider-ID `openai`. Verwenden Sie für neue Konfigurationen Profil-IDs im Format `openai:*` und `auth.order.openai`.

Wenn Sie in einer älteren Konfiguration, in Authentifizierungsprofil-IDs oder in `auth.order.openai-codex` auf `openai-codex` stoßen, behandeln Sie es als veraltete Migrationseingabe – erstellen Sie keine neuen `openai-codex`-Profile. Führen Sie Folgendes aus:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor schreibt veraltete `openai-codex:*`-Profil-IDs und Einträge unter `auth.order.openai-codex` auf die kanonische `openai`-Route um. Informationen zur OpenAI-spezifischen Modell-/Laufzeitweiterleitung finden Sie unter [OpenAI](/de/providers/openai).

### Während der Anmeldung (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Mit `--profile-id` bleiben mehrere OAuth-Anmeldungen für denselben Provider innerhalb eines Agenten voneinander getrennt.

`--force` löscht die gespeicherten Authentifizierungsprofile für diesen Provider im ausgewählten Agentenverzeichnis und führt anschließend denselben Authentifizierungsablauf erneut aus. Verwenden Sie diese Option, wenn ein gespeichertes Profil nicht mehr reagiert, abgelaufen oder mit dem falschen Konto verknüpft ist. Die Anmeldedaten beim Provider werden dadurch nicht widerrufen.

```bash
openclaw models auth login --provider anthropic --force
```

### Pro Sitzung (Chat-Befehl)

- `/model <alias-or-id>@<profileId>` legt bestimmte Provider-Anmeldedaten für die aktuelle Sitzung fest (Beispiele für Profil-IDs: `anthropic:default`, `anthropic:work`).
- `/model` (oder `/model list`) zeigt eine kompakte Auswahl; `/model status` zeigt die vollständige Ansicht (Kandidaten und nächstes Authentifizierungsprofil sowie konfigurierte Provider-Endpunktdetails).

Wenn Sie die Authentifizierungsreihenfolge oder die Profilfestlegung für einen bereits laufenden Chat ändern, senden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten. Bestehende Sitzungen behalten ihre aktuelle Modell-/Profilauswahl bis zum Zurücksetzen bei.

### Pro Agent (CLI-Überschreibung)

Überschreibungen der Authentifizierungsreihenfolge werden im SQLite-Authentifizierungsstatus dieses Agenten gespeichert:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten auszuwählen; lassen Sie die Option weg, um den konfigurierten Standardagenten zu verwenden. `openclaw models status --probe` zeigt ausgelassene gespeicherte Profile als `excluded_by_auth_order` an, anstatt sie stillschweigend zu überspringen.

## Fehlerbehebung

### „Keine Anmeldedaten gefunden“

Konfigurieren Sie einen Anthropic-API-Schlüssel auf dem **Gateway-Host** oder richten Sie den Anthropic-Einrichtungstoken-Weg ein und prüfen Sie den Status anschließend erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu sehen, welches Profil abläuft. Wenn ein Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie es über ein Einrichtungstoken oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandte Themen

- [Verwaltung von Geheimnissen](/de/gateway/secrets)
- [Fernzugriff](/de/gateway/remote)
- [Authentifizierungsspeicher](/de/concepts/oauth)
