---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui API key atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T09:21:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua jalur auth:

- **API key** — akses API Anthropic langsung dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan kembali login Claude CLI yang sudah ada pada host yang sama

<Warning>
Staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw diizinkan lagi, sehingga
OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui kecuali
Anthropic menerbitkan kebijakan baru.

Untuk host gateway yang berjalan lama, API key Anthropic tetap menjadi jalur produksi
yang paling jelas dan paling dapat diprediksi.

Dokumen publik Anthropic saat ini:

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
      <Step title="Dapatkan API key Anda">
        Buat API key di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        # pilih: Anthropic API key
        ```

        Atau teruskan key secara langsung:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifikasi model tersedia">
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
    **Terbaik untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa API key terpisah.

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
        # pilih: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan kembali kredensial Claude CLI yang sudah ada.
      </Step>
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail setup dan runtime untuk backend Claude CLI ada di [CLI Backends](/id/gateway/cli-backends).
    </Note>

    <Tip>
    Jika Anda menginginkan jalur penagihan yang paling jelas, gunakan API key Anthropic sebagai gantinya. OpenClaw juga mendukung opsi bergaya langganan dari [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen), [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude 4.6)

Model Claude 4.6 default ke thinking `adaptive` di OpenClaw saat tidak ada level thinking eksplisit yang disetel.

Timpa per pesan dengan `/think:<level>` atau dalam params model:

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
Dokumen Anthropic terkait:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw mendukung fitur prompt caching Anthropic untuk auth API key.

| Value               | Durasi cache | Deskripsi                              |
| ------------------- | ------------ | -------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk auth API key |
| `"long"`            | 1 jam        | Cache diperpanjang                     |
| `"none"`            | Tanpa cache  | Nonaktifkan prompt caching             |

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
    Gunakan params tingkat model sebagai baseline, lalu timpa agen tertentu melalui `agents.list[].params`:

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

    Urutan penggabungan config:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (id yang cocok, menimpa per key)

    Ini memungkinkan satu agen mempertahankan cache yang tahan lama sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas bursty/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Claude di Bedrock">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default cerdas API key juga melakukan seed `cacheRetention: "short"` untuk referensi Claude-on-Bedrock saat tidak ada nilai eksplisit yang disetel.
  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Fast mode">
    Toggle `/fast` bersama milik OpenClaw mendukung lalu lintas Anthropic langsung (API key dan OAuth ke `api.anthropic.com`).

    | Command | Dipetakan ke |
    |---------|--------------|
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
    - Hanya disuntikkan untuk permintaan langsung `api.anthropic.com`. Jalur proxy membiarkan `service_tier` tetap tidak berubah.
    - Params `serviceTier` atau `service_tier` eksplisit menimpa `/fast` saat keduanya disetel.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.
    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    menyelesaikan kapabilitas media secara otomatis dari auth Anthropic yang dikonfigurasi — tidak
    diperlukan config tambahan.

    | Property        | Value                |
    | --------------- | -------------------- |
    | Model default   | `claude-opus-4-6`    |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui provider pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M (beta)">
    Jendela konteks 1M milik Anthropic dibatasi beta-gate. Aktifkan per model:

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

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Auth token lama (`sk-ant-oat-*`) ditolak untuk permintaan konteks 1M — OpenClaw mencatat peringatan dan fallback ke jendela konteks standar.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` dan variannya `claude-cli` memiliki jendela konteks
    1M secara default — tidak memerlukan `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Error 401 / token tiba-tiba tidak valid">
    Auth token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan API key Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ada API key ditemukan untuk provider "anthropic"'>
    Auth Anthropic bersifat **per agen** — agen baru tidak mewarisi key dari agen utama. Jalankan ulang onboarding untuk agen tersebut (atau konfigurasikan API key pada host gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial ditemukan untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil auth mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan API key untuk path profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil auth yang tersedia (semua dalam cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown rate-limit Anthropic dapat dicakup per model, jadi model Anthropic saudara masih bisa digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown selesai.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="CLI Backends" href="/id/gateway/cli-backends" icon="terminal">
    Penyiapan backend Claude CLI dan detail runtime.
  </Card>
  <Card title="Prompt caching" href="/id/reference/prompt-caching" icon="database">
    Cara kerja prompt caching di berbagai provider.
  </Card>
  <Card title="OAuth and auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
