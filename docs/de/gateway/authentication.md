---
read_when:
    - Fehlersuche bei der Modell-Authentifizierung oder beim OAuth-Ablauf
    - Authentifizierung oder Speicherung von Anmeldedaten dokumentieren
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic setup-token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-30T06:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite ist die Authentifizierungsreferenz für **Modell-Provider** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-setup-token). Für die Authentifizierung der **Gateway-Verbindung** (Token, Passwort, trusted-proxy) siehe [Konfiguration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für ständig verfügbare Gateway-Hosts sind API-Schlüssel in der Regel die am besten vorhersehbare Option. Subscription-/OAuth-Abläufe werden ebenfalls unterstützt, wenn sie zum Kontomodell Ihres Providers passen.

Den vollständigen OAuth-Ablauf und das Speicherlayout finden Sie unter [/concepts/oauth](/de/concepts/oauth).
Für SecretRef-basierte Authentifizierung (`env`-/`file`-/`exec`-Provider) siehe [Secrets-Verwaltung](/de/gateway/secrets).
Die Regeln für Berechtigungen von Zugangsdaten und Begründungscodes, die von `models status --probe` verwendet werden, finden Sie unter [Semantik von Auth-Zugangsdaten](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für den gewählten Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die am besten vorhersehbare Servereinrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude-CLI-Anmeldung.

1. Erstellen Sie in der Konsole Ihres Providers einen API-Schlüssel.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` ausgeführt wird).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel vorzugsweise in `~/.openclaw/.env` ab, damit der Daemon ihn lesen kann:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Starten Sie anschließend den Daemon neu (oder starten Sie Ihren Gateway-Prozess neu) und prüfen Sie erneut:

```bash
openclaw models status
openclaw doctor
```

Wenn Sie Umgebungsvariablen nicht selbst verwalten möchten, kann das Onboarding API-Schlüssel für die Daemon-Nutzung speichern: `openclaw onboard`.

Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) finden Sie unter [Hilfe](/de/help).

## Anthropic: Claude CLI und Token-Kompatibilität

Die Authentifizierung per Anthropic setup-token ist in OpenClaw weiterhin als unterstützter Token-Pfad verfügbar. Anthropic-Mitarbeiter haben uns inzwischen mitgeteilt, dass die Nutzung der Claude CLI im OpenClaw-Stil wieder erlaubt ist. Daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn die Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies nun der bevorzugte Pfad.

Für langlebige Gateway-Hosts ist ein Anthropic-API-Schlüssel weiterhin die am besten vorhersehbare Einrichtung. Wenn Sie eine bestehende Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie im Onboarding/in der Konfiguration den Anthropic-Claude-CLI-Pfad.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine Einrichtung in zwei Schritten:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale `claude-cli`-Backend umzustellen und das passende OpenClaw-Auth-Profil zu speichern.

Wenn `claude` nicht in `PATH` ist, installieren Sie zuerst Claude Code oder setzen Sie `agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Binärpfad.

Manuelle Token-Eingabe (beliebiger Provider; schreibt `auth-profiles.json` und aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` speichert ausschließlich Zugangsdaten. Die kanonische Struktur ist:

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

OpenClaw erwartet zur Laufzeit die kanonische Struktur aus `version` und `profiles`. Wenn eine ältere Installation noch eine flache Datei wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie als `openrouter:default`-API-Schlüsselprofil neu zu schreiben; doctor behält eine `.legacy-flat.*.bak`-Kopie neben dem Original. Endpoint-Details wie `baseUrl`, `api`, Modell-IDs, Header und Timeouts gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in `auth-profiles.json`.

Auth-Profil-Referenzen werden auch für statische Zugangsdaten unterstützt:

- `api_key`-Zugangsdaten können `keyRef: { source, provider, id }` verwenden
- `token`-Zugangsdaten können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Zugangsdaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`-/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Prüfungen:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Umgebungszugangsdaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet probe für dieses Profil `excluded_by_auth_order`, statt es zu versuchen.
- Wenn Auth vorhanden ist, OpenClaw aber keinen prüfbaren Modellkandidaten für diesen Provider auflösen kann, meldet probe `status: no_model`.
- Rate-Limit-Cooldowns können modellspezifisch sein. Ein Profil, das für ein Modell abkühlt, kann weiterhin für ein verwandtes Modell beim selben Provider nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth-Überwachungsskripte](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-Backend `claude-cli` wird wieder unterstützt.

- Anthropic-Mitarbeiter haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für Anthropic-gestützte Ausführungen als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die am besten vorhersehbare Wahl für langlebige Gateway-Hosts und explizite serverseitige Abrechnungskontrolle.

## Modell-Auth-Status prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei API-Schlüsselrotation (Gateway)

Einige Provider unterstützen das erneute Senden einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf ein Provider-Rate-Limit erreicht.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen zusätzlich `GOOGLE_API_KEY` als weiteren Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es nur bei Rate-Limit-Fehlern mit dem nächsten Schlüssel erneut (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder `workers_ai ... quota limit exceeded`).
- Bei Fehlern, die keine Rate-Limit-Fehler sind, wird nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Zugangsdaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Zugangsdaten für die aktuelle Sitzung festzulegen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie konfigurierte Provider-Endpoint-Details).

### Pro Agent (CLI-Überschreibung)

Legen Sie eine explizite Überschreibung der Auth-Profil-Reihenfolge für einen Agent fest (gespeichert in der `auth-state.json` dieses Agent):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agent anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agent zu verwenden.
Wenn Sie Reihenfolgeprobleme debuggen, zeigt `openclaw models status --probe` ausgelassene gespeicherte Profile als `excluded_by_auth_order`, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, beachten Sie, dass Rate-Limit-Cooldowns an eine Modell-ID gebunden sein können statt an das gesamte Provider-Profil.

## Fehlerbehebung

### „Keine Zugangsdaten gefunden“

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem **Gateway-Host** oder richten Sie den Anthropic-setup-token-Pfad ein und prüfen Sie anschließend erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie diese Einrichtung über setup-token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandte Themen

- [Secrets-Verwaltung](/de/gateway/secrets)
- [Remote-Zugriff](/de/gateway/remote)
- [Auth-Speicher](/de/concepts/oauth)
