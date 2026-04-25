---
read_when:
    - Modellauthentifizierung oder OAuth-Ablauf debuggen
    - Authentifizierung oder Speicherung von Anmeldedaten dokumentieren
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-25T13:45:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
Diese Seite behandelt die Authentifizierung von **Modell-Providern** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Für die Authentifizierung der **Gateway-Verbindung** (Token, Passwort, Trusted Proxy) siehe [Configuration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-
Hosts sind API-Schlüssel in der Regel die vorhersehbarste Option. Abo-/OAuth-
Abläufe werden ebenfalls unterstützt, wenn sie zu Ihrem Provider-Kontomodell passen.

Siehe [/concepts/oauth](/de/concepts/oauth) für den vollständigen OAuth-Ablauf und das Storage-
Layout.
Für SecretRef-basierte Authentifizierung (Provider `env`/`file`/`exec`) siehe [Secrets Management](/de/gateway/secrets).
Für Regeln zu Berechtigung und Reason-Codes für Anmeldedaten, die von `models status --probe` verwendet werden, siehe
[Auth Credential Semantics](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie ein langlebiges Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die vorhersehbarste Server-
Einrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude-CLI-Anmeldung.

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Providers.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` läuft).

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

Starten Sie dann den Daemon neu (oder starten Sie Ihren Gateway-Prozess neu) und prüfen Sie erneut:

```bash
openclaw models status
openclaw doctor
```

Wenn Sie Umgebungsvariablen lieber nicht selbst verwalten möchten, kann Onboarding
API-Schlüssel für die Verwendung durch den Daemon speichern: `openclaw onboard`.

Siehe [Help](/de/help) für Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Kompatibilität von Claude CLI und Token

Die Anthropic-Authentifizierung per Setup-Token ist in OpenClaw weiterhin als unterstützter Token-
Pfad verfügbar. Mitarbeitende von Anthropic haben uns inzwischen mitgeteilt, dass die Verwendung der Claude CLI im OpenClaw-Stil
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p`
für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn die
Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts bleibt ein Anthropic-API-Schlüssel weiterhin die vorhersehbarste
Einrichtung. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, verwenden Sie den
Pfad der Anthropic Claude CLI in onboarding/configure.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Auf dem Gateway-Host ausführen
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine Einrichtung in zwei Schritten:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale `claude-cli`-
   Backend umzustellen und das passende OpenClaw-Authentifizierungsprofil zu speichern.

Wenn `claude` nicht im `PATH` ist, installieren Sie entweder zuerst Claude Code oder setzen Sie
`agents.defaults.cliBackends.claude-cli.command` auf den tatsächlichen Binärpfad.

Manuelle Token-Eingabe (beliebiger Provider; schreibt `auth-profiles.json` + aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Auth-Profil-Referenzen werden auch für statische Anmeldedaten unterstützt:

- Anmeldedaten vom Typ `api_key` können `keyRef: { source, provider, id }` verwenden
- Anmeldedaten vom Typ `token` können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte Eingabe über `keyRef`/`tokenRef` für dieses Profil abgewiesen.

Prüfung für Automatisierung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Authentifizierungsprüfungen:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet Probe
  `excluded_by_auth_order` für dieses Profil, statt es zu versuchen.
- Wenn Auth vorhanden ist, OpenClaw aber kein für Probes geeignetes Modellszenario für
  diesen Provider auflösen kann, meldet Probe `status: no_model`.
- Cooldowns für Rate Limits können modellspezifisch sein. Ein Profil, das für ein
  Modell im Cooldown ist, kann für ein verwandtes Modell beim selben Provider weiterhin nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth monitoring scripts](/de/help/scripts#auth-monitoring-scripts)

## Hinweis zu Anthropic

Das Anthropic-Backend `claude-cli` wird wieder unterstützt.

- Mitarbeitende von Anthropic haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als zulässig
  für Anthropic-gestützte Läufe, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die vorhersehbarste Wahl für langlebige Gateway-
  Hosts und explizite serverseitige Abrechnungskontrolle.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei Rotation von API-Schlüsseln (Gateway)

Einige Provider unterstützen das erneute Versuchen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
ein Rate Limit des Providers erreicht.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider schließen außerdem `GOOGLE_API_KEY` als zusätzliche Ausweichoption ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es nur bei Rate-Limit-Fehlern mit dem nächsten Schlüssel erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispielprofil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Endpoint-Details des Providers, wenn konfiguriert).

### Pro Agent (CLI-Überschreibung)

Setzen Sie eine explizite Überschreibung der Reihenfolge von Auth-Profilen für einen Agenten (gespeichert in dessen `auth-state.json`):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten als Ziel zu wählen; lassen Sie es weg, um den konfigurierten Standard-Agenten zu verwenden.
Wenn Sie Probleme mit der Reihenfolge debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order`, statt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, denken Sie daran, dass Cooldowns für Rate Limits an
eine Modell-ID statt an das gesamte Provider-Profil gebunden sein können.

## Fehlerbehebung

### „Keine Anmeldedaten gefunden“

Wenn das Anthropic-Profil fehlt, konfigurieren Sie auf dem **Gateway-Host** einen
Anthropic-API-Schlüssel oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab / ist abgelaufen

Führen Sie `openclaw models status` aus, um zu prüfen, welches Profil bald abläuft. Wenn ein
Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie dieses Setup über
Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandt

- [Secrets management](/de/gateway/secrets)
- [Remote access](/de/gateway/remote)
- [Auth storage](/de/concepts/oauth)
