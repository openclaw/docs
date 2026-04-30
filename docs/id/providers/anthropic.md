---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T10:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua rute autentikasi:

- **Kunci API** — akses langsung Anthropic API dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan ulang login Claude CLI yang sudah ada di host yang sama

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan kembali, jadi
OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui kecuali
Anthropic menerbitkan kebijakan baru.

Untuk host gateway yang berjalan lama, kunci API Anthropic tetap menjadi jalur produksi yang paling jelas dan
paling dapat diprediksi.

Dokumentasi publik Anthropic saat ini:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Ikhtisar Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Menggunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Menggunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Memulai

<Tabs>
  <Tab title="API key">
    **Terbaik untuk:** akses API standar dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Get your API key">
        Buat kunci API di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Contoh konfigurasi

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Terbaik untuk:** menggunakan ulang login Claude CLI yang sudah ada tanpa kunci API terpisah.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Verifikasi dengan:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan ulang kredensial Claude CLI yang sudah ada.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail penyiapan dan runtime untuk backend Claude CLI ada di [Backend CLI](/id/gateway/cli-backends).
    </Note>

    ### Contoh konfigurasi

    Utamakan ref model Anthropic kanonis plus override runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Ref model lama `claude-cli/claude-opus-4-7` masih berfungsi untuk
    kompatibilitas, tetapi konfigurasi baru sebaiknya mempertahankan pemilihan penyedia/model sebagai
    `anthropic/*` dan menaruh backend eksekusi di `agentRuntime.id`.

    <Tip>
    Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan kunci API Anthropic sebagai gantinya. OpenClaw juga mendukung opsi bergaya langganan dari [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude 4.6)

Model Claude 4.6 default ke thinking `adaptive` di OpenClaw ketika tidak ada tingkat thinking eksplisit yang ditetapkan.

Override per pesan dengan `/think:<level>` atau di parameter model:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Dokumentasi Anthropic terkait:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching prompt

OpenClaw mendukung fitur caching prompt Anthropic untuk autentikasi kunci API.

| Nilai               | Durasi cache | Deskripsi                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk autentikasi kunci API |
| `"long"`            | 1 jam         | Cache yang diperluas                         |
| `"none"`            | Tanpa caching     | Nonaktifkan caching prompt                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Gunakan parameter tingkat model sebagai baseline, lalu override agen tertentu melalui `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Urutan penggabungan konfigurasi:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` yang cocok, override berdasarkan kunci)

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk traffic bursty/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` ketika dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga mengisi `cacheRetention: "short"` untuk ref Claude-on-Bedrock ketika tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Fast mode">
    Toggle bersama `/fast` OpenClaw mendukung traffic Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

    | Perintah | Dipetakan ke |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Hanya disuntikkan untuk permintaan langsung `api.anthropic.com`. Rute proxy membiarkan `service_tier` tidak berubah.
    - Parameter `serviceTier` atau `service_tier` eksplisit mengoverride `/fast` ketika keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    secara otomatis menyelesaikan kapabilitas media dari autentikasi Anthropic yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

    | Properti       | Nilai                |
    | -------------- | -------------------- |
    | Model default  | `claude-opus-4-6`    |
    | Input yang didukung | Gambar, dokumen PDF |

    Ketika gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Jendela konteks 1M Anthropic berada di balik beta. Aktifkan per model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw memetakan ini ke `anthropic-beta: context-1m-2025-08-07` pada permintaan.

    `params.context1m: true` juga berlaku untuk backend Claude CLI
    (`claude-cli/*`) untuk model Opus dan Sonnet yang memenuhi syarat, memperluas jendela
    konteks runtime untuk sesi CLI tersebut agar cocok dengan perilaku API langsung.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Auth token lama (`sk-ant-oat-*`) ditolak untuk permintaan konteks 1M — OpenClaw mencatat peringatan dan kembali ke jendela konteks standar.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` dan varian `claude-cli`-nya memiliki jendela konteks 1M
    secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Auth token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Auth Anthropic bersifat **per agen** — agen baru tidak mewarisi kunci agen utama. Jalankan ulang onboarding untuk agen tersebut (atau konfigurasikan kunci API pada host gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil auth mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan kunci API untuk jalur profil tersebut.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown rate-limit Anthropic dapat bersifat per model, sehingga model Anthropic saudara mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="CLI backends" href="/id/gateway/cli-backends" icon="terminal">
    Detail penyiapan dan runtime backend Claude CLI.
  </Card>
  <Card title="Prompt caching" href="/id/reference/prompt-caching" icon="database">
    Cara kerja caching prompt di berbagai penyedia.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
