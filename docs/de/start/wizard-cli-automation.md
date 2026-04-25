---
read_when:
    - Du automatisierst das Onboarding in Skripten oder CI.
    - Du benötigst nicht interaktive Beispiele für bestimmte Anbieter.
sidebarTitle: CLI automation
summary: Skriptgesteuertes Onboarding und Agenteneinrichtung für die OpenClaw-CLI
title: CLI-Automatisierung
x-i18n:
    generated_at: "2026-04-25T13:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Verwende `--non-interactive`, um `openclaw onboard` zu automatisieren.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwende `--non-interactive` (und `--workspace`) für Skripte.
</Note>

## Nicht interaktives Basisbeispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Füge `--json` für eine maschinenlesbare Zusammenfassung hinzu.

Verwende `--skip-bootstrap`, wenn deine Automatisierung Workspace-Dateien vorab bereitstellt und nicht möchte, dass das Onboarding die Standard-Bootstrap-Dateien erstellt.

Verwende `--secret-input-mode ref`, um durch Umgebungsvariablen gestützte Referenzen in Auth-Profilen statt Klartextwerten zu speichern.
Die interaktive Auswahl zwischen Umgebungsreferenzen und konfigurierten Anbieter-Referenzen (`file` oder `exec`) ist im Onboarding-Ablauf verfügbar.

Im nicht interaktiven `ref`-Modus müssen die Umgebungsvariablen des Anbieters in der Prozessumgebung gesetzt sein.
Das Übergeben von Inline-Schlüssel-Flags ohne die passende Umgebungsvariable schlägt jetzt sofort fehl.

Beispiel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Anbieterspezifische Beispiele

<AccordionGroup>
  <Accordion title="Beispiel für Anthropic-API-Schlüssel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Wechsle zu `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` für den Go-Katalog.
  </Accordion>
  <Accordion title="Ollama-Beispiel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Beispiel für benutzerdefinierten Anbieter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` ist optional. Wenn es weggelassen wird, prüft das Onboarding `CUSTOM_API_KEY`.

    Variante für den Ref-Modus:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    In diesem Modus speichert das Onboarding `apiKey` als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic-Setup-Token bleibt als unterstützter Onboarding-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt nach Möglichkeit die Wiederverwendung der Claude CLI.
Für die Produktion ist ein Anthropic-API-Schlüssel vorzuziehen.

## Weiteren Agenten hinzufügen

Verwende `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace, eigenen Sitzungen und eigenen Auth-Profilen zu erstellen. Das Ausführen ohne `--workspace` startet den Assistenten.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Das wird gesetzt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Füge `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (der Assistent kann dies erledigen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Zugehörige Dokumentation

- Onboarding-Übersicht: [Onboarding (CLI)](/de/start/wizard)
- Vollständige Referenz: [CLI-Einrichtungsreferenz](/de/start/wizard-cli-reference)
- Befehlsreferenz: [`openclaw onboard`](/de/cli/onboard)
