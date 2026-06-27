---
read_when:
    - Debugging von Modellauthentifizierung oder OAuth-Ablauf
    - Authentifizierung oder Speicherung von Zugangsdaten dokumentieren
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-06-27T17:27:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite ist die Authentifizierungsreferenz für **Modell-Provider** (API-Schlüssel, OAuth, Claude-CLI-Wiederverwendung und Anthropic-Setup-Token). Informationen zur **Gateway-Verbindungs**-Authentifizierung (Token, Passwort, Trusted Proxy) finden Sie unter [Konfiguration](/de/gateway/configuration) und [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft aktive Gateway-Hosts sind API-Schlüssel in der Regel die berechenbarste Option. Abonnement-/OAuth-Flows werden ebenfalls unterstützt, wenn sie zum Kontomodell Ihres Providers passen.

Den vollständigen OAuth-Flow und das Speicherlayout finden Sie unter [/concepts/oauth](/de/concepts/oauth).
Für SecretRef-basierte Authentifizierung (`env`-/`file`-/`exec`-Provider) siehe [Secret-Verwaltung](/de/gateway/secrets).
Die Regeln für die Eignung von Anmeldedaten und Reason Codes, die von `models status --probe` verwendet werden, finden Sie unter [Semantik von Auth-Anmeldedaten](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für den ausgewählten Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die berechenbarste Servereinrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude-CLI-Anmeldung.

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Providers.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Computer, auf dem `openclaw gateway` ausgeführt wird).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, sollten Sie den Schlüssel vorzugsweise in `~/.openclaw/.env` ablegen, damit der Daemon ihn lesen kann:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Starten Sie dann den Daemon neu (oder starten Sie Ihren Gateway-Prozess neu) und prüfen Sie erneut:

```bash
openclaw models status
openclaw doctor
```

Wenn Sie Umgebungsvariablen nicht selbst verwalten möchten, kann das Onboarding API-Schlüssel für die Daemon-Nutzung speichern: `openclaw onboard`.

Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) finden Sie unter [Hilfe](/de/help).

## Anthropic: Claude CLI und Token-Kompatibilität

Anthropic-Setup-Token-Authentifizierung ist in OpenClaw weiterhin als unterstützter Token-Pfad verfügbar. Anthropic-Mitarbeitende haben uns inzwischen mitgeteilt, dass die OpenClaw-artige Nutzung der Claude CLI wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als autorisiert, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn die Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts bleibt ein Anthropic-API-Schlüssel die berechenbarste Einrichtung. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie den Anthropic-Claude-CLI-Pfad im Onboarding/in der Konfiguration.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine zweistufige Einrichtung:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale `claude-cli`-Backend umzustellen und das passende OpenClaw-Auth-Profil zu speichern.

Wenn `claude` nicht in `PATH` enthalten ist, installieren Sie zuerst Claude Code oder setzen Sie `agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Binärpfad.

Manuelle Token-Eingabe (beliebiger Provider; schreibt den SQLite-Auth-Speicher pro Agent und aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Der Auth-Profilspeicher enthält nur Anmeldedaten. Legacy-Dateien namens `auth-profiles.json` verwendeten diese kanonische Form:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw liest Auth-Profile jetzt aus der `openclaw-agent.sqlite` jedes Agenten. Wenn eine ältere Installation noch `auth-profiles.json`, `auth-state.json` oder eine flache Auth-Profildatei wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie in SQLite zu importieren; Doctor legt zeitgestempelte Sicherungen neben den ursprünglichen JSON-Dateien ab. Endpoint-Details wie `baseUrl`, `api`, Modell-IDs, Header und Timeouts gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in Auth-Profile.

Externe Auth-Routen wie Bedrock `auth: "aws-sdk"` sind ebenfalls keine Anmeldedaten. Wenn Sie eine benannte Bedrock-Route wünschen, legen Sie `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json` ab; schreiben Sie nicht `type: "aws-sdk"` in den Auth-Profilspeicher. `openclaw doctor --fix` verschiebt Legacy-AWS-SDK-Markierungen aus dem Anmeldedatenspeicher in Konfigurationsmetadaten.

Auth-Profilreferenzen werden auch für statische Anmeldedaten unterstützt:

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`-/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Probes:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe für dieses Profil `excluded_by_auth_order`, statt es auszuprobieren.
- Wenn Auth vorhanden ist, OpenClaw aber keinen prüfbaren Modellkandidaten für diesen Provider auflösen kann, meldet die Probe `status: no_model`.
- Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein Modell abkühlt, kann für ein Schwestermodell beim selben Provider weiterhin verwendbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth-Überwachungsskripte](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-Backend `claude-cli` wird wieder unterstützt.

- Anthropic-Mitarbeitende haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` daher für Anthropic-gestützte Läufe als autorisiert, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die berechenbarste Wahl für langlebige Gateway-Hosts und explizite serverseitige Abrechnungskontrolle.

## Modell-Auth-Status prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten der API-Schlüsselrotation (Gateway)

Einige Provider unterstützen das erneute Senden einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf ein Provider-Rate-Limit erreicht.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider enthalten außerdem `GOOGLE_API_KEY` als zusätzlichen Fallback.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es nur bei Rate-Limit-Fehlern mit dem nächsten Schlüssel erneut (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der finale Fehler aus dem letzten Versuch zurückgegeben.

## Provider-Auth entfernen, während das Gateway läuft

Wenn Provider-Auth über die Gateway-Steuerungsebene entfernt wird, löscht OpenClaw die gespeicherten Auth-Profile für diesen Provider und bricht aktive Chat- oder Agent-Läufe ab, deren ausgewählter Modell-Provider dem entfernten Provider entspricht. Die abgebrochenen Läufe senden die normalen Chat-Abbruch- und Lebenszyklusereignisse mit `stopReason: "auth-revoked"`, sodass verbundene Clients anzeigen können, dass der Lauf gestoppt wurde, weil Anmeldedaten entfernt wurden.

Das Entfernen gespeicherter Auth widerruft keine Schlüssel beim Provider. Rotieren oder widerrufen Sie den Schlüssel im Provider-Dashboard, wenn Sie eine providerseitige Invalidierung benötigen.

## Steuern, welche Anmeldedaten verwendet werden

### OpenAI und Legacy-IDs `openai-codex`

OpenAI-API-Schlüsselprofile und ChatGPT/Codex-OAuth-Profile verwenden beide die kanonische Provider-ID `openai`. Neue Konfiguration sollte `openai:*`-Profil-IDs und `auth.order.openai` verwenden.

Wenn Sie `openai-codex` in älterer Konfiguration, Auth-Profil-IDs oder `auth.order.openai-codex` sehen, behandeln Sie es als Legacy-Migrationseingabe. Erstellen Sie keine neuen `openai-codex`-Profile. Führen Sie aus:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor schreibt Legacy-Profil-IDs `openai-codex:*` und Einträge unter `auth.order.openai-codex` auf die kanonische `openai`-Auth-Route um. OpenAI-spezifisches Modell-/Runtime-Routing finden Sie unter [OpenAI](/de/providers/openai).

### Während der Anmeldung (CLI)

Verwenden Sie `openclaw models auth login --provider <id> --profile-id <profileId>` für Provider, die benannte Auth-Profile während der Anmeldung unterstützen.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Dies ist der einfachste Weg, mehrere OAuth-Anmeldungen für denselben Provider innerhalb eines Agenten getrennt zu halten.

Verwenden Sie `--force`, wenn ein gespeichertes Provider-Profil festhängt, abgelaufen ist oder mit dem falschen Konto verknüpft ist und der normale Anmeldebefehl es immer wiederverwendet. `--force` löscht die gespeicherten Auth-Profile für diesen Provider im ausgewählten Agentenverzeichnis und führt anschließend denselben Provider-Auth-Flow erneut aus. Es widerruft keine Anmeldedaten beim Provider; rotieren oder widerrufen Sie sie im Provider-Dashboard, wenn Sie eine providerseitige Invalidierung benötigen.

```bash
openclaw models auth login --provider anthropic --force
```

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Provider-Endpoint-Details, sofern konfiguriert).

### Pro Agent (CLI-Überschreibung)

Legen Sie eine explizite Überschreibung der Auth-Profilreihenfolge für einen Agenten fest (gespeichert im SQLite-Auth-Status dieses Agenten):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standardagenten zu verwenden.
Wenn Sie Reihenfolgeprobleme debuggen, zeigt `openclaw models status --probe` ausgelassene gespeicherte Profile als `excluded_by_auth_order` an, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, denken Sie daran, dass Rate-Limit-Cooldowns an eine Modell-ID gebunden sein können statt an das gesamte Provider-Profil.

Wenn Sie die Auth-Reihenfolge oder Profilfixierung für einen Chat ändern, der bereits läuft, senden Sie `/new` oder `/reset` in diesem Chat, um eine neue Sitzung zu starten. Bestehende Sitzungen können ihre aktuelle Modell-/Profilauswahl bis zum Zurücksetzen beibehalten.

## Fehlerbehebung

### „Keine Anmeldedaten gefunden“

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem **Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil abläuft. Wenn ein Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie diese Einrichtung über Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandt

- [Secret-Verwaltung](/de/gateway/secrets)
- [Remote-Zugriff](/de/gateway/remote)
- [Auth-Speicher](/de/concepts/oauth)
