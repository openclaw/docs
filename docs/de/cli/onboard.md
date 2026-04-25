---
read_when:
    - Sie möchten eine geführte Einrichtung für Gateway, Workspace, Auth, Channels und Skills.
summary: CLI-Referenz für `openclaw onboard` (interaktives Onboarding)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Interaktives Onboarding für die lokale oder Remote-Gateway-Einrichtung.

## Verwandte Anleitungen

- CLI-Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Onboarding-Überblick: [Onboarding Overview](/de/start/onboarding-overview)
- CLI-Onboarding-Referenz: [CLI Setup Reference](/de/start/wizard-cli-reference)
- CLI-Automatisierung: [CLI Automation](/de/start/wizard-cli-automation)
- macOS-Onboarding: [Onboarding (macOS App)](/de/start/onboarding)

## Beispiele

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` startet die Vorschau des dialogorientierten Crestodian-Onboardings. Ohne
`--modern` verwendet `openclaw onboard` weiterhin den klassischen Onboarding-Ablauf.

Für Klartext-`ws://`-Ziele in privaten Netzwerken (nur vertrauenswürdige Netzwerke) setzen Sie
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in der Prozessumgebung des Onboardings.
Es gibt kein Äquivalent in `openclaw.json` für diesen clientseitigen
Break-Glass-Mechanismus beim Transport.

Nicht interaktiver benutzerdefinierter Anbieter:

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

LM Studio unterstützt im nicht interaktiven Modus auch ein anbieterspezifisches Key-Flag:

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

`--custom-base-url` hat standardmäßig den Wert `http://127.0.0.1:11434`. `--custom-model-id` ist optional; wenn es weggelassen wird, verwendet das Onboarding die von Ollama vorgeschlagenen Standardwerte. Cloud-Modell-IDs wie `kimi-k2.5:cloud` funktionieren hier ebenfalls.

Anbieter-Schlüssel als Referenzen statt als Klartext speichern:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Mit `--secret-input-mode ref` schreibt das Onboarding env-gestützte Referenzen anstelle von Klartext-Schlüsselwerten.
Für Anbieter mit Auth-Profil-Unterstützung werden dabei `keyRef`-Einträge geschrieben; für benutzerdefinierte Anbieter schreibt es `models.providers.<id>.apiKey` als env-Referenz (zum Beispiel `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Vertragsbedingungen für den nicht interaktiven `ref`-Modus:

- Setzen Sie die env-Variable des Anbieters in der Prozessumgebung des Onboardings (zum Beispiel `OPENAI_API_KEY`).
- Übergeben Sie keine Inline-Key-Flags (zum Beispiel `--openai-api-key`), es sei denn, diese env-Variable ist ebenfalls gesetzt.
- Wenn ein Inline-Key-Flag ohne die erforderliche env-Variable übergeben wird, schlägt das Onboarding sofort mit einem Hinweis fehl.

Optionen für Gateway-Token im nicht interaktiven Modus:

- `--gateway-auth token --gateway-token <token>` speichert ein Klartext-Token.
- `--gateway-auth token --gateway-token-ref-env <name>` speichert `gateway.auth.token` als env-SecretRef.
- `--gateway-token` und `--gateway-token-ref-env` schließen sich gegenseitig aus.
- `--gateway-token-ref-env` erfordert eine nicht leere env-Variable in der Prozessumgebung des Onboardings.
- Mit `--install-daemon` werden SecretRef-verwaltete Gateway-Tokens, wenn die Token-Authentifizierung ein Token erfordert, validiert, aber nicht als aufgelöster Klartext in den Umgebungsmetadaten des Supervisor-Service persistent gespeichert.
- Mit `--install-daemon` schlägt das Onboarding geschlossen fehl und zeigt Abhilfehinweise an, wenn der Token-Modus ein Token erfordert und der konfigurierte Gateway-Token-SecretRef nicht aufgelöst ist.
- Mit `--install-daemon` blockiert das Onboarding die Installation, wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, bis der Modus explizit festgelegt wird.
- Lokales Onboarding schreibt `gateway.mode="local"` in die Konfiguration. Wenn in einer späteren Konfigurationsdatei `gateway.mode` fehlt, behandeln Sie dies als beschädigte Konfiguration oder unvollständige manuelle Bearbeitung, nicht als gültige Abkürzung für den lokalen Modus.
- `--allow-unconfigured` ist ein separater Escape-Hatch für die Gateway-Laufzeit. Es bedeutet nicht, dass das Onboarding `gateway.mode` weglassen darf.

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

Integritätsprüfung des lokalen Gateway im nicht interaktiven Modus:

- Sofern Sie nicht `--skip-health` übergeben, wartet das Onboarding auf ein erreichbares lokales Gateway, bevor es erfolgreich beendet wird.
- `--install-daemon` startet zuerst den verwalteten Gateway-Installationspfad. Ohne diesen muss bereits ein lokales Gateway laufen, zum Beispiel `openclaw gateway run`.
- Wenn Sie in der Automatisierung nur Schreibvorgänge für Konfiguration/Workspace/Bootstrap möchten, verwenden Sie `--skip-health`.
- Wenn Sie Workspace-Dateien selbst verwalten, übergeben Sie `--skip-bootstrap`, um `agents.defaults.skipBootstrap: true` zu setzen und das Erstellen von `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` und `BOOTSTRAP.md` zu überspringen.
- Unter nativem Windows versucht `--install-daemon` zuerst Scheduled Tasks und fällt auf einen Login-Eintrag im benutzerspezifischen Startup-Ordner zurück, wenn das Erstellen der Aufgabe verweigert wird.

Verhalten des interaktiven Onboardings mit Referenzmodus:

- Wählen Sie auf Aufforderung **Use secret reference**.
- Wählen Sie dann entweder:
  - Umgebungsvariable
  - Konfigurierter Secret-Anbieter (`file` oder `exec`)
- Das Onboarding führt vor dem Speichern der Referenz eine schnelle Vorabprüfung durch.
  - Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

Nicht interaktive Z.AI-Endpunktoptionen:

Hinweis: `--auth-choice zai-api-key` erkennt jetzt automatisch den besten Z.AI-Endpunkt für Ihren Schlüssel (bevorzugt die allgemeine API mit `zai/glm-5.1`).
Wenn Sie gezielt die Endpunkte von GLM Coding Plan verwenden möchten, wählen Sie `zai-coding-global` oder `zai-coding-cn`.

```bash
# Endpunktauswahl ohne Prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Weitere Z.AI-Endpunktoptionen:
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

Hinweise zum Ablauf:

- `quickstart`: minimale Eingabeaufforderungen, erzeugt automatisch ein Gateway-Token.
- `manual`: vollständige Eingabeaufforderungen für Port/Bind/Auth (Alias von `advanced`).
- Wenn eine Auth-Auswahl einen bevorzugten Anbieter impliziert, filtert das Onboarding die Auswahlen für Standardmodell und Allowlist auf diesen Anbieter vor.
  Für Volcengine und BytePlus schließt dies auch die Coding-Plan-Varianten ein
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Wenn der Filter für bevorzugte Anbieter noch keine geladenen Modelle liefert, greift das Onboarding auf den ungefilterten Katalog zurück, statt die Auswahl leer zu lassen.
- Im Schritt zur Websuche können einige Anbieter anbieterspezifische Folgeabfragen auslösen:
  - **Grok** kann eine optionale `x_search`-Einrichtung mit demselben `XAI_API_KEY`
    und einer `x_search`-Modellauswahl anbieten.
  - **Kimi** kann nach der Moonshot-API-Region (`api.moonshot.ai` vs
    `api.moonshot.cn`) und dem Standardmodell für die Kimi-Websuche fragen.
- Verhalten des DM-Bereichs beim lokalen Onboarding: [CLI Setup Reference](/de/start/wizard-cli-reference#outputs-and-internals).
- Schnellster erster Chat: `openclaw dashboard` (Control UI, keine Channel-Einrichtung).
- Benutzerdefinierter Anbieter: Jeden mit OpenAI oder Anthropic kompatiblen Endpunkt verbinden,
  einschließlich nicht aufgelisteter gehosteter Anbieter. Verwenden Sie Unknown zur automatischen Erkennung.

## Häufige Folgekommandos

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie `--non-interactive` für Skripte.
</Note>
