---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Arbeitsbereich, Authentifizierung, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Einrichten
x-i18n:
    generated_at: "2026-07-04T20:28:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Vollständig geführtes Onboarding für die lokale oder entfernte Gateway-Einrichtung. Verwenden Sie dies, wenn OpenClaw Modell-Authentifizierung, Arbeitsbereich, Gateway, Kanäle, Skills und Integrität in einem Ablauf durchgehen soll.

## Zugehörige Leitfäden

<CardGroup cols={2}>
  <Card title="CLI-Onboarding-Zentrale" href="/de/start/wizard" icon="rocket">
    Schrittweise Anleitung für den interaktiven CLI-Ablauf.
  </Card>
  <Card title="Onboarding-Überblick" href="/de/start/onboarding-overview" icon="map">
    Wie das OpenClaw-Onboarding zusammenhängt.
  </Card>
  <Card title="CLI-Einrichtungsreferenz" href="/de/start/wizard-cli-reference" icon="book">
    Ausgaben, Interna und Verhalten pro Schritt.
  </Card>
  <Card title="CLI-Automatisierung" href="/de/start/wizard-cli-automation" icon="terminal">
    Nicht-interaktive Flags und skriptbasierte Einrichtungen.
  </Card>
  <Card title="macOS-App-Onboarding" href="/de/start/onboarding" icon="apple">
    Onboarding-Ablauf für die macOS-Menüleisten-App.
  </Card>
</CardGroup>

## Beispiele

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` verwendet Plugin-eigene Migrations-Provider wie Hermes. Es läuft nur gegen eine frische OpenClaw-Einrichtung; wenn vorhandene Konfigurationen, Anmeldedaten, Sitzungen oder Dateien für Arbeitsbereichsspeicher/Identität vorhanden sind, setzen Sie vor dem Import zurück oder wählen Sie eine frische Einrichtung.

`--modern` startet die Vorschau des dialogbasierten Crestodian-Onboardings. Ohne
`--modern` behält `openclaw onboard` den klassischen Onboarding-Ablauf bei.

In einem interaktiven Terminal leitet bloßes `openclaw` (ohne Unterbefehl) nach
Konfigurationszustand weiter:

- Wenn die aktive Konfigurationsdatei fehlt oder keine verfassten Einstellungen enthält (leer oder
  nur Metadaten), startet dieser klassische Onboarding-Ablauf.
- Wenn die Konfigurationsdatei existiert, aber die Validierung fehlschlägt, startet
  [Crestodian](/de/cli/crestodian) zur Reparatur.
- Wenn die Konfigurationsdatei gültig ist, öffnet es die normale Agent-TUI, entweder lokal
  oder verbunden mit einem erreichbaren konfigurierten Gateway. In einer konfigurierten Installation
  erreichen Sie Crestodian mit `/crestodian` innerhalb der TUI oder `openclaw crestodian`.

Klartext-`ws://` wird für loopback, private IP-Literale, `.local` und
Tailnet-`*.ts.net`-Gateway-URLs akzeptiert. Für andere vertrauenswürdige private DNS-Namen setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.

## Gebietsschema

Interaktives Onboarding verwendet das CLI-Assistenten-Gebietsschema für feste Einrichtungstexte. Die Auflösungsreihenfolge ist:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Englische Fallback-Sprache

Unterstützte Assistenten-Gebietsschemas sind `en`, `zh-CN` und `zh-TW`. Gebietsschemawerte können
Unterstrich- oder POSIX-Suffixformen wie `zh_CN.UTF-8` verwenden. Produktnamen, Befehlsnamen,
Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Kanalbezeichnungen
bleiben wörtlich.

Beispiel:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Nicht-interaktiver benutzerdefinierter Provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` ist im nicht-interaktiven Modus optional. Wenn es ausgelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.
OpenClaw kennzeichnet gängige Vision-Modell-IDs automatisch als bildfähig. Übergeben Sie `--custom-image-input` für unbekannte benutzerdefinierte Vision-IDs oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.
Verwenden Sie `--custom-compatibility openai-responses` für OpenAI-kompatible Endpunkte, die `/v1/responses`, aber nicht `/v1/chat/completions` unterstützen.

LM Studio unterstützt im nicht-interaktiven Modus außerdem ein Provider-spezifisches Schlüssel-Flag:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nicht-interaktives Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` ist standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es ausgelassen wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Speichern Sie Provider-Schlüssel als Refs statt als Klartext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding umgebungsbasierte Refs statt Klartext-Schlüsselwerte.
Für Provider mit Auth-Profil schreibt dies `keyRef`-Einträge; für benutzerdefinierte Provider schreibt dies `models.providers.<id>.apiKey` als Umgebungs-Ref (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht-interaktiven `ref`-Modus:

- Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese Umgebungsvariable ist ebenfalls gesetzt.
- Wenn ein Inline-Schlüssel-Flag ohne die erforderliche Umgebungsvariable übergeben wird, schlägt das Onboarding schnell mit Hinweisen fehl.

Gateway-Token-Optionen im nicht-interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als Umgebungs-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon` werden bei Token-Authentifizierung, die ein Token erfordert, von SecretRef verwaltete Gateway-Token validiert, aber nicht als aufgelöster Klartext in Umgebungsmetadaten des Supervisor-Dienstes persistiert.
- Mit `--install-daemon` schlägt das Onboarding geschlossen mit Abhilfehinweisen fehl, wenn der Token-Modus ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, bis der Modus explizit gesetzt ist, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie dies als Konfigurationsbeschädigung oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- Lokales Onboarding installiert ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert.
- Entferntes Onboarding schreibt nur Verbindungsinformationen für das entfernte Gateway und installiert keine lokalen Plugin-Pakete.
- `--allow-unconfigured` ist eine separate Gateway-Runtime-Notausnahme. Es bedeutet nicht, dass das Onboarding `gateway.mode` auslassen darf.

Beispiel:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Nicht-interaktive lokale Gateway-Integrität:

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne dieses Flag muss bereits ein lokales Gateway laufen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Arbeitsbereichs-/Bootstrap-Schreibvorgänge möchten, verwenden Sie `--skip-health`.
- Wenn Sie Arbeitsbereichsdateien selbst verwalten, übergeben Sie `--skip-bootstrap`, um `agents.defaults.skipBootstrap: true` zu setzen und das Erstellen von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md` zu überspringen.
- Unter nativem Windows versucht `--install-daemon` zuerst Geplante Aufgaben und fällt auf ein benutzerbezogenes Login-Element im Autostart-Ordner zurück, wenn die Aufgabenerstellung verweigert wird.

Interaktives Onboarding-Verhalten mit Referenzmodus:

- Wählen Sie bei Aufforderung **Geheimnisreferenz verwenden**.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Secret-Provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Ref eine schnelle Preflight-Validierung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie erneut versuchen.

### Nicht-interaktive Z.AI-Endpunktauswahl

<Note>
`--auth-choice zai-api-key` erkennt automatisch den besten Z.AI-Endpunkt und das beste Modell für
Ihren Schlüssel. Coding-Plan-Endpunkte bevorzugen `zai/glm-5.2`; allgemeine API-Endpunkte verwenden
`zai/glm-5.1`. Um einen Coding-Plan-Endpunkt zu erzwingen, wählen Sie `zai-coding-global` oder
`zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Nicht-interaktives Mistral-Beispiel:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Zusätzliche nicht-interaktive Flags

Tokenbasierte Modell-Authentifizierung (nicht-interaktiv; verwendet mit `--auth-choice token`):

- `--token-provider <id>` — Token-Provider-ID. Identifiziert, welcher Provider das Token ausstellt.
- `--token <token>` — Token-Wert für die Modell-Authentifizierung.
- `--token-profile-id <id>` — Auth-Profil-ID. Generische Token-Speicherung ist standardmäßig `<provider>:manual`; Provider-eigene Einrichtungsabläufe können ihren eigenen Standard verwenden, etwa `anthropic:default`.
- `--token-expires-in <duration>` — Optionale Token-Ablaufdauer (z. B. `365d`, `12h`).

Cloudflare AI Gateway (nicht-interaktiv):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare-Konto-ID für Routing über Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway-ID.

Daemon-Installationssteuerung:

- `--no-install-daemon` — Gateway-Dienstinstallation explizit überspringen.
- `--skip-daemon` — Alias für `--no-install-daemon`.

UI- und Hook-Einrichtungssteuerung:

- `--skip-ui` — Control UI-/TUI-Eingabeaufforderungen während des Onboardings überspringen.
- `--skip-hooks` — Webhook-/Hook-Eingabeaufforderungen während des Onboardings überspringen.

Ausgabeunterdrückung:

- `--suppress-gateway-token-output` — Tokenhaltige Gateway-/UI-Ausgabe unterdrücken (Token-Hinweise, Auto-Login-URL mit eingebettetem Token und automatischer Start der Control UI). Nützlich in gemeinsam genutzten Terminal- und CI-Umgebungen.

## Hinweise zum Ablauf

<AccordionGroup>
  <Accordion title="Ablauftypen">
    - `quickstart`: minimale Eingabeaufforderungen, erzeugt automatisch ein Gateway-Token.
    - `manual`: vollständige Eingabeaufforderungen für Port, Bind-Adresse und Authentifizierung (Alias von `advanced`).
    - `import`: führt einen erkannten Migrations-Provider aus, zeigt eine Vorschau des Plans und wendet ihn dann nach Bestätigung an.

  </Accordion>
  <Accordion title="Provider-Vorfilterung">
    Wenn eine Authentifizierungsauswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Auswahlen für Standardmodell und Zulassungsliste auf diesen Provider vor. Für Volcengine und BytePlus entspricht dies auch den Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Wenn der bevorzugte Provider-Filter noch keine geladenen Modelle ergibt, fällt das Onboarding auf den ungefilterten Katalog zurück, statt die Auswahl leer zu lassen.

  </Accordion>
  <Accordion title="Websuche-Folgefragen">
    Einige Websuche-Provider lösen Provider-spezifische Folgeeingabeaufforderungen aus:

    - **Grok** kann eine optionale `x_search`-Einrichtung mit demselben xAI-OAuth-Profil oder API-Schlüssel und einer `x_search`-Modellauswahl anbieten.
    - **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs. `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuche-Modell fragen.

  </Accordion>
  <Accordion title="Weitere Verhaltensweisen">
    - Verhalten des DM-Bereichs beim lokalen Onboarding: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals).
    - Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
    - Benutzerdefinierter Provider: Verbinden Sie einen beliebigen OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich gehosteter Provider, die nicht aufgeführt sind. Verwenden Sie Unknown zur automatischen Erkennung.
    - Wenn Hermes-Zustand erkannt wird, bietet das Onboarding einen Migrationsablauf an. Verwenden Sie [Migrate](/de/cli/migrate) für Dry-Run-Pläne, Überschreibmodus, Berichte und genaue Zuordnungen.

  </Accordion>
</AccordionGroup>

## Häufige Folge-Befehle

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Verwenden Sie `openclaw setup` als denselben geführten Einstiegspunkt für das Onboarding. Verwenden Sie `openclaw setup --baseline`, wenn Sie nur die Baseline-Konfiguration/den Workspace benötigen, später `openclaw configure` für gezielte Änderungen und `openclaw channels add` für die reine Channel-Einrichtung.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
