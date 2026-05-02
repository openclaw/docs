---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Arbeitsbereich, Authentifizierung, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Einrichten
x-i18n:
    generated_at: "2026-05-02T06:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Interaktives Onboarding für die lokale oder Remote-Gateway-Einrichtung.

## Verwandte Leitfäden

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/de/start/wizard" icon="rocket">
    Schritt-für-Schritt-Anleitung für den interaktiven CLI-Ablauf.
  </Card>
  <Card title="Onboarding overview" href="/de/start/onboarding-overview" icon="map">
    Wie das OpenClaw-Onboarding zusammenspielt.
  </Card>
  <Card title="CLI setup reference" href="/de/start/wizard-cli-reference" icon="book">
    Ausgaben, Interna und Verhalten pro Schritt.
  </Card>
  <Card title="CLI automation" href="/de/start/wizard-cli-automation" icon="terminal">
    Nicht interaktive Flags und skriptbasierte Einrichtungen.
  </Card>
  <Card title="macOS app onboarding" href="/de/start/onboarding" icon="apple">
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

`--flow import` verwendet Plugin-eigene Migrations-Provider wie Hermes. Es wird nur für eine frische OpenClaw-Einrichtung ausgeführt; wenn vorhandene Konfigurationen, Anmeldedaten, Sitzungen oder Dateien für Workspace-Speicher/Identität vorhanden sind, setzen Sie vor dem Import zurück oder wählen Sie eine frische Einrichtung.

`--modern` startet die Vorschau des dialogorientierten Crestodian-Onboardings. Ohne
`--modern` behält `openclaw onboard` den klassischen Onboarding-Ablauf bei.

Für Klartext-`ws://`-Ziele in privaten Netzwerken (nur vertrauenswürdige Netzwerke) setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.
Es gibt kein `openclaw.json`-Äquivalent für diese clientseitige Transport-
Notfallfreigabe.

Nicht interaktiver benutzerdefinierter Provider:

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

`--custom-api-key` ist im nicht interaktiven Modus optional. Wenn es ausgelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.
OpenClaw markiert gängige Vision-Modell-IDs automatisch als bildfähig. Übergeben Sie `--custom-image-input` für unbekannte benutzerdefinierte Vision-IDs oder `--custom-text-input`, um reine Textmetadaten zu erzwingen.

LM Studio unterstützt im nicht interaktiven Modus außerdem ein Provider-spezifisches Schlüssel-Flag:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Nicht interaktives Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` ist standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es ausgelassen wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Speichern Sie Provider-Schlüssel als Referenzen statt als Klartext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding umgebungsbasierte Referenzen statt Klartext-Schlüsselwerte.
Für auth-profile-gestützte Provider schreibt dies `keyRef`-Einträge; für benutzerdefinierte Provider schreibt dies `models.providers.<id>.apiKey` als Umgebungsreferenz (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht interaktiven `ref`-Modus:

- Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese Umgebungsvariable ist ebenfalls gesetzt.
- Wenn ein Inline-Schlüssel-Flag ohne die erforderliche Umgebungsvariable übergeben wird, schlägt das Onboarding schnell fehl und gibt Hinweise.

Gateway-Token-Optionen im nicht interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als Umgebungs-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon` werden SecretRef-verwaltete Gateway-Token validiert, aber nicht als aufgelöster Klartext in Umgebungsmetadaten des Supervisor-Dienstes persistiert, wenn Token-Authentifizierung ein Token erfordert.
- Mit `--install-daemon` schlägt das Onboarding geschlossen fehl und gibt Hinweise zur Behebung, wenn der Token-Modus ein Token erfordert und die konfigurierte Token-SecretRef nicht auflösbar ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, bis der Modus explizit gesetzt ist, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie dies als Konfigurationsschaden oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- Lokales Onboarding installiert ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert.
- Remote-Onboarding schreibt nur Verbindungsinformationen für das Remote-Gateway und installiert keine lokalen Plugin-Pakete.
- `--allow-unconfigured` ist eine separate Gateway-Runtime-Notfalloption. Sie bedeutet nicht, dass das Onboarding `gateway.mode` auslassen darf.

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

Nicht interaktive Integritätsprüfung des lokalen Gateways:

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne dieses Flag müssen Sie bereits ein lokales Gateway ausführen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Workspace-/Bootstrap-Schreibvorgänge benötigen, verwenden Sie `--skip-health`.
- Wenn Sie Workspace-Dateien selbst verwalten, übergeben Sie `--skip-bootstrap`, um `agents.defaults.skipBootstrap: true` zu setzen und das Erstellen von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md` zu überspringen.
- Unter nativem Windows versucht `--install-daemon` zuerst Scheduled Tasks und fällt auf ein Login-Element im Startup-Ordner des Benutzers zurück, wenn die Aufgabenerstellung verweigert wird.

Interaktives Onboarding-Verhalten im Referenzmodus:

- Wählen Sie **Use secret reference**, wenn Sie dazu aufgefordert werden.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Secret-Provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Preflight-Validierung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

### Nicht interaktive Z.AI-Endpunktauswahl

<Note>
`--auth-choice zai-api-key` erkennt automatisch den besten Z.AI-Endpunkt für Ihren Schlüssel (bevorzugt die allgemeine API mit `zai/glm-5.1`). Wenn Sie speziell die Endpunkte des GLM Coding Plan verwenden möchten, wählen Sie `zai-coding-global` oder `zai-coding-cn`.
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

Nicht interaktives Mistral-Beispiel:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Hinweise zum Ablauf

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimale Eingabeaufforderungen, generiert automatisch ein Gateway-Token.
    - `manual`: vollständige Eingabeaufforderungen für Port, Bind und Authentifizierung (Alias von `advanced`).
    - `import`: führt einen erkannten Migrations-Provider aus, zeigt eine Vorschau des Plans an und wendet ihn nach Bestätigung an.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Wenn eine Authentifizierungsauswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Standardmodell- und Allowlist-Auswahlfelder vorab auf diesen Provider. Für Volcengine und BytePlus entspricht dies auch den Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`).

    Wenn der bevorzugte Provider-Filter noch keine geladenen Modelle liefert, fällt das Onboarding auf den ungefilterten Katalog zurück, statt das Auswahlfeld leer zu lassen.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Einige Websuche-Provider lösen Provider-spezifische Folgeabfragen aus:

    - **Grok** kann eine optionale `x_search`-Einrichtung mit demselben `XAI_API_KEY` und einer `x_search`-Modellauswahl anbieten.
    - **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs. `api.moonshot.cn`) und dem Standardmodell für die Kimi-Websuche fragen.

  </Accordion>
  <Accordion title="Other behaviors">
    - DM-Bereichsverhalten beim lokalen Onboarding: [CLI setup reference](/de/start/wizard-cli-reference#outputs-and-internals).
    - Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
    - Benutzerdefinierter Provider: Verbinden Sie jeden OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich nicht aufgeführter gehosteter Provider. Verwenden Sie Unknown zur automatischen Erkennung.
    - Wenn der Hermes-Status erkannt wird, bietet das Onboarding einen Migrationsablauf an. Verwenden Sie [Migrate](/de/cli/migrate) für Dry-Run-Pläne, Überschreibmodus, Berichte und exakte Zuordnungen.

  </Accordion>
</AccordionGroup>

## Häufige Folgekommandos

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
