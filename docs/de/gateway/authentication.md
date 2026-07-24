---
read_when:
    - Debugging der Modellauthentifizierung oder des OAuth-Ablaufs
    - Dokumentation der Authentifizierung oder Speicherung von Anmeldedaten
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Einrichtungstoken'
title: Authentifizierung
x-i18n:
    generated_at: "2026-07-24T04:54:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1fd4bf1c73f41d297638811f568c1b11e920eba3bd1527206cbb760df51531f2
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite behandelt die Authentifizierung bei **Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI, Anthropic-Setup-Token). Informationen zur Authentifizierung für die **Gateway-Verbindung** (Token, Passwort, vertrauenswürdiger Proxy) finden Sie unter [Konfiguration](/de/gateway/configuration) und [Authentifizierung über einen vertrauenswürdigen Proxy](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für einen dauerhaft aktiven Gateway-Host ist ein API-Schlüssel die am besten vorhersehbare Option; Abonnement-/OAuth-Abläufe funktionieren ebenfalls, wenn sie zum Kontomodell Ihres Providers passen.

- Vollständiger OAuth-Ablauf und Speicherlayout: [/concepts/oauth](/de/concepts/oauth)
- SecretRef-basierte Authentifizierung (`env`/`file`/`exec`-Provider): [Verwaltung von Geheimnissen](/de/gateway/secrets)
- Von `models status --probe` verwendete Berechtigungs-/Ursachencodes für Anmeldedaten: [Semantik der Authentifizierungsdaten](/de/auth-credential-semantics)

## Empfohlene Einrichtung: API-Schlüssel (beliebiger Provider)

1. Erstellen Sie in der Konsole Ihres Providers einen API-Schlüssel.
2. Hinterlegen Sie ihn auf dem **Gateway-Host** (dem Rechner, auf dem `openclaw gateway` ausgeführt wird):

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

4. Starten Sie den Gateway-Prozess (oder den Daemon) neu und prüfen Sie den Status anschließend erneut:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` kann API-Schlüssel auch für die Verwendung durch den Daemon speichern, wenn Sie Umgebungsvariablen nicht selbst verwalten möchten. Die vollständige Prioritätsreihenfolge beim Laden von Umgebungsvariablen (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) finden Sie unter [Umgebungsvariablen](/de/help/environment).

## Anthropic: Wiederverwendung der Claude CLI

Die Authentifizierung per Anthropic-Setup-Token wird weiterhin unterstützt. Die Wiederverwendung der Claude CLI (Verwendung im Stil von `claude -p`) ist für diese Integration ebenfalls vorgesehen; wenn auf dem Host eine Claude-CLI-Anmeldung verfügbar ist, ist dies der bevorzugte Weg für die lokale/Desktop-Nutzung. Für langlebige Gateway-Hosts bleibt ein Anthropic-API-Schlüssel die am besten vorhersehbare Wahl und ermöglicht eine explizite serverseitige Abrechnungskontrolle.

Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Auf dem Gateway-Host ausführen
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies umfasst zwei Schritte: Melden Sie Claude Code auf dem Host bei Anthropic an und weisen Sie OpenClaw anschließend an, die Auswahl von Anthropic-Modellen über das lokale `claude-cli`-Backend zu leiten und das entsprechende OpenClaw-Authentifizierungsprofil zu speichern.

Der Gateway-Dienst muss `claude` über `PATH` auflösen können. Wenn eine Bereitstellung einen
nicht standardmäßigen Pfad zur ausführbaren Datei benötigt, registrieren Sie einen Wrapper über ein
[CLI-Backend-Plugin](/de/plugins/cli-backend-plugins).

## Manuelle Token-Eingabe

Funktioniert mit jedem Provider; schreibt in den agentenspezifischen SQLite-Authentifizierungsspeicher und aktualisiert die Konfiguration:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw liest Authentifizierungsprofile aus `openclaw-agent.sqlite` des jeweiligen Agenten. Endpunktdetails (`baseUrl`, `api`, Modell-IDs, Header, Zeitüberschreitungen) gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in Authentifizierungsprofile.

Wenn eine ältere Installation noch `auth-profiles.json`, `auth-state.json` oder eine flache Struktur wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie in SQLite zu importieren; Doctor legt neben den ursprünglichen JSON-Dateien Sicherungskopien mit Zeitstempel ab.

Externe Authentifizierungsrouten wie Bedrock `auth: "aws-sdk"` sind keine Anmeldedaten. Legen Sie für eine benannte Bedrock-Route `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json` fest — schreiben Sie `type: "aws-sdk"` nicht in den Speicher für Authentifizierungsprofile. `openclaw doctor --fix` migriert veraltete AWS-SDK-Markierungen aus dem Anmeldedatenspeicher in die Konfigurationsmetadaten.

### SecretRef-gestützte Anmeldedaten

- Für `api_key`-Anmeldedaten kann `keyRef: { source, provider, id }` verwendet werden
- Für `token`-Anmeldedaten kann `tokenRef: { source, provider, id }` verwendet werden
- Profile im OAuth-Modus lehnen SecretRef-Anmeldedaten ab: Wenn `auth.profiles.<id>.mode` den Wert `"oauth"` hat, wird ein SecretRef-gestütztes `keyRef`/`tokenRef` für dieses Profil abgelehnt.

## Authentifizierungsstatus von Modellen prüfen

```bash
openclaw models status
openclaw doctor
```

Automatisierungsfreundliche Prüfung mit Exit-Code `1` bei abgelaufenen/fehlenden Anmeldedaten und `2` bei bald ablaufenden Anmeldedaten:

```bash
openclaw models status --check
```

Live-Authentifizierungsprüfungen (fügen Sie `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` oder `--probe-max-tokens` hinzu, um den Umfang einzugrenzen):

```bash
openclaw models status --probe
```

Hinweise:

- Prüfzeilen können aus Authentifizierungsprofilen, Anmeldedaten aus der Umgebung oder `models.json` stammen.
- Wenn `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung für dieses Profil `excluded_by_auth_order`, anstatt es zu testen.
- Wenn eine Authentifizierung vorhanden ist, OpenClaw jedoch kein prüfbares Modell für diesen Provider auflösen kann, meldet die Prüfung `status: no_model`.
- Abklingzeiten bei Ratenbegrenzungen können modellspezifisch sein: Ein Profil, das sich für ein Modell in der Abklingzeit befindet, kann weiterhin ein anderes Modell desselben Providers bedienen.

Optionale Betriebsskripte (systemd/Termux): [Skripte zur Authentifizierungsüberwachung](/de/help/scripts#auth-monitoring-scripts).

## Rotation von API-Schlüsseln (Gateway)

Einige Provider wiederholen eine Anfrage mit einem alternativ konfigurierten Schlüssel, wenn ein Aufruf auf eine Ratenbegrenzung des Providers stößt.

Prioritätsreihenfolge der Schlüssel je Provider:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung, legt einen Schlüssel fest)
2. `<PROVIDER>_API_KEYS` (durch Kommas, Leerzeichen oder Semikolons getrennte Liste)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (jede Umgebungsvariable mit diesem Präfix)

Google-Provider (`google`, `google-vertex`) greifen zusätzlich auf `GOOGLE_API_KEY` zurück. Duplikate werden vor der Verwendung aus der kombinierten Liste entfernt.

OpenClaw wechselt nur dann zum nächsten Schlüssel, wenn die Fehlermeldung einem der folgenden Werte entspricht: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` oder `too many requests`. Andere Fehler werden nicht mit alternativen Schlüsseln erneut versucht. Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

<Note>
Providerspezifische Formulierungen wie `ThrottlingException`, `concurrency limit reached` oder `workers_ai ... quota limit exceeded` steuern die **Failover-/Wiederholungs-Klassifizierung** (Wechseln von Modellen oder Providern bei wiederholtem Fehlschlag), einen von der oben beschriebenen API-Schlüsselrotation getrennten Mechanismus.
</Note>

Durch das Entfernen einer gespeicherten Authentifizierung wird der Schlüssel beim Provider nicht widerrufen — rotieren oder widerrufen Sie ihn im Dashboard des Providers, wenn eine providerseitige Ungültigmachung erforderlich ist.

## Provider-Authentifizierung bei laufendem Gateway entfernen

Wenn Sie die Provider-Authentifizierung über die Gateway-Steuerungsebene entfernen, löscht OpenClaw die gespeicherten Authentifizierungsprofile dieses Providers und bricht aktive Chat-/Agentenläufe ab, deren ausgewählter Modell-Provider mit dem entfernten Provider übereinstimmt. Abgebrochene Läufe senden die normalen Abbruch-/Lebenszyklusereignisse mit `stopReason: "auth-revoked"`, sodass verbundene Clients anzeigen können, dass der Lauf wegen entfernter Anmeldedaten angehalten wurde.

## Verwendete Anmeldedaten steuern

### OpenAI und veraltete `openai-codex`-IDs

Sowohl OpenAI-API-Schlüsselprofile als auch ChatGPT-/Codex-OAuth-Profile verwenden die kanonische Provider-ID `openai`. Verwenden Sie für neue Konfigurationen `openai:*`-Profil-IDs und `auth.order.openai`.

Wenn Sie `openai-codex` in einer älteren Konfiguration, in Authentifizierungsprofil-IDs oder in `auth.order.openai-codex` sehen, behandeln Sie es als veraltete Migrationseingabe — erstellen Sie keine neuen `openai-codex`-Profile. Führen Sie Folgendes aus:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor schreibt veraltete `openai-codex:*`-Profil-IDs und `auth.order.openai-codex`-Einträge auf die kanonische `openai`-Route um. Informationen zur OpenAI-spezifischen Modell-/Runtime-Weiterleitung finden Sie unter [OpenAI](/de/providers/openai).

### Während der Anmeldung (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` hält mehrere OAuth-Anmeldungen für denselben Provider innerhalb eines Agenten getrennt.

`--force` löscht die gespeicherten Authentifizierungsprofile dieses Providers im ausgewählten Agentenverzeichnis und führt anschließend denselben Authentifizierungsablauf erneut aus. Verwenden Sie dies, wenn ein gespeichertes Profil festhängt, abgelaufen oder mit dem falschen Konto verknüpft ist. Dadurch werden die Anmeldedaten beim Provider nicht widerrufen.

```bash
openclaw models auth login --provider anthropic --force
```

### Pro Sitzung (Chatbefehl)

- `/model <alias-or-id>@<profileId>` legt bestimmte Provider-Anmeldedaten für die aktuelle Sitzung fest (Beispiele für Profil-IDs: `anthropic:default`, `anthropic:work`).
- `/model` (oder `/model list`) zeigt eine kompakte Auswahl; `/model status` zeigt die vollständige Ansicht (Kandidaten und nächstes Authentifizierungsprofil sowie konfigurierte Provider-Endpunktdetails).

Wenn Sie die Authentifizierungsreihenfolge oder die Profilfestlegung für einen bereits laufenden Chat ändern, senden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten — bestehende Sitzungen behalten ihre aktuelle Modell-/Profilauswahl bis zum Zurücksetzen bei.

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

Konfigurieren Sie einen Anthropic-API-Schlüssel auf dem **Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie den Status anschließend erneut:

```bash
openclaw models status
```

### Token läuft ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu sehen, welches Profil abläuft. Wenn ein Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie es über den Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandte Themen

- [Verwaltung von Geheimnissen](/de/gateway/secrets)
- [Remote-Zugriff](/de/gateway/remote)
- [Authentifizierungsspeicher](/de/concepts/oauth)
