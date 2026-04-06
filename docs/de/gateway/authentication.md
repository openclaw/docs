---
read_when:
    - Debuggen von Modellauthentifizierung oder OAuth-Ablauf
    - Dokumentieren von Authentifizierung oder Speicherung von Anmeldedaten
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel und veraltetes Anthropic-Setup-Token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-04-06T03:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f59ede3fcd7e692ad4132287782a850526acf35474b5bfcea29e0e23610636c2
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentifizierung (Modellanbieter)

<Note>
Diese Seite behandelt die Authentifizierung von **Modellanbietern** (API-Schlüssel, OAuth und das veraltete Anthropic-Setup-Token). Für die Authentifizierung der **Gateway-Verbindung** (Token, Passwort, trusted-proxy) siehe [Configuration](/de/gateway/configuration) und [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modellanbieter. Für dauerhaft laufende Gateway-
Hosts sind API-Schlüssel in der Regel die berechenbarste Option. Abonnement-/OAuth-
Abläufe werden ebenfalls unterstützt, wenn sie zu Ihrem Anbieterkontomodell passen.

Siehe [/concepts/oauth](/de/concepts/oauth) für den vollständigen OAuth-Ablauf und das Speicher-
Layout.
Für SecretRef-basierte Authentifizierung (`env`/`file`/`exec`-Anbieter) siehe [Secrets Management](/de/gateway/secrets).
Für Regeln zu Berechtigung von Anmeldedaten/Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Auth Credential Semantics](/de/auth-credential-semantics).

## Empfohlenes Setup (API-Schlüssel, beliebiger Anbieter)

Wenn Sie ein langlebiges Gateway ausführen, beginnen Sie mit einem API-Schlüssel für Ihren gewählten
Anbieter.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel der sichere Weg. Die Anthropic-
Authentifizierung im Abonnementstil innerhalb von OpenClaw ist der veraltete Setup-Token-Pfad und
sollte als Pfad für **Extra Usage** behandelt werden, nicht als Pfad für Tariflimits.

1. Erstellen Sie einen API-Schlüssel in der Konsole Ihres Anbieters.
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

Wenn Sie Umgebungsvariablen nicht selbst verwalten möchten, kann das Onboarding
API-Schlüssel für die Nutzung durch den Daemon speichern: `openclaw onboard`.

Siehe [Help](/de/help) für Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Kompatibilität mit veralteten Tokens

Die Authentifizierung mit Anthropic-Setup-Token ist in OpenClaw weiterhin als
veralteter/manueller Pfad verfügbar. Die öffentlichen Claude-Code-Dokumente von Anthropic behandeln weiterhin die direkte
Nutzung von Claude Code im Terminal unter Claude-Tarifen, aber Anthropic teilte OpenClaw-Benutzern separat mit, dass der **OpenClaw**-Claude-Login-Pfad als Nutzung durch ein Drittanbieter-Harness zählt und **Extra Usage** erfordert, die separat vom
Abonnement abgerechnet wird.

Für den klarsten Setup-Pfad verwenden Sie einen Anthropic-API-Schlüssel. Wenn Sie einen
Anthropic-Pfad im Abonnementstil in OpenClaw beibehalten müssen, verwenden Sie den veralteten Setup-Token-Pfad
mit der Erwartung, dass Anthropic ihn als **Extra Usage** behandelt.

Manuelle Tokeneingabe (beliebiger Anbieter; schreibt `auth-profiles.json` + aktualisiert die Konfiguration):

```bash
openclaw models auth paste-token --provider openrouter
```

Referenzen auf Auth-Profile werden auch für statische Anmeldedaten unterstützt:

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden
- OAuth-Modus-Profile unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Für Automatisierung geeignete Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Sonden:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, `env`-Anmeldedaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet die Probe
  für dieses Profil `excluded_by_auth_order`, statt es zu versuchen.
- Wenn Authentifizierung vorhanden ist, OpenClaw aber kein sondierbares Modellkandidaten für
  diesen Anbieter auflösen kann, meldet die Probe `status: no_model`.
- Rate-Limit-Abkühlzeiten können modellspezifisch sein. Ein Profil, das für ein Modell
  abkühlt, kann für ein verwandtes Modell beim selben Anbieter weiterhin nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth monitoring scripts](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-Backend `claude-cli` wurde entfernt.

- Verwenden Sie Anthropic-API-Schlüssel für Anthropic-Datenverkehr in OpenClaw.
- Das Anthropic-Setup-Token bleibt ein veralteter/manueller Pfad und sollte mit
  der Erwartung der Abrechnung als Extra Usage verwendet werden, die Anthropic den OpenClaw-Benutzern mitgeteilt hat.
- `openclaw doctor` erkennt jetzt veralteten entfernten Anthropic-Claude-CLI-Status. Wenn
  gespeicherte Bytewerte für Anmeldedaten noch vorhanden sind, konvertiert doctor sie zurück in
  Anthropic-Token-/OAuth-Profile. Falls nicht, entfernt doctor die veraltete Claude-CLI-
  Konfiguration und verweist Sie auf API-Schlüssel oder die Wiederherstellung per Setup-Token.

## Status der Modellauthentifizierung prüfen

```bash
openclaw models status
openclaw doctor
```

## Verhalten bei Rotation von API-Schlüsseln (Gateway)

Einige Anbieter unterstützen das erneute Versuchen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
an ein Rate-Limit des Anbieters stößt.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Anbieter schließen zusätzlich `GOOGLE_API_KEY` als weiteren Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es mit dem nächsten Schlüssel nur bei Rate-Limit-Fehlern erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler des letzten Versuchs zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Anbieter-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel für Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten + nächstes Auth-Profil sowie Anbieter-Endpunktdetails, wenn konfiguriert).

### Pro Agent (CLI-Überschreibung)

Legen Sie eine explizite Überschreibung der Reihenfolge von Auth-Profilen für einen Agenten fest (gespeichert in der `auth-profiles.json` dieses Agenten):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agenten anzusprechen; lassen Sie es weg, um den konfigurierten Standardagenten zu verwenden.
Wenn Sie Probleme mit der Reihenfolge debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order`, statt sie stillschweigend zu überspringen.
Wenn Sie Probleme mit Abkühlzeiten debuggen, denken Sie daran, dass Rate-Limit-Abkühlzeiten an
eine Modell-ID statt an das gesamte Anbieterprofil gebunden sein können.

## Fehlerbehebung

### "No credentials found"

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem
**Gateway-Host** oder richten Sie den veralteten Anthropic-Setup-Token-Pfad ein, und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil bald abläuft. Wenn ein veraltetes
Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie dieses Setup per
Setup-Token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

Wenn der Rechner noch veralteten entfernten Anthropic-Claude-CLI-Status aus älteren
Builds enthält, führen Sie Folgendes aus:

```bash
openclaw doctor --yes
```

Doctor konvertiert `anthropic:claude-cli` zurück in Anthropic-Token/OAuth, wenn die
gespeicherten Bytewerte der Anmeldedaten noch vorhanden sind. Andernfalls entfernt er das veraltete Claude-CLI-
Profil/die Konfiguration/die Modellreferenzen und hinterlässt Hinweise zu den nächsten Schritten.
