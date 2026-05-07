---
read_when:
    - Fehlerbehebung bei Modell-Authentifizierung oder OAuth-Ablauf
    - Authentifizierung oder Speicherung von Zugangsdaten dokumentieren
summary: 'Modellauthentifizierung: OAuth, API-Schlüssel, Wiederverwendung der Claude CLI und Anthropic setup-token'
title: Authentifizierung
x-i18n:
    generated_at: "2026-05-07T13:16:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95ac66b4771ee4058f81294b54b345d9bf688da9d985e45e056547c9d395d37
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Diese Seite ist die Authentifizierungsreferenz für **Modell-Provider** (API-Schlüssel, OAuth, Wiederverwendung der Claude CLI und Anthropic-Setup-Token). Für die Authentifizierung von **Gateway-Verbindungen** (Token, Passwort, Trusted Proxy) siehe [Konfiguration](/de/gateway/configuration) und [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth).
</Note>

OpenClaw unterstützt OAuth und API-Schlüssel für Modell-Provider. Für dauerhaft laufende Gateway-
Hosts sind API-Schlüssel in der Regel die berechenbarste Option. Abonnement-/OAuth-
Abläufe werden ebenfalls unterstützt, wenn sie zum Kontomodell Ihres Providers passen.

Siehe [/concepts/oauth](/de/concepts/oauth) für den vollständigen OAuth-Ablauf und das Speicher-
Layout.
Für SecretRef-basierte Authentifizierung (`env`/`file`/`exec`-Provider) siehe [Secrets-Verwaltung](/de/gateway/secrets).
Für Regeln zur Eignung von Anmeldedaten und Reason-Codes, die von `models status --probe` verwendet werden, siehe
[Semantik von Auth-Anmeldedaten](/de/auth-credential-semantics).

## Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)

Wenn Sie einen langlebigen Gateway betreiben, beginnen Sie mit einem API-Schlüssel für Ihren ausgewählten
Provider.
Speziell für Anthropic ist die Authentifizierung per API-Schlüssel weiterhin die berechenbarste Server-
Einrichtung, aber OpenClaw unterstützt auch die Wiederverwendung einer lokalen Claude CLI-Anmeldung.

1. Erstellen Sie einen API-Schlüssel in Ihrer Provider-Konsole.
2. Legen Sie ihn auf dem **Gateway-Host** ab (dem Rechner, auf dem `openclaw gateway` ausgeführt wird).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Wenn der Gateway unter systemd/launchd läuft, sollten Sie den Schlüssel vorzugsweise in
   `~/.openclaw/.env` ablegen, damit der Daemon ihn lesen kann:

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

Wenn Sie Umgebungsvariablen lieber nicht selbst verwalten möchten, kann das Onboarding
API-Schlüssel für die Daemon-Nutzung speichern: `openclaw onboard`.

Siehe [Hilfe](/de/help) für Details zur Vererbung von Umgebungsvariablen (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI und Token-Kompatibilität

Anthropic-Setup-Token-Authentifizierung ist in OpenClaw weiterhin als unterstützter Token-
Pfad verfügbar. Anthropic-Mitarbeiter haben uns seitdem mitgeteilt, dass die OpenClaw-artige Claude CLI-Nutzung
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als
für diese Integration genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht. Wenn
die Wiederverwendung der Claude CLI auf dem Host verfügbar ist, ist dies jetzt der bevorzugte Pfad.

Für langlebige Gateway-Hosts ist ein Anthropic-API-Schlüssel weiterhin die berechenbarste
Einrichtung. Wenn Sie eine vorhandene Claude-Anmeldung auf demselben Host wiederverwenden möchten, nutzen Sie den
Anthropic-Claude-CLI-Pfad im Onboarding/in der Konfiguration.

Empfohlene Host-Einrichtung für die Wiederverwendung der Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Dies ist eine zweistufige Einrichtung:

1. Melden Sie Claude Code selbst auf dem Gateway-Host bei Anthropic an.
2. Weisen Sie OpenClaw an, die Anthropic-Modellauswahl auf das lokale `claude-cli`-
   Backend umzustellen und das passende OpenClaw-Authentifizierungsprofil zu speichern.

Wenn `claude` nicht in `PATH` ist, installieren Sie entweder zuerst Claude Code oder setzen Sie
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

OpenClaw erwartet zur Laufzeit die kanonische `version`- und `profiles`-Form. Wenn eine ältere Installation noch eine flache Datei wie `{ "openrouter": { "apiKey": "..." } }` enthält, führen Sie `openclaw doctor --fix` aus, um sie als `openrouter:default`-API-Schlüsselprofil neu zu schreiben; doctor legt neben dem Original eine `.legacy-flat.*.bak`-Kopie ab. Endpoint-Details wie `baseUrl`, `api`, Modell-IDs, Header und Timeouts gehören unter `models.providers.<id>` in `openclaw.json` oder `models.json`, nicht in `auth-profiles.json`.

Externe Authentifizierungsrouten wie Bedrock `auth: "aws-sdk"` sind ebenfalls keine Anmeldedaten. Wenn Sie eine benannte Bedrock-Route möchten, setzen Sie `auth.profiles.<id>.mode: "aws-sdk"` in `openclaw.json`; schreiben Sie nicht `type: "aws-sdk"` in `auth-profiles.json`. `openclaw doctor --fix` verschiebt ältere AWS-SDK-Markierungen aus dem Anmeldedatenspeicher in Konfigurationsmetadaten.

Auth-Profil-Referenzen werden auch für statische Anmeldedaten unterstützt:

- `api_key`-Anmeldedaten können `keyRef: { source, provider, id }` verwenden
- `token`-Anmeldedaten können `tokenRef: { source, provider, id }` verwenden
- Profile im OAuth-Modus unterstützen keine SecretRef-Anmeldedaten; wenn `auth.profiles.<id>.mode` auf `"oauth"` gesetzt ist, wird SecretRef-gestützte `keyRef`/`tokenRef`-Eingabe für dieses Profil abgelehnt.

Automatisierungsfreundliche Prüfung (Exit `1` bei abgelaufen/fehlend, `2` bei bald ablaufend):

```bash
openclaw models status --check
```

Live-Auth-Prüfungen:

```bash
openclaw models status --probe
```

Hinweise:

- Probe-Zeilen können aus Auth-Profilen, Umgebungs-Anmeldedaten oder `models.json` stammen.
- Wenn explizites `auth.order.<provider>` ein gespeichertes Profil auslässt, meldet probe
  `excluded_by_auth_order` für dieses Profil, anstatt es zu versuchen.
- Wenn Authentifizierung vorhanden ist, OpenClaw aber keinen prüfbaren Modellkandidaten für
  diesen Provider auflösen kann, meldet probe `status: no_model`.
- Rate-Limit-Cooldowns können modellspezifisch sein. Ein Profil, das für ein
  Modell abkühlt, kann weiterhin für ein Schwestermodell beim selben Provider nutzbar sein.

Optionale Betriebsskripte (systemd/Termux) sind hier dokumentiert:
[Auth-Überwachungsskripte](/de/help/scripts#auth-monitoring-scripts)

## Anthropic-Hinweis

Das Anthropic-`claude-cli`-Backend wird wieder unterstützt.

- Anthropic-Mitarbeiter haben uns mitgeteilt, dass dieser OpenClaw-Integrationspfad wieder erlaubt ist.
- OpenClaw behandelt daher die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` als genehmigt
  für Anthropic-gestützte Läufe, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-API-Schlüssel bleiben die berechenbarste Wahl für langlebige Gateway-
  Hosts und explizite serverseitige Abrechnungskontrolle.

## Modell-Auth-Status prüfen

```bash
openclaw models status
openclaw doctor
```

## Rotationsverhalten von API-Schlüsseln (Gateway)

Einige Provider unterstützen das erneute Versuchen einer Anfrage mit alternativen Schlüsseln, wenn ein API-Aufruf
ein Provider-Rate-Limit erreicht.

- Prioritätsreihenfolge:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Überschreibung)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google-Provider beziehen außerdem `GOOGLE_API_KEY` als zusätzlichen Fallback ein.
- Dieselbe Schlüsselliste wird vor der Verwendung dedupliziert.
- OpenClaw versucht es nur bei Rate-Limit-Fehlern mit dem nächsten Schlüssel erneut (zum Beispiel
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` oder
  `workers_ai ... quota limit exceeded`).
- Fehler, die keine Rate-Limit-Fehler sind, werden nicht mit alternativen Schlüsseln erneut versucht.
- Wenn alle Schlüssel fehlschlagen, wird der endgültige Fehler aus dem letzten Versuch zurückgegeben.

## Steuern, welche Anmeldedaten verwendet werden

### Pro Sitzung (Chat-Befehl)

Verwenden Sie `/model <alias-or-id>@<profileId>`, um bestimmte Provider-Anmeldedaten für die aktuelle Sitzung festzulegen (Beispiel-Profil-IDs: `anthropic:default`, `anthropic:work`).

Verwenden Sie `/model` (oder `/model list`) für eine kompakte Auswahl; verwenden Sie `/model status` für die vollständige Ansicht (Kandidaten und nächstes Auth-Profil, plus Provider-Endpoint-Details, wenn konfiguriert).

### Pro Agent (CLI-Überschreibung)

Setzen Sie eine explizite Überschreibung der Auth-Profil-Reihenfolge für einen Agent (gespeichert in der `auth-state.json` dieses Agents):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Verwenden Sie `--agent <id>`, um einen bestimmten Agent anzusprechen; lassen Sie es weg, um den konfigurierten Standard-Agent zu verwenden.
Wenn Sie Reihenfolgeprobleme debuggen, zeigt `openclaw models status --probe` ausgelassene
gespeicherte Profile als `excluded_by_auth_order` an, anstatt sie stillschweigend zu überspringen.
Wenn Sie Cooldown-Probleme debuggen, beachten Sie, dass Rate-Limit-Cooldowns an
eine Modell-ID statt an das gesamte Provider-Profil gebunden sein können.

## Fehlerbehebung

### „Keine Anmeldedaten gefunden“

Wenn das Anthropic-Profil fehlt, konfigurieren Sie einen Anthropic-API-Schlüssel auf dem
**Gateway-Host** oder richten Sie den Anthropic-Setup-Token-Pfad ein und prüfen Sie dann erneut:

```bash
openclaw models status
```

### Token läuft bald ab/ist abgelaufen

Führen Sie `openclaw models status` aus, um zu bestätigen, welches Profil abläuft. Wenn ein
Anthropic-Token-Profil fehlt oder abgelaufen ist, aktualisieren Sie diese Einrichtung über
setup-token oder migrieren Sie zu einem Anthropic-API-Schlüssel.

## Verwandt

- [Secrets-Verwaltung](/de/gateway/secrets)
- [Remote-Zugriff](/de/gateway/remote)
- [Auth-Speicher](/de/concepts/oauth)
