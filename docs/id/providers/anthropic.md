---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:01:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membuat keluarga model **Claude**. OpenClaw mendukung dua rute autentikasi:

- **Kunci API** — akses langsung ke Anthropic API dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan ulang login Claude Code yang sudah ada di host yang sama

<Warning>
Backend Claude CLI OpenClaw menjalankan Claude Code CLI yang terpasang dalam
mode cetak noninteraktif. Dokumentasi Claude Code Anthropic saat ini menjelaskan
`claude -p` sebagai penggunaan Agent SDK/programatik. Mulai 15 Juni 2026, Anthropic
mengatakan penggunaan `claude -p` pada paket langganan tidak lagi mengambil dari batas paket
Claude normal; penggunaan tersebut mengambil dari kredit Agent SDK bulanan terpisah terlebih dahulu, lalu dari
kredit penggunaan dengan tarif API standar saat kredit tersebut diaktifkan.

Claude Code interaktif tetap mengambil dari batas paket Claude yang sedang login. Autentikasi
kunci API tetap berupa penagihan API langsung sesuai pemakaian. Untuk host gateway yang berjalan lama,
otomasi bersama, dan pengeluaran produksi yang dapat diprediksi, gunakan kunci API Anthropic.

Dokumentasi publik Anthropic saat ini:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Gunakan Claude Agent SDK dengan paket Claude Anda](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Gunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Gunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Kelola biaya Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Memulai

<Tabs>
  <Tab title="API key">
    **Paling cocok untuk:** akses API standar dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Get your API key">
        Buat kunci API di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Atau berikan kuncinya secara langsung:

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Paling cocok untuk:** menggunakan ulang login Claude CLI yang sudah ada tanpa kunci API terpisah.

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

    <Warning>
    Penggunaan ulang Claude CLI mengharuskan proses OpenClaw berjalan pada host yang sama dengan
    login Claude CLI. Instalasi Docker dapat mempertahankan home kontainer dan login ke
    Claude Code di sana; lihat
    [backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).
    Instalasi kontainer lain seperti [Podman](/id/install/podman) tidak memasang
    `~/.claude` host ke dalam penyiapan atau runtime; gunakan kunci API Anthropic di sana, atau pilih
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
    kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model sebagai
    `anthropic/*` dan menempatkan backend eksekusi di kebijakan runtime penyedia/model.

    ### Penagihan dan `claude -p`

    OpenClaw menggunakan jalur `claude -p` noninteraktif Claude Code untuk
    eksekusi Claude CLI. Anthropic saat ini memperlakukan jalur tersebut sebagai penggunaan Agent SDK/programatik:

    - Hingga 15 Juni 2026, penanganan paket langganan mengikuti aturan Claude Code
      aktif Anthropic untuk akun yang sedang login.
    - Mulai 15 Juni 2026, penggunaan `claude -p` pada paket langganan mengambil dari
      kredit Agent SDK bulanan pengguna terlebih dahulu, lalu dari kredit penggunaan dengan tarif
      API standar jika kredit penggunaan diaktifkan.
    - Login Console/kunci API menggunakan penagihan API sesuai pemakaian dan tidak menerima
      kredit Agent SDK langganan.

    Anthropic dapat mengubah penagihan Claude Code dan perilaku batas laju tanpa
    rilis OpenClaw. Periksa `claude auth status`, `/status`, dan
    dokumentasi Anthropic yang tertaut saat prediktabilitas penagihan penting.

    <Tip>
    Untuk otomasi produksi bersama, gunakan kunci API Anthropic, bukan
    Claude CLI. OpenClaw juga mendukung opsi bergaya langganan dari
    [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Default berpikir (Claude Fable 5, 4.8, dan 4.6)

`anthropic/claude-fable-5` selalu menggunakan berpikir adaptif dan default ke upaya `high`.
Karena Anthropic tidak mengizinkan berpikir dinonaktifkan untuk model ini,
`/think off` dan `/think minimal` menggunakan upaya `low`. OpenClaw juga menghilangkan nilai
temperature kustom untuk permintaan Fable 5.

Claude Opus 4.8 mempertahankan berpikir nonaktif secara default di OpenClaw. Saat Anda secara eksplisit mengaktifkan berpikir adaptif dengan `/think high|xhigh|max`, OpenClaw mengirim nilai upaya Opus 4.8 Anthropic; model Claude 4.6 default ke `adaptive`.

Override per pesan dengan `/think:<level>` atau dalam parameter model:

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
- [Berpikir adaptif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Berpikir diperluas](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Caching prompt

OpenClaw mendukung fitur caching prompt Anthropic untuk autentikasi kunci API.

| Nilai               | Durasi cache | Deskripsi                                      |
| ------------------- | ------------ | ---------------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk autentikasi kunci API |
| `"long"`            | 1 jam        | Cache diperpanjang                             |
| `"none"`            | Tanpa caching | Nonaktifkan caching prompt                    |

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
    Gunakan parameter tingkat model sebagai baseline Anda, lalu override agen tertentu melalui `agents.list[].params`:

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
    2. `agents.list[].params` (`id` yang cocok, meng-override berdasarkan kunci)

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas bursty/berpenggunaan ulang rendah.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default pintar kunci API juga mengisi awal `cacheRetention: "short"` untuk ref Claude-on-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Fast mode">
    Toggle bersama `/fast` OpenClaw mendukung lalu lintas Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

    | Perintah | Dipetakan ke |
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
    - Hanya disuntikkan untuk permintaan langsung `api.anthropic.com`. Rute proxy membiarkan `service_tier` tidak tersentuh.
    - Parameter eksplisit `serviceTier` atau `service_tier` meng-override `/fast` saat keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    menyelesaikan kapabilitas media secara otomatis dari autentikasi Anthropic yang dikonfigurasi — tidak
    diperlukan konfigurasi tambahan.

    | Properti        | Nilai                 |
    | --------------- | --------------------- |
    | Model default   | `claude-opus-4-8`     |
    | Input didukung  | Gambar, dokumen PDF   |

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

    Konfigurasi lama dapat mempertahankan `params.context1m: true`, tetapi OpenClaw tidak lagi mengirim
    header beta `context-1m-2025-08-07` yang sudah pensiun. Entri konfigurasi `anthropicBeta` lama
    dengan nilai tersebut diabaikan selama resolusi header permintaan dan
    model Claude lama yang tidak didukung tetap berada pada jendela konteks normalnya.

    `params.context1m: true` juga berlaku untuk backend Claude CLI
    (`claude-cli/*`) untuk model Opus dan Sonnet berkemampuan GA yang memenuhi syarat, sehingga mempertahankan
    jendela konteks runtime untuk sesi CLI tersebut agar sesuai dengan perilaku
    API langsung.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Autentikasi token OAuth/langganan mempertahankan header beta Anthropic yang diwajibkan, tetapi OpenClaw menghapus header beta 1M yang sudah pensiun jika masih ada dalam konfigurasi lama.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` dan varian `claude-cli`-nya memiliki jendela konteks 1M
    secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Autentikasi token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ada kunci API yang ditemukan untuk provider "anthropic"'>
    Autentikasi Anthropic bersifat **per agen** — agen baru tidak mewarisi kunci milik agen utama. Jalankan kembali onboarding untuk agen tersebut (atau konfigurasikan kunci API di host Gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial yang ditemukan untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil autentikasi mana yang aktif. Jalankan kembali onboarding, atau konfigurasikan kunci API untuk path profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil autentikasi yang tersedia (semua dalam masa tunggu)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Masa tunggu batas laju Anthropic dapat dicakup per model, sehingga model Anthropic lain yang sepadan mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu hingga masa tunggu selesai.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Penyiapan backend Claude CLI dan detail runtime.
  </Card>
  <Card title="Caching prompt" href="/id/reference/prompt-caching" icon="database">
    Cara kerja caching prompt di seluruh provider.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
