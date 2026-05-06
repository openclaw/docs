---
read_when:
    - Fehlersuche bei Modellauthentifizierung oder OAuth-Ablauf
    - Authentifizierung oder Speicherung von Anmeldedaten dokumentieren
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-05-06T06:46:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34c83f8d2bb2016e20e5c0bbd65f8972f543aebdecdc5ad47b1f7df6d02ed783
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite ist die Authentifizierungsreferenz für **Modell-Provider** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Informationen zur Authentifizierung für die **Gateway-Verbindung** (Token, Passwort, Trusted Proxy) finden Sie unter [Konfiguration](/de/gateway/configuration) und [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-Hosts
sind API-Schlüssel in der Regel die am besten vorhersehbare Option. Subscription-/OAuth-
Abläufe werden ebenfalls unterstützt, wenn sie zum Kontomodell Ihres Providers passen.

Den vollständigen OAuth-Ablauf und das Speicherlayout finden Sie unter [/concepts/oauth](/de/concepts/oauth).
Für SecretRef-basierte Authentifizierung (`env`-/`file`-/`exec`-Provider) siehe [Geheimnisverwaltung](/de/gateway/secrets).
Die Regeln für Berechtigungen von Anmeldedaten und Reason-Codes, die von `models status --probe` verwendet werden, finden Sie unter
[Semantik von Auth-Anmeldedaten](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die am besten vorhersehbare Server-
Einrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude CLI-Anmeldung.

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Providers.
2. Hinterlegen Sie ihn auf dem **Gateway-Host** (dem Rechner, auf dem `openclaw gateway` läuft).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn das Gateway unter systemd/launchd läuft, legen Sie den Schlüssel vorzugsweise in
   `~/.openclaw/.env` ab, damit der Daemon ihn lesen kann:

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

Wenn Sie Env-Vars nicht selbst verwalten möchten, kann das Onboarding
API-Schlüssel für die Daemon-Nutzung speichern: `openclaw onboard`.

Details zur Env-Vererbung (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) finden Sie unter [Hilfe](/de/help).

## Anthropic: Claude CLI und Token-Kompatibilität

Die Anthropic-Setup-Token-Authentifizierung ist in OpenClaw weiterhin als unterstützter Token-
Pfad verfügbar. Mitarbeitende von Anthropic haben uns inzwischen mitgeteilt, dass die OpenClaw-artige Nutzung der Claude CLI
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p`
für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn
die Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts ist ein Anthropic-API-Schlüssel weiterhin die am besten vorhersehbare
Einrichtung. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie den
Anthropic-Claude-CLI-Pfad im Onboarding/in der Konfiguration.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine Einrichtung in zwei Schritten:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale `claude-cli`-
   Backend umzustellen und das passende OpenClaw-Auth-Profil zu speichern.

Wenn `claude` nicht in `PATH` liegt, installieren Sie entweder zuerst Claude Code oder setzen Sie
`agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Binärpfad.

Manuelle Token-Eingabe (beliebiger Provider; schreibt `auth-profiles.json` und aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` speichert nur Anmeldedaten. Die kanonische Form ist:

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

OpenClaw erwartet zur Laufzeit die kanonische Form mit `version` und `profiles`. Wenn eine ältere Installation noch eine flache Datei wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie als `openrouter:default`-API-Schlüsselprofil neu zu schreiben; doctor behält eine `.legacy-flat.*.bak`-Kopie neben dem Original. Endpoint-Details wie `baseUrl`, `api`, Modell-IDs, Header und Timeouts gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in `auth-profiles.json`.

Auth-Profil-Refs werden auch für statische Anmeldedaten unterstützt:

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`-/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1`, wenn abgelaufen/fehlend, `2`, wenn bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Prüfungen:

```bash
openclaw models status --probe
```

Hinweise:

- Prüfzeilen können aus Auth-Profilen, Env-Anmeldedaten oder `models.json` stammen.
- Wenn eine explizite `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Prüfung
  `excluded_by_auth_order` für dieses Profil, statt es zu versuchen.
- Wenn Auth vorhanden ist, OpenClaw aber keinen prüfbaren Modellkandidaten für
  diesen Provider auflösen kann, meldet die Prüfung `status: no_model`.
- Rate-Limit-Cooldowns können modellbezogen sein. Ein Profil, das für ein
  Modell abkühlt, kann weiterhin für ein Geschwistermodell beim selben Provider nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth-Überwachungsskripte](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-`claude-cli`-Backend wird wieder unterstützt.

- Mitarbeitende von Anthropic haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt
  für Anthropic-gestützte Ausführungen, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die am besten vorhersehbare Wahl für langlebige Gateway-
  Hosts und explizite serverseitige Abrechnungskontrolle.

## Auth-Status des Modells prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei API-Schlüsselrotation (Gateway)

Einige Provider unterstützen das Wiederholen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
ein Provider-Rate-Limit erreicht.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelner Override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen auch `GOOGLE_API_KEY` als zusätzlichen Fallback ein.
- Dieselbe Schlüsselliste wird vor der Nutzung dedupliziert.
- OpenClaw wiederholt den Versuch mit dem nächsten Schlüssel nur bei Rate-Limit-Fehlern (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln wiederholt.
- Wenn alle Schlüssel fehlschlagen, wird der finale Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Provider-Endpoint-Details, wenn konfiguriert).

### Pro Agent (CLI-Override)

Legen Sie einen expliziten Override für die Auth-Profilreihenfolge für einen Agent fest (gespeichert in der `auth-state.json` dieses Agents):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agent anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agent zu verwenden.
Wenn Sie Reihenfolgeprobleme debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order` an, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, beachten Sie, dass Rate-Limit-Cooldowns an
eine Modell-ID gebunden sein können statt an das gesamte Provider-Profil.

## Fehlerbehebung

### "No credentials found"

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem
**Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie anschließend erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil abläuft. Wenn ein
Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie diese Einrichtung über
Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandt

- [Geheimnisverwaltung](/de/gateway/secrets)
- [Remotezugriff](/de/gateway/remote)
- [Auth-Speicherung](/de/concepts/oauth)
