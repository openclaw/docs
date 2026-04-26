---
read_when:
    - Anda sedang mengotomatiskan onboarding dalam skrip atau CI
    - Anda memerlukan contoh non-interaktif untuk provider tertentu
sidebarTitle: CLI automation
summary: Onboarding dengan skrip dan penyiapan agent untuk CLI OpenClaw
title: Otomatisasi CLI
x-i18n:
    generated_at: "2026-04-26T11:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Gunakan `--non-interactive` untuk mengotomatiskan `openclaw onboard`.

<Note>
`--json` tidak menyiratkan mode non-interaktif. Gunakan `--non-interactive` (dan `--workspace`) untuk skrip.
</Note>

## Contoh non-interaktif dasar

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

Tambahkan `--json` untuk ringkasan yang dapat dibaca mesin.

Gunakan `--skip-bootstrap` ketika otomatisasi Anda sudah melakukan pre-seed file workspace dan tidak ingin onboarding membuat file bootstrap default.

Gunakan `--secret-input-mode ref` untuk menyimpan ref berbasis env dalam auth profile alih-alih nilai plaintext.
Pemilihan interaktif antara env ref dan provider ref yang dikonfigurasi (`file` atau `exec`) tersedia dalam alur onboarding.

Dalam mode `ref` non-interaktif, env var provider harus disetel dalam lingkungan proses.
Memberikan flag key inline tanpa env var yang cocok sekarang akan gagal cepat.

Contoh:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Contoh khusus provider

<AccordionGroup>
  <Accordion title="Contoh API key Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Cloudflare AI Gateway">
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
  <Accordion title="Contoh Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Tukar ke `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` untuk katalog Go.
  </Accordion>
  <Accordion title="Contoh Ollama">
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
  <Accordion title="Contoh provider kustom">
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

    `--custom-api-key` bersifat opsional. Jika dihilangkan, onboarding memeriksa `CUSTOM_API_KEY`.

    Varian mode ref:

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

    Dalam mode ini, onboarding menyimpan `apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token tetap tersedia sebagai jalur token onboarding yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI saat tersedia.
Untuk produksi, pilih API key Anthropic.

## Tambahkan agent lain

Gunakan `openclaw agents add <name>` untuk membuat agent terpisah dengan workspace,
sesi, dan auth profile-nya sendiri. Menjalankan tanpa `--workspace` akan meluncurkan wizard.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Yang disetel:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Catatan:

- Workspace default mengikuti `~/.openclaw/workspace-<agentId>`.
- Tambahkan `bindings` untuk merutekan pesan masuk (wizard dapat melakukannya).
- Flag non-interaktif: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Dokumentasi terkait

- Pusat onboarding: [Onboarding (CLI)](/id/start/wizard)
- Referensi lengkap: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
