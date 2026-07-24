---
read_when:
    - Sie automatisieren das Onboarding in Skripten oder der CI
    - Sie benötigen nicht interaktive Beispiele für bestimmte Provider
sidebarTitle: CLI automation
summary: Skriptgestütztes Onboarding und Agenten-Setup für die OpenClaw CLI
title: CLI-Automatisierung
x-i18n:
    generated_at: "2026-07-24T04:43:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a9fd8530379927995641f8033651ff12ada98068f106672e6655a17b8265735
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Verwenden Sie `openclaw onboard --non-interactive`, um die Einrichtung zu skripten. Dafür ist `--accept-risk` erforderlich: Die nicht interaktive Einrichtung kann Anmeldedaten und die Daemon-Konfiguration ohne Bestätigungsaufforderung schreiben. Daher dient das Flag als ausdrückliche Bestätigung des Risikos.

<Note>
`--json` aktiviert nicht automatisch den nicht interaktiven Modus. Übergeben Sie für Skripte ausdrücklich `--non-interactive --accept-risk`.
</Note>

## Nicht interaktives Basisbeispiel

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Fügen Sie `--json` hinzu, um eine maschinenlesbare Zusammenfassung zu erhalten.

- `--gateway-port` verwendet standardmäßig `18789`; übergeben Sie es nur, um diesen Wert zu überschreiben.
- `--skip-bootstrap` überspringt die Erstellung der standardmäßigen Workspace-Dateien für Automatisierungen, die ihren eigenen Workspace vorab befüllen.
- `--secret-input-mode ref` speichert im Authentifizierungsprofil statt des Klartextschlüssels eine umgebungsvariablenbasierte Referenz (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`). Im nicht interaktiven `ref`-Modus muss die Umgebungsvariable des Providers bereits in der Prozessumgebung gesetzt sein: Wird ein Inline-Schlüssel-Flag ohne die zugehörige Umgebungsvariable übergeben, schlägt der Vorgang sofort fehl.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Providerspezifische Beispiele

<AccordionGroup>
  <Accordion title="Beispiel für einen Anthropic-API-Schlüssel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Wechseln Sie für den Go-Katalog zu `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
  </Accordion>
  <Accordion title="Synthetic-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI-Beispiel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für einen benutzerdefinierten Provider">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` ist optional; einige Endpunkte erfordern keine Authentifizierung. Wenn es nicht angegeben wird, prüft das Onboarding `CUSTOM_API_KEY` in der Umgebung. `--custom-provider-id` ist optional und wird bei fehlender Angabe automatisch aus der Basis-URL abgeleitet. `--custom-compatibility` verwendet standardmäßig `openai` (weitere Werte: `openai-responses`, `anthropic`).

    OpenClaw leitet die Unterstützung für Bildeingaben aus bekannten Mustern für Vision-Modell-IDs ab (`gpt-4o`, `claude-3/4`, `gemini`, Endungen mit `-vl`/`vision` und ähnliche Muster). Fügen Sie `--custom-image-input` hinzu, um sie für ein nicht erkanntes Vision-Modell zu erzwingen, oder `--custom-text-input`, um ausschließlich Text zu erzwingen.

    Variante im Referenzmodus, bei der `apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` gespeichert wird:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Die Authentifizierung mit einem Anthropic-Einrichtungstoken wird weiterhin unterstützt, OpenClaw bevorzugt jedoch die Wiederverwendung der Claude CLI, wenn eine lokale Anmeldung bei der Claude CLI verfügbar ist. Verwenden Sie für den Produktivbetrieb vorzugsweise einen Anthropic-API-Schlüssel.

## Weiteren Agenten hinzufügen

`openclaw agents add <name>` erstellt einen separaten Agenten mit eigenem Workspace, eigenen Sitzungen und Authentifizierungsprofilen. Wird der Befehl ohne `--workspace` (und ohne weitere Flags) ausgeführt, startet der interaktive Assistent. Die Übergabe eines der Flags `--workspace`, `--model`, `--agent-dir`, `--bind` oder `--non-interactive` führt ihn nicht interaktiv aus und erfordert dann `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Geschriebene Konfigurationsschlüssel (`agents.entries.*`-Eintrag für die neue Agenten-ID):

- `name`
- `workspace`
- `agentDir`
- `model` (nur wenn `--model` übergeben wird)

Hinweise:

- Standard-Workspace (wenn `--workspace` im interaktiven Assistenten nicht angegeben wird): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` kann wiederholt angegeben werden; fügen Sie Bindungen hinzu, um eingehende Nachrichten an den neuen Agenten weiterzuleiten (dies kann im Assistenten auch interaktiv erfolgen).
- Der Agentenname wird zu einer gültigen Agenten-ID normalisiert; `main` ist reserviert.

## Verwandte Dokumentation

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Vollständige Referenz: [Referenz zur CLI-Einrichtung](/de/start/wizard-cli-reference)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
