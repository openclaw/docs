---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua rute autentikasi:

- **Kunci API** — akses API Anthropic langsung dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan kembali login Claude CLI yang sudah ada pada host yang sama

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kembali diizinkan, sehingga
OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui kecuali
Anthropic menerbitkan kebijakan baru.

Untuk host Gateway jangka panjang, kunci API Anthropic tetap menjadi jalur produksi yang paling jelas dan
paling dapat diprediksi.

Dokumentasi publik Anthropic saat ini:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Ikhtisar Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Menggunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Menggunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Memulai

<Tabs>
  <Tab title="Kunci API">
    **Paling cocok untuk:** akses API standar dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat kunci API di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Atau berikan kunci secara langsung:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
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
    **Paling cocok untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa kunci API terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terinstal dan sudah login">
        Verifikasi dengan:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan kembali kredensial Claude CLI yang sudah ada.
      </Step>
      <Step title="Verifikasi bahwa model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail penyiapan dan runtime untuk backend Claude CLI ada di [Backend CLI](/id/gateway/cli-backends).
    </Note>

    ### Contoh konfigurasi

    Utamakan ref model Anthropic kanonis ditambah override runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Ref model lama `claude-cli/claude-opus-4-7` masih berfungsi untuk
    kompatibilitas, tetapi konfigurasi baru sebaiknya mempertahankan pemilihan penyedia/model sebagai
    `anthropic/*` dan menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.

    <Tip>
    Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan kunci API Anthropic. OpenClaw juga mendukung opsi bergaya langganan dari [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude 4.6)

Model Claude 4.6 menggunakan thinking `adaptive` secara default di OpenClaw jika tidak ada level thinking eksplisit yang ditetapkan.

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
| `"long"`            | 1 jam         | Cache diperpanjang                         |
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
  <Accordion title="Override cache per agen">
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

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk traffic yang bursty/berpenggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Bedrock Claude">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga mengisi `cacheRetention: "short"` untuk ref Claude-on-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Toggle `/fast` bersama OpenClaw mendukung traffic Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

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
    - Hanya diinjeksikan untuk permintaan langsung `api.anthropic.com`. Rute proxy membiarkan `service_tier` tidak berubah.
    - Parameter `serviceTier` atau `service_tier` eksplisit mengesampingkan `/fast` saat keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    menyelesaikan kapabilitas media secara otomatis dari autentikasi Anthropic yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

    | Properti        | Nilai                 |
    | --------------- | --------------------- |
    | Model default   | `claude-opus-4-7`     |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M (beta)">
    Jendela konteks 1M Anthropic dikontrol oleh beta gate. Aktifkan per model:

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
    (`claude-cli/*`) bagi model Opus dan Sonnet yang memenuhi syarat, memperluas jendela konteks
    runtime untuk sesi CLI tersebut agar sesuai dengan perilaku API langsung.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Auth token lama (`sk-ant-oat-*`) ditolak untuk permintaan konteks 1M — OpenClaw mencatat peringatan dan kembali ke jendela konteks standar.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` dan varian `claude-cli`-nya memiliki jendela konteks 1M
    secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Error 401 / token tiba-tiba tidak valid">
    Auth token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ada kunci API ditemukan untuk penyedia "anthropic"'>
    Auth Anthropic bersifat **per agen** — agen baru tidak mewarisi kunci agen utama. Jalankan ulang onboarding untuk agen tersebut (atau konfigurasikan kunci API pada host Gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial ditemukan untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil auth mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan kunci API untuk path profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil auth yang tersedia (semuanya dalam cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown rate-limit Anthropic dapat bersifat scoped per model, sehingga model Anthropic saudara mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Detail penyiapan dan runtime backend Claude CLI.
  </Card>
  <Card title="Caching prompt" href="/id/reference/prompt-caching" icon="database">
    Cara kerja caching prompt lintas penyedia.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
