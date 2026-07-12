---
read_when:
    - Anda mengotomatiskan proses onboarding dalam skrip atau CI
    - Anda memerlukan contoh noninteraktif untuk penyedia tertentu
sidebarTitle: CLI automation
summary: Onboarding berbasis skrip dan penyiapan agen untuk CLI OpenClaw
title: Otomatisasi CLI
x-i18n:
    generated_at: "2026-07-12T14:41:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Gunakan `openclaw onboard --non-interactive` untuk mengotomatiskan penyiapan dengan skrip. Perintah ini memerlukan `--accept-risk`: penyiapan noninteraktif dapat menulis kredensial dan konfigurasi daemon tanpa permintaan konfirmasi, sehingga flag tersebut merupakan pernyataan penerimaan risiko secara eksplisit.

<Note>
`--json` tidak mengaktifkan mode noninteraktif. Teruskan `--non-interactive --accept-risk` secara eksplisit untuk skrip.
</Note>

## Contoh dasar noninteraktif

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

Tambahkan `--json` untuk mendapatkan ringkasan yang dapat dibaca mesin.

- Nilai default `--gateway-port` adalah `18789`; teruskan hanya untuk menggantinya.
- `--skip-bootstrap` melewati pembuatan berkas ruang kerja default untuk otomatisasi yang telah mengisi ruang kerjanya sendiri terlebih dahulu.
- `--secret-input-mode ref` menyimpan referensi berbasis env (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) dalam profil autentikasi, bukan kunci dalam teks biasa. Dalam mode `ref` noninteraktif, variabel env penyedia harus sudah ditetapkan dalam lingkungan proses: meneruskan flag kunci sebaris tanpa variabel env yang sesuai akan langsung gagal.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Contoh khusus penyedia

<AccordionGroup>
  <Accordion title="Contoh kunci API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Cloudflare AI Gateway">
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
  <Accordion title="Contoh Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Ganti dengan `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` untuk katalog Go.
  </Accordion>
  <Accordion title="Contoh Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Contoh penyedia khusus">
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

    `--custom-api-key` bersifat opsional; beberapa titik akhir tidak memerlukan autentikasi. Jika dihilangkan, proses orientasi akan memeriksa `CUSTOM_API_KEY` di env. `--custom-provider-id` bersifat opsional dan diturunkan secara otomatis dari URL dasar jika dihilangkan. Nilai default `--custom-compatibility` adalah `openai` (nilai lainnya: `openai-responses`, `anthropic`).

    OpenClaw menyimpulkan dukungan masukan gambar dari pola ID model penglihatan yang dikenal (`gpt-4o`, `claude-3/4`, `gemini`, akhiran `-vl`/`vision`, dan pola serupa). Tambahkan `--custom-image-input` untuk memaksanya aktif pada model penglihatan yang tidak dikenali, atau `--custom-text-input` untuk memaksakan hanya teks.

    Varian mode referensi yang menyimpan `apiKey` sebagai `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

Autentikasi token penyiapan Anthropic tetap didukung, tetapi OpenClaw lebih memilih penggunaan ulang Claude CLI jika tersedia proses masuk Claude CLI lokal. Untuk produksi, sebaiknya gunakan kunci API Anthropic.

## Menambahkan agen lain

`openclaw agents add <name>` membuat agen terpisah dengan ruang kerja, sesi, dan profil autentikasinya sendiri. Menjalankannya tanpa `--workspace` (dan tanpa flag lain) akan membuka wisaya interaktif; meneruskan salah satu dari `--workspace`, `--model`, `--agent-dir`, `--bind`, atau `--non-interactive` akan menjalankannya secara noninteraktif dan kemudian mewajibkan `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Kunci konfigurasi yang ditulisnya (entri `agents.list[]` untuk ID agen baru):

- `name`
- `workspace`
- `agentDir`
- `model` (hanya jika `--model` diteruskan)

Catatan:

- Ruang kerja default (jika `--workspace` dihilangkan dalam wisaya interaktif): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` dapat diulang; tambahkan pengikatan untuk merutekan pesan masuk ke agen baru (wisaya juga dapat melakukannya secara interaktif).
- Nama agen dinormalisasi menjadi ID agen yang valid; `main` dicadangkan.

## Dokumentasi terkait

- Pusat orientasi: [Orientasi (CLI)](/id/start/wizard)
- Referensi lengkap: [Referensi Penyiapan CLI](/id/start/wizard-cli-reference)
- Referensi perintah: [`openclaw onboard`](/id/cli/onboard)
