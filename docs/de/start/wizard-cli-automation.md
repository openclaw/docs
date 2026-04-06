---
read_when:
    - Sie automatisieren das Onboarding in Skripten oder CI
    - Sie benötigen nicht interaktive Beispiele für bestimmte Provider
sidebarTitle: CLI automation
summary: Skriptgesteuertes Onboarding und Agent-Einrichtung für die OpenClaw-CLI
title: CLI-Automatisierung
x-i18n:
    generated_at: "2026-04-06T03:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 878ea3fa9f2a75cff9f1a803ccb8a52a1219102e2970883ad18e3aaec5967fd2
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# CLI-Automatisierung

Verwenden Sie `--non-interactive`, um `openclaw onboard` zu automatisieren.

<Note>
`--json` impliziert keinen nicht interaktiven Modus. Verwenden Sie für Skripte `--non-interactive` (und `--workspace`).
</Note>

## Grundlegendes nicht interaktives Beispiel

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
  --skip-skills
```

Fügen Sie `--json` hinzu, um eine maschinenlesbare Zusammenfassung zu erhalten.

Verwenden Sie `--secret-input-mode ref`, um env-gestützte Referenzen in Auth-Profilen statt Klartextwerten zu speichern.
Die interaktive Auswahl zwischen Env-Referenzen und konfigurierten Provider-Referenzen (`file` oder `exec`) ist im Onboarding-Ablauf verfügbar.

Im nicht interaktiven Modus `ref` müssen die Env-Variablen des Providers in der Prozessumgebung gesetzt sein.
Die Übergabe von Inline-Key-Flags ohne die passende Env-Variable schlägt jetzt sofort fehl.

Beispiel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Providerspezifische Beispiele

<AccordionGroup>
  <Accordion title="Beispiel für Anthropic-API-Key">
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
    Wechseln Sie zu `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` für den Go-Katalog.
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
  <Accordion title="Beispiel für benutzerdefinierten Provider">
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

    Variante im Ref-Modus:

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

Das Anthropic-Setup-Token ist wieder als veralteter/manueller Onboarding-Pfad verfügbar.
Verwenden Sie es in dem Bewusstsein, dass Anthropic OpenClaw-Benutzern mitgeteilt hat, dass der OpenClaw-
Claude-Login-Pfad **Extra Usage** erfordert. Für den produktiven Einsatz sollten Sie einen
Anthropic-API-Key bevorzugen.

## Einen weiteren Agenten hinzufügen

Verwenden Sie `openclaw agents add <name>`, um einen separaten Agenten mit eigenem Workspace,
Sitzungen und Auth-Profilen zu erstellen. Die Ausführung ohne `--workspace` startet den Assistenten.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Was dabei gesetzt wird:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Hinweise:

- Standard-Workspaces folgen `~/.openclaw/workspace-<agentId>`.
- Fügen Sie `bindings` hinzu, um eingehende Nachrichten zu routen (der Assistent kann dies übernehmen).
- Nicht interaktive Flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Verwandte Dokumentation

- Onboarding-Hub: [Onboarding (CLI)](/de/start/wizard)
- Vollständige Referenz: [CLI-Setup-Referenz](/de/start/wizard-cli-reference)
- Befehlsreferenz: [`openclaw onboard`](/cli/onboard)
