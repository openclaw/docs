---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Arbeitsbereich, Authentifizierung, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Einrichten
x-i18n:
    generated_at: "2026-06-30T22:10:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Vollständig geführtes Onboarding für die lokale oder Remote-Einrichtung des Gateway. Verwenden Sie dies, wenn OpenClaw Modellauthentifizierung, Workspace, Gateway, Kanäle, Skills und Integritätsprüfung in einem Ablauf durchgehen soll.

## Zugehörige Anleitungen

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/de/start/wizard" icon="rocket">
    Schrittweise Anleitung des interaktiven CLI-Ablaufs.
  </Card>
  <Card title="Onboarding overview" href="/de/start/onboarding-overview" icon="map">
    Wie das OpenClaw-Onboarding zusammenpasst.
  </Card>
  <Card title="CLI setup reference" href="/de/start/wizard-cli-reference" icon="book">
    Ausgaben, Interna und Verhalten pro Schritt.
  </Card>
  <Card title="CLI automation" href="/de/start/wizard-cli-automation" icon="terminal">
    Nicht interaktive Flags und skriptgesteuerte Einrichtungen.
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

`--flow import` verwendet Plugin-eigene Migrations-Provider wie Hermes. Es läuft nur gegen eine frische OpenClaw-Einrichtung; wenn vorhandene Konfiguration, Anmeldedaten, Sitzungen oder Workspace-Speicher-/Identitätsdateien vorhanden sind, setzen Sie sie zurück oder wählen Sie vor dem Importieren eine frische Einrichtung.

`--modern` startet die Vorschau des dialogbasierten Crestodian-Onboardings. Ohne
`--modern` behält `openclaw onboard` den klassischen Onboarding-Ablauf bei.

Bei einer frischen Installation, bei der die aktive Konfigurationsdatei fehlt oder keine verfassten
Einstellungen enthält (leer oder nur Metadaten), startet auch ein schlichtes `openclaw` den klassischen
Onboarding-Ablauf. Sobald eine Konfigurationsdatei verfasste Einstellungen enthält, öffnet ein schlichtes `openclaw`
stattdessen Crestodian.

Klartext-`ws://` wird für local loopback, private IP-Literale, `.local` und
Tailnet-`*.ts.net`-Gateway-URLs akzeptiert. Für andere vertrauenswürdige private DNS-Namen setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.

## Gebietsschema

Das interaktive Onboarding verwendet das CLI-Assistenten-Gebietsschema für feste Einrichtungstexte. Die Auflösungsreihenfolge
lautet:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Englische Fallback-Sprache

Unterstützte Assistenten-Gebietsschemata sind `en`, `zh-CN` und `zh-TW`. Gebietsschemawerte können
Unterstrich- oder POSIX-Suffixformen wie `zh_CN.UTF-8` verwenden. Produktnamen, Befehlsnamen,
Konfigurationsschlüssel, URLs, Provider-IDs, Modell-IDs und Plugin-/Kanalbezeichnungen
bleiben unverändert.

Beispiel:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` ist im nicht interaktiven Modus optional. Wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.
OpenClaw markiert gängige Vision-Modell-IDs automatisch als bildfähig. Übergeben Sie `--custom-image-input` für unbekannte benutzerdefinierte Vision-IDs oder `--custom-text-input`, um Nur-Text-Metadaten zu erzwingen.
Verwenden Sie `--custom-compatibility openai-responses` für OpenAI-kompatible Endpunkte, die `/v1/responses`, aber nicht `/v1/chat/completions` unterstützen.

LM Studio unterstützt im nicht interaktiven Modus auch ein Provider-spezifisches Schlüssel-Flag:

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

`--custom-base-url` verwendet standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Provider-Schlüssel als Referenzen statt als Klartext speichern:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding umgebungsbasierte Referenzen statt Klartext-Schlüsselwerte.
Für durch Auth-Profile gestützte Provider schreibt dies `keyRef`-Einträge; für benutzerdefinierte Provider schreibt dies `models.providers.<id>.apiKey` als Umgebungsreferenz (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht interaktiven `ref`-Modus:

- Setzen Sie die Provider-Umgebungsvariable in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Schlüssel-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese Umgebungsvariable ist ebenfalls gesetzt.
- Wenn ein Inline-Schlüssel-Flag ohne die erforderliche Umgebungsvariable übergeben wird, bricht das Onboarding schnell mit einer Anleitung ab.

Gateway-Tokenoptionen im nicht interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als Umgebungs-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere Umgebungsvariable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon` werden, wenn Token-Authentifizierung ein Token erfordert, durch SecretRef verwaltete Gateway-Token validiert, aber nicht als aufgelöster Klartext in der Umgebungsmetadaten des Supervisor-Dienstes persistiert.
- Mit `--install-daemon` bricht das Onboarding fail-closed mit Abhilfehinweisen ab, wenn der Token-Modus ein Token erfordert und die konfigurierte Token-SecretRef nicht aufgelöst ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, bis der Modus explizit gesetzt ist, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie dies als Konfigurationsschaden oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- Lokales Onboarding installiert ausgewählte herunterladbare Plugins, wenn der gewählte Einrichtungspfad sie erfordert.
- Remote-Onboarding schreibt nur Verbindungsinformationen für den Remote-Gateway und installiert keine lokalen Plugin-Pakete.
- `--allow-unconfigured` ist eine separate Ausweichmöglichkeit für die Gateway-Laufzeit. Es bedeutet nicht, dass das Onboarding `gateway.mode` weglassen darf.

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

Nicht interaktive lokale Gateway-Integrität:

- Wenn Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den Einrichtungspfad für den verwalteten Gateway. Ohne dieses Flag müssen Sie bereits ein lokales Gateway ausführen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Workspace-/Bootstrap-Schreibvorgänge möchten, verwenden Sie `--skip-health`.
- Wenn Sie Workspace-Dateien selbst verwalten, übergeben Sie `--skip-bootstrap`, um `agents.defaults.skipBootstrap: true` zu setzen und das Erstellen von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md` zu überspringen.
- Unter nativem Windows versucht `--install-daemon` zuerst geplante Aufgaben und fällt auf einen benutzerspezifischen Login-Eintrag im Autostart-Ordner zurück, wenn die Aufgabenerstellung verweigert wird.

Verhalten des interaktiven Onboardings mit Referenzmodus:

- Wählen Sie **Geheimnisreferenz verwenden**, wenn Sie dazu aufgefordert werden.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Geheimnis-Provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Preflight-Validierung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie erneut versuchen.

### Nicht interaktive Z.AI-Endpunktauswahl

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

Nicht interaktives Mistral-Beispiel:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Ablaufhinweise

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: minimale Eingabeaufforderungen, generiert automatisch ein Gateway-Token.
    - `manual`: vollständige Eingabeaufforderungen für Port, Bindung und Authentifizierung (Alias von `advanced`).
    - `import`: führt einen erkannten Migrations-Provider aus, zeigt den Plan in der Vorschau an und wendet ihn dann nach Bestätigung an.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Wenn eine Authentifizierungsauswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Auswahlfelder für Standardmodell und Zulassungsliste vorab auf diesen Provider. Für Volcengine und BytePlus werden dabei auch die Coding-Plan-Varianten (`volcengine-plan/*`, `byteplus-plan/*`) berücksichtigt.

    Wenn der Filter für den bevorzugten Provider noch keine geladenen Modelle ergibt, fällt das Onboarding auf den ungefilterten Katalog zurück, statt das Auswahlfeld leer zu lassen.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Einige Websuch-Provider lösen Provider-spezifische Folgeaufforderungen aus:

    - **Grok** kann eine optionale `x_search`-Einrichtung mit demselben xAI-OAuth-Profil oder API-Schlüssel und einer `x_search`-Modellauswahl anbieten.
    - **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` gegenüber `api.moonshot.cn`) und dem standardmäßigen Kimi-Websuchmodell fragen.

  </Accordion>
  <Accordion title="Other behaviors">
    - Verhalten des DM-Bereichs beim lokalen Onboarding: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference#outputs-and-internals).
    - Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
    - Benutzerdefinierter Provider: Verbinden Sie jeden OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich nicht aufgeführter gehosteter Provider. Verwenden Sie Unbekannt für die automatische Erkennung.
    - Wenn Hermes-Zustand erkannt wird, bietet das Onboarding einen Migrationsablauf an. Verwenden Sie [Migrieren](/de/cli/migrate) für Trockenlaufpläne, Überschreibmodus, Berichte und genaue Zuordnungen.

  </Accordion>
</AccordionGroup>

## Häufige Folgebefehle

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Verwenden Sie `openclaw setup` als denselben Einstiegspunkt für geführtes Onboarding. Verwenden Sie `openclaw setup --baseline`, wenn Sie nur die Basiskonfiguration bzw. den Basis-Workspace benötigen, später `openclaw configure` für gezielte Änderungen und `openclaw channels add` für eine reine Kanaleinrichtung.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
