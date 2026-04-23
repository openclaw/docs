---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Workspace, Auth, Kanäle und Skills
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: onboard
x-i18n:
    generated_at: "2026-04-23T06:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktives Onboarding für die Einrichtung eines lokalen oder Remote-Gateways.

## Verwandte Anleitungen

- CLI-Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Onboarding-Überblick: [Onboarding Overview](/de/start/onboarding-overview)
- CLI-Onboarding-Referenz: [CLI Setup Reference](/de/start/wizard-cli-reference)
- CLI-Automatisierung: [CLI Automation](/de/start/wizard-cli-automation)
- macOS-Onboarding: [Onboarding (macOS App)](/de/start/onboarding)

## Beispiele

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Für unverschlüsselte `ws://`-Ziele in privaten Netzwerken (nur vertrauenswürdige Netzwerke) setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.

Nicht interaktiver benutzerdefinierter Provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` ist im nicht interaktiven Modus optional. Wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.

LM Studio unterstützt im nicht interaktiven Modus ebenfalls ein providerspezifisches Key-Flag:

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

`--custom-base-url` verwendet standardmäßig `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding Ollamas vorgeschlagene Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Provider-Schlüssel als Refs statt als Klartext speichern:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding env-gestützte Refs anstelle von Klartext-Schlüsselwerten.
Für auth-profile-gestützte Provider werden `keyRef`-Einträge geschrieben; für benutzerdefinierte Provider schreibt dies `models.providers.<id>.apiKey` als env-Ref (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertrag für den nicht interaktiven `ref`-Modus:

- Setzen Sie die Umgebungsvariable des Providers in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Key-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese env-Variable ist ebenfalls gesetzt.
- Wenn ein Inline-Key-Flag ohne die erforderliche env-Variable übergeben wird, schlägt das Onboarding schnell fehl und gibt Hinweise.

Gateway-Token-Optionen im nicht interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als env-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere env-Variable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon`, wenn die Token-Authentifizierung ein Token erfordert, werden SecretRef-verwaltete Gateway-Token validiert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Dienstes persistiert.
- Mit `--install-daemon`, wenn der Token-Modus ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst ist, schlägt das Onboarding fail-closed fehl und gibt Hinweise zur Behebung.
- Mit `--install-daemon`, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert das Onboarding die Installation, bis der Modus explizit gesetzt ist.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie das als Konfigurationsschaden oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- `--allow-unconfigured` ist eine separate Escape-Hatch für die Gateway-Laufzeit. Es bedeutet nicht, dass das Onboarding `gateway.mode` weglassen darf.

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

Integritätsprüfung des lokalen Gateways im nicht interaktiven Modus:

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne diese Option muss bereits ein lokales Gateway laufen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Konfigurations-/Workspace-/Bootstrap-Schreibvorgänge möchten, verwenden Sie `--skip-health`.
- Unter nativem Windows versucht `--install-daemon` zuerst Geplante Aufgaben und greift bei verweigerter Erstellung auf ein Anmeldeelement pro Benutzer im Startup-Ordner zurück.

Verhalten des interaktiven Onboardings im Referenzmodus:

- Wählen Sie bei Aufforderung **Use secret reference**.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Secret-Provider (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Ref eine schnelle Vorabprüfung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

Nicht interaktive Z.AI-Endpunktauswahl:

Hinweis: `--auth-choice zai-api-key` erkennt jetzt automatisch den besten Z.AI-Endpunkt für Ihren Schlüssel (bevorzugt die allgemeine API mit `zai/glm-5.1`).
Wenn Sie gezielt die GLM Coding Plan-Endpunkte möchten, wählen Sie `zai-coding-global` oder `zai-coding-cn`.

```bash
# Endpunktauswahl ohne Prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Andere Z.AI-Endpunktoptionen:
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

Hinweise zu den Abläufen:

- `quickstart`: minimale Prompts, erzeugt automatisch ein Gateway-Token.
- `manual`: vollständige Prompts für Port/Bind/Auth (Alias von `advanced`).
- Wenn eine Auth-Auswahl einen bevorzugten Provider impliziert, filtert das Onboarding die Picker für Standardmodell und Allowlist vorab auf diesen Provider. Für Volcengine und BytePlus schließt dies auch die Coding-Plan-Varianten ein
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Wenn der Filter für bevorzugte Provider noch keine geladenen Modelle liefert, greift das Onboarding auf den ungefilterten Katalog zurück, statt den Picker leer zu lassen.
- Im Websuche-Schritt können einige Provider providerspezifische
  Folge-Prompts auslösen:
  - **Grok** kann ein optionales `x_search`-Setup mit demselben `XAI_API_KEY`
    und einer `x_search`-Modellauswahl anbieten.
  - **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs
    `api.moonshot.cn`) und nach dem Standard-Websuchemodell von Kimi.
- Verhalten des lokalen Onboardings für den DM-Bereich: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Kanaleinrichtung).
- Benutzerdefinierter Provider: Verbinden Sie jeden OpenAI- oder Anthropic-kompatiblen Endpunkt, einschließlich gehosteter Provider, die nicht aufgeführt sind. Verwenden Sie Unknown zur automatischen Erkennung.

## Häufige Folge-Befehle

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
