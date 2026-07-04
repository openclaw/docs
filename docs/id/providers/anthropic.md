---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:36:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua rute autentikasi:

- **Kunci API** — akses Anthropic API langsung dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** — gunakan kembali login Claude Code yang sudah ada pada host yang sama

<Warning>
Backend Claude CLI OpenClaw menjalankan Claude Code CLI yang terpasang dalam
mode cetak non-interaktif. Dokumentasi Claude Code Anthropic saat ini menjelaskan
`claude -p` sebagai penggunaan Agent SDK/terprogram. Pembaruan dukungan Anthropic pada 15 Juni 2026
menjeda perubahan penagihan Agent SDK yang diumumkan. Untuk saat ini, Anthropic mengatakan
penggunaan Claude Agent SDK, `claude -p`, dan aplikasi pihak ketiga masih mengambil dari
batas penggunaan langganan. Kredit Agent SDK bulanan yang sebelumnya diumumkan
tidak tersedia selama Anthropic merevisi rencana tersebut.

Claude Code interaktif tetap mengambil dari batas paket Claude yang sudah masuk. Autentikasi
kunci API tetap berupa penagihan API langsung bayar sesuai pemakaian. Untuk host gateway jangka panjang,
otomasi bersama, dan pengeluaran produksi yang dapat diprediksi, gunakan kunci API Anthropic.

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
    **Terbaik untuk:** akses API standar dan penagihan berbasis penggunaan.

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
      <Step title="Verifikasi model tersedia">
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
    **Terbaik untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa kunci API terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terpasang dan sudah masuk">
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
      <Step title="Verifikasi model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail penyiapan dan runtime untuk backend Claude CLI ada di [Backend CLI](/id/gateway/cli-backends).
    </Note>

    <Warning>
    Penggunaan kembali Claude CLI mengharapkan proses OpenClaw berjalan pada host yang sama dengan
    login Claude CLI. Instalasi Docker dapat mempertahankan home kontainer dan masuk ke
    Claude Code di sana; lihat
    [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).
    Instalasi kontainer lain seperti [Podman](/id/install/podman) tidak memasang
    `~/.claude` host ke penyiapan atau runtime; gunakan kunci API Anthropic di sana, atau pilih
    penyedia dengan OAuth yang dikelola OpenClaw seperti
    [OpenAI Codex](/id/providers/openai).
    </Warning>

    ### Contoh konfigurasi

    Lebih baik gunakan ref model Anthropic kanonis plus override runtime CLI:

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
    kompatibilitas, tetapi konfigurasi baru harus tetap menyimpan pilihan penyedia/model sebagai
    `anthropic/*` dan menaruh backend eksekusi dalam kebijakan runtime penyedia/model.

    ### Penagihan dan `claude -p`

    OpenClaw menggunakan jalur non-interaktif `claude -p` milik Claude Code untuk proses Claude CLI.
    Saat ini Anthropic memperlakukan jalur tersebut sebagai penggunaan Agent SDK/terprogram:

    - Pembaruan dukungan Anthropic pada 15 Juni 2026 menjeda rencana kredit Agent SDK
      terpisah yang sebelumnya diumumkan.
    - Untuk saat ini, penggunaan Claude Agent SDK pada paket langganan, `claude -p`, dan aplikasi
      pihak ketiga masih mengambil dari batas penggunaan langganan yang sudah masuk.
    - Kredit Agent SDK bulanan yang sebelumnya diumumkan tidak tersedia selama
      Anthropic merevisi rencana tersebut.
    - Login Console/kunci API menggunakan penagihan API bayar sesuai pemakaian dan tidak menerima
      kredit Agent SDK langganan.

    Lihat [artikel paket Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic untuk pemberitahuan jeda, dan artikel paket Claude Code untuk perilaku langganan
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    dan
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic dapat mengubah perilaku penagihan dan batas laju Claude Code tanpa rilis
    OpenClaw. Periksa `claude auth status`, `/status`, dan
    dokumentasi tertaut Anthropic saat prediktabilitas penagihan penting.

    <Tip>
    Untuk otomasi produksi bersama, gunakan kunci API Anthropic alih-alih
    Claude CLI. OpenClaw juga mendukung opsi bergaya langganan dari
    [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Default thinking (Claude Fable 5, 4.8, dan 4.6)

`anthropic/claude-fable-5` selalu menggunakan thinking adaptif dan default ke upaya `high`.
Karena Anthropic tidak mengizinkan thinking dinonaktifkan untuk model ini,
`/think off` dan `/think minimal` menggunakan upaya `low`. OpenClaw juga menghilangkan nilai
temperature kustom untuk permintaan Fable 5.

Claude Opus 4.8 menjaga thinking nonaktif secara default di OpenClaw. Saat Anda secara eksplisit mengaktifkan thinking adaptif dengan `/think high|xhigh|max`, OpenClaw mengirim nilai upaya Opus 4.8 Anthropic; model Claude 4.6 default ke `adaptive`.

Override per pesan dengan `/think:<level>` atau di parameter model:

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
- [Thinking diperpanjang](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback penolakan keselamatan (Claude Fable 5)

<Warning>
Menggunakan Claude Fable 5 berarti juga menggunakan Claude Opus 4.8. Fable 5 dikirim dengan
pengklasifikasi keselamatan yang dapat menolak permintaan, dan pemulihan yang disetujui Anthropic
adalah meminta `claude-opus-4-8` melayani giliran tersebut. OpenClaw ikut serta dalam ini
secara otomatis untuk permintaan kunci API langsung, sehingga beberapa giliran Fable dijawab
dan ditagih sebagai Claude Opus 4.8. Jika kebijakan atau anggaran Anda tidak dapat menerima
giliran yang dilayani Opus, jangan pilih `anthropic/claude-fable-5`.
</Warning>

### Mengapa ini ada

Pengklasifikasi Fable 5 mengembalikan `stop_reason: "refusal"` pada permintaan di domain
terbatas, dan juga salah positif pada pekerjaan yang berdekatan dengan benign (tooling
keamanan, ilmu hayati, atau bahkan meminta model mereproduksi penalaran mentahnya).
Tanpa fallback, giliran tersebut gagal dengan kesalahan meskipun
model Claude lain akan melayaninya dengan lancar — pesan penolakan Anthropic sendiri
memberi tahu integrator API untuk mengonfigurasi model fallback.

### Cara kerjanya

1. Untuk setiap permintaan kunci API langsung ke `anthropic/claude-fable-5`, OpenClaw
   mengirim opt-in fallback sisi server Anthropic: header beta
   `server-side-fallback-2026-06-01` plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 adalah satu-satunya
   target fallback yang diizinkan Anthropic untuk Fable 5.
2. Hanya penolakan pengklasifikasi keselamatan yang memicu fallback. Batas laju,
   overload, dan kesalahan server berperilaku persis seperti sebelumnya dan melalui
   [failover model](/id/concepts/model-failover) normal OpenClaw.
3. Penyelamatan terjadi di dalam panggilan yang sama. Penolakan sebelum output apa pun
   tidak terlihat selain latensi; seluruh jawaban berasal dari Opus 4.8. Pada
   penolakan di tengah streaming, teks parsial dipertahankan sebagai prefiks yang dilanjutkan
   model fallback, sementara penalaran dan panggilan alat model yang ditolak
   dibuang sesuai aturan replay Anthropic (tidak boleh digaungkan kembali atau
   dieksekusi).
4. Jika Claude Opus 4.8 juga menolak, giliran menampilkan penolakan sebagai
   kesalahan, persis seperti sebelum fitur ini.

Fallback terjadi pada level Anthropic API, sehingga `claude-opus-4-8` tidak
perlu ada dalam daftar model atau rantai fallback yang dikonfigurasi — kunci API
yang mendukung Fable selalu dapat melayani Opus.

### Observabilitas dan penagihan

- Giliran yang dilayani fallback mencatat diagnostik `provider_fallback` pada
  pesan asisten yang menamai `fromModel` dan `toModel`, dan `responseModel` pesan
  melaporkan `claude-opus-4-8`.
- Anthropic menagih per upaya: penolakan sebelum output gratis, dan penyelamatan
  ditagih dengan tarif Claude Opus 4.8 (saat ini setengah dari tarif Fable 5). Estimasi
  biaya per giliran OpenClaw memberi harga giliran yang dilayani fallback dengan tarif Opus agar sesuai.
- Penolakan di tengah streaming juga menagih parsial Fable yang sudah distream
  di sisi Anthropic; bagian tersebut dilaporkan dalam penggunaan per upaya API
  tetapi tidak dimasukkan ke estimasi per giliran OpenClaw.

### Cakupan

Berlaku untuk `anthropic/claude-fable-5` dengan autentikasi kunci API terhadap
`api.anthropic.com`. OAuth (penggunaan kembali langganan Claude CLI), URL dasar proksi,
permintaan Bedrock, Vertex, dan Foundry tidak berubah dan tetap menampilkan
penolakan sebagai kesalahan di sana.

Terverifikasi secara live: prompt benign yang meminta Fable 5 mereproduksi chain of thought
mentahnya ditolak dengan `category: "reasoning_extraction"` saat dikirim tanpa
fallback, dan prompt yang sama melalui OpenClaw mengembalikan jawaban normal yang dilayani Opus
dengan diagnostik `provider_fallback` terlampir.

Lihat [panduan penolakan dan fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
Anthropic untuk perilaku dasarnya.

## Caching prompt

OpenClaw mendukung fitur caching prompt Anthropic untuk autentikasi kunci API.

| Nilai               | Durasi cache | Deskripsi                              |
| ------------------- | ------------ | -------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan otomatis untuk autentikasi kunci API |
| `"long"`            | 1 jam        | Cache diperpanjang                     |
| `"none"`            | Tanpa caching | Nonaktifkan caching prompt             |

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
    Gunakan parameter level model sebagai baseline Anda, lalu override agen tertentu melalui `agents.list[].params`:

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

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas yang melonjak/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Bedrock Claude">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima pass-through `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga mengisi `cacheRetention: "short"` untuk referensi Claude-on-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Toggle `/fast` bersama OpenClaw mendukung lalu lintas Anthropic langsung (kunci API dan OAuth ke `api.anthropic.com`).

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
    - Parameter eksplisit `serviceTier` atau `service_tier` menimpa `/fast` saat keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
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

  <Accordion title="Jendela konteks 1M">
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
    header beta `context-1m-2025-08-07` yang sudah dihentikan. Entri konfigurasi `anthropicBeta`
    lama dengan nilai tersebut diabaikan selama resolusi header permintaan dan
    model Claude lama yang tidak didukung tetap berada pada jendela konteks normalnya.

    `params.context1m: true` juga berlaku untuk backend Claude CLI
    (`claude-cli/*`) untuk model Opus dan Sonnet berkemampuan GA yang memenuhi syarat, sehingga
    jendela konteks runtime untuk sesi CLI tersebut tetap sesuai dengan perilaku
    API langsung.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Autentikasi token OAuth/langganan mempertahankan header beta Anthropic yang diwajibkan, tetapi OpenClaw menghapus header beta 1M yang sudah dihentikan jika masih ada di konfigurasi lama.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` dan varian `claude-cli`-nya memiliki jendela konteks 1M
    secara default — tidak perlu `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan 401 / token tiba-tiba tidak valid">
    Autentikasi token Anthropic kedaluwarsa dan dapat dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ada kunci API yang ditemukan untuk penyedia "anthropic"'>
    Autentikasi Anthropic bersifat **per agen** — agen baru tidak mewarisi kunci agen utama. Jalankan ulang onboarding untuk agen tersebut (atau konfigurasikan kunci API pada host Gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ada kredensial yang ditemukan untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil autentikasi mana yang aktif. Jalankan ulang onboarding, atau konfigurasikan kunci API untuk path profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil autentikasi yang tersedia (semua dalam cooldown)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Cooldown batas laju Anthropic dapat bersifat spesifik model, sehingga model Anthropic saudara mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu cooldown.
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
    Cara kerja caching prompt di seluruh penyedia.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
