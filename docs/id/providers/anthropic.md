---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua rute autentikasi:

- **Kunci API** — akses API Anthropic langsung dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan kembali login Claude Code yang sudah ada di host yang sama

<Warning>
Backend Claude CLI OpenClaw menjalankan Claude Code CLI yang terinstal dalam
mode cetak noninteraktif. Dokumentasi Claude Code Anthropic saat ini menjelaskan
`claude -p` sebagai penggunaan Agent SDK/programatik. Pembaruan dukungan
Anthropic pada 15 Juni 2026 menjeda perubahan penagihan Agent SDK yang
diumumkan sebelumnya. Untuk saat ini, Anthropic menyatakan bahwa penggunaan
Claude Agent SDK, `claude -p`, dan aplikasi pihak ketiga masih mengambil dari
batas penggunaan langganan. Kredit Agent SDK bulanan yang sebelumnya diumumkan
tidak tersedia selama Anthropic merevisi rencana tersebut.

Claude Code interaktif tetap mengambil dari batas paket Claude yang sedang
masuk. Autentikasi kunci API tetap menggunakan penagihan API langsung bayar
sesuai pemakaian. Untuk host Gateway jangka panjang, otomatisasi bersama, dan
biaya produksi yang dapat diprediksi, gunakan kunci API Anthropic.

Periksa artikel dukungan Anthropic saat ini sebelum mengandalkan perilaku
penagihan langganan:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Gunakan Claude Agent SDK dengan paket Claude Anda](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Gunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Gunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Kelola biaya Claude Code](https://code.claude.com/docs/en/costs)

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

        Atau teruskan kunci secara langsung:

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Paling cocok untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa kunci API terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terinstal dan sudah masuk">
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

    <Warning>
    Penggunaan ulang Claude CLI mengharapkan proses OpenClaw berjalan di host
    yang sama dengan login Claude CLI. Instalasi Docker dapat mempertahankan
    home kontainer dan masuk ke Claude Code di sana; lihat
    [backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).
    Instalasi kontainer lain seperti [Podman](/id/install/podman) tidak memasang
    `~/.claude` host ke penyiapan atau runtime; gunakan kunci API Anthropic di sana, atau pilih
    penyedia dengan OAuth yang dikelola OpenClaw seperti
    [OpenAI Codex](/id/providers/openai).
    </Warning>

    ### Contoh konfigurasi

    Utamakan ref model Anthropic kanonis plus override runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Ref model lama `claude-cli/claude-opus-4-7` masih berfungsi untuk
    kompatibilitas, tetapi konfigurasi baru sebaiknya menjaga pemilihan
    penyedia/model sebagai `anthropic/*` dan menempatkan backend eksekusi dalam
    kebijakan runtime penyedia/model.

    ### Penagihan dan `claude -p`

    OpenClaw menggunakan jalur `claude -p` noninteraktif Claude Code untuk
    proses Claude CLI. Anthropic saat ini memperlakukan jalur tersebut sebagai
    penggunaan Agent SDK/programatik:

    - Pembaruan dukungan Anthropic pada 15 Juni 2026 menjeda rencana kredit
      Agent SDK terpisah yang sebelumnya diumumkan.
    - Untuk saat ini, penggunaan Claude Agent SDK paket langganan, `claude -p`,
      dan aplikasi pihak ketiga masih mengambil dari batas penggunaan langganan
      yang sedang masuk.
    - Kredit Agent SDK bulanan yang sebelumnya diumumkan tidak tersedia selama
      Anthropic merevisi rencana tersebut.
    - Login Console/kunci API menggunakan penagihan API bayar sesuai pemakaian
      dan tidak menerima kredit Agent SDK langganan.

    Lihat [artikel paket Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic untuk pemberitahuan jeda, dan artikel paket Claude Code untuk
    perilaku langganan
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    dan
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic dapat mengubah perilaku penagihan dan batas laju Claude Code
    tanpa rilis OpenClaw. Periksa `claude auth status`, `/status`, dan
    dokumentasi tertaut Anthropic saat prediktabilitas penagihan penting.

    <Tip>
    Untuk otomatisasi produksi bersama, gunakan kunci API Anthropic, bukan
    Claude CLI. OpenClaw juga mendukung opsi bergaya langganan dari
    [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude Fable 5, 4.8, dan 4.6)

`anthropic/claude-fable-5` selalu menggunakan thinking adaptif dan default ke
upaya `high`. Karena Anthropic tidak mengizinkan thinking dinonaktifkan untuk model ini,
`/think off` dan `/think minimal` menggunakan upaya `low`. OpenClaw juga menghilangkan nilai
temperature kustom untuk permintaan Fable 5.

Claude Opus 4.8 tetap menonaktifkan thinking secara default di OpenClaw. Saat Anda secara eksplisit mengaktifkan thinking adaptif dengan `/think high|xhigh|max`, OpenClaw mengirim nilai upaya Opus 4.8 milik Anthropic; model Claude 4.6 default ke `adaptive`.

Timpa per pesan dengan `/think:<level>` atau di parameter model:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Dokumentasi Anthropic terkait:
- [Thinking adaptif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking diperluas](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Penyimpanan cache prompt

OpenClaw mendukung fitur penyimpanan cache prompt milik Anthropic untuk autentikasi kunci API.

| Nilai               | Durasi cache | Deskripsi                              |
| ------------------- | ------------ | -------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk autentikasi kunci API |
| `"long"`            | 1 jam        | Cache diperpanjang                     |
| `"none"`            | Tanpa penyimpanan cache | Nonaktifkan penyimpanan cache prompt  |

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
    Gunakan parameter tingkat model sebagai baseline Anda, lalu timpa agen tertentu melalui `agents.list[].params`:

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
    2. `agents.list[].params` (`id` yang cocok, menimpa berdasarkan kunci)

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan penyimpanan cache untuk trafik berlonjakan/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima penerusan langsung `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga mengisi `cacheRetention: "short"` untuk referensi Claude-on-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Fast mode">
    Toggle bersama `/fast` OpenClaw mendukung trafik Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

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
    - Hanya disuntikkan untuk permintaan langsung `api.anthropic.com`. Rute proxy membiarkan `service_tier` tidak tersentuh.
    - Parameter `serviceTier` atau `service_tier` eksplisit menimpa `/fast` saat keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    menyelesaikan otomatis kapabilitas media dari autentikasi Anthropic yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

    | Properti        | Nilai                 |
    | --------------- | --------------------- |
    | Model default   | `claude-opus-4-8`     |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="1M context window">
    Jendela konteks 1M Anthropic tersedia pada model Claude 4.x berkemampuan GA
    seperti Opus 4.8, Opus 4.7, Opus 4.6, dan Sonnet 4.6. OpenClaw mengukur model tersebut pada
    1M secara otomatis:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Konfigurasi lama dapat tetap memakai `params.context1m: true`, tetapi OpenClaw tidak lagi mengirim
    header beta `context-1m-2025-08-07` yang sudah dihentikan. Entri konfigurasi `anthropicBeta` lama
    dengan nilai tersebut diabaikan selama resolusi header permintaan dan
    model Claude lama yang tidak didukung tetap menggunakan jendela konteks normalnya.

    `params.context1m: true` juga berlaku untuk backend Claude CLI
    (`claude-cli/*`) bagi model Opus dan Sonnet berkemampuan GA yang memenuhi syarat, mempertahankan
    jendela konteks runtime untuk sesi CLI tersebut agar cocok dengan perilaku
    API langsung.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Autentikasi token OAuth/langganan mempertahankan header beta Anthropic yang diwajibkan, tetapi OpenClaw menghapus header beta 1M yang sudah dihentikan jika masih ada dalam konfigurasi lama.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` dan varian `claude-cli`-nya memiliki jendela
    konteks 1M secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan 401 / token tiba-tiba tidak valid">
    Autentikasi token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ada kunci API ditemukan untuk penyedia "anthropic"'>
    Autentikasi Anthropic bersifat **per agen** — agen baru tidak mewarisi kunci agen utama. Jalankan ulang onboarding untuk agen tersebut (atau konfigurasikan kunci API pada host gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial ditemukan untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil autentikasi mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan kunci API untuk jalur profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil autentikasi yang tersedia (semua dalam cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown batas laju Anthropic dapat bersifat spesifik model, jadi model Anthropic saudara mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Penyiapan backend Claude CLI dan detail runtime.
  </Card>
  <Card title="Caching prompt" href="/id/reference/prompt-caching" icon="database">
    Cara kerja caching prompt di berbagai penyedia.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
