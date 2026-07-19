---
read_when:
    - Memilih atau mengganti model, mengonfigurasi alias
    - Men-debug failover model / "Semua model gagal"
    - Memahami profil autentikasi dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'FAQ: default model, pemilihan, alias, peralihan, failover, dan profil autentikasi'
title: 'FAQ: model dan autentikasi'
x-i18n:
    generated_at: "2026-07-19T05:08:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8c09012db311041fdec6ec4b78104dd720a7e69fdd1ca67ded1a4606cb0a5b3
    source_path: help/faq-models.md
    workflow: 16
---

Tanya jawab tentang model dan profil autentikasi. Untuk penyiapan, sesi, Gateway, kanal, dan
pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

## Model: default, pemilihan, alias, peralihan

<AccordionGroup>
  <Accordion title='Apa yang dimaksud dengan "model default"?'>
    Tetapkan dengan:

    ```text
    agents.defaults.model.primary
    ```

    Model adalah ref `provider/model` (contoh: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Selalu tetapkan `provider/model` secara eksplisit. Jika
    penyedia tidak dicantumkan, OpenClaw terlebih dahulu mencoba kecocokan alias, lalu
    kecocokan unik penyedia yang dikonfigurasi untuk id model tersebut, kemudian beralih ke
    penyedia default yang dikonfigurasi (jalur kompatibilitas yang tidak digunakan lagi). Jika
    penyedia tersebut tidak lagi memiliki model default yang dikonfigurasi, OpenClaw akan beralih
    ke penyedia/model pertama yang dikonfigurasi, bukan ke default yang sudah usang.

  </Accordion>

  <Accordion title="Model apa yang direkomendasikan?">
    Gunakan model generasi terbaru terkuat yang ditawarkan tumpukan penyedia Anda,
    terutama untuk agen dengan dukungan alat atau masukan yang tidak tepercaya — model yang lebih lemah atau
    terlalu terkuantisasi lebih rentan terhadap injeksi prompt dan perilaku
    yang tidak aman (lihat [Keamanan](/id/gateway/security)). Arahkan model yang lebih murah untuk
    percakapan rutin/berisiko rendah berdasarkan peran agen.

    Arahkan model per agen dan gunakan subagen untuk menjalankan tugas panjang secara paralel (setiap
    subagen menggunakan tokennya sendiri). Lihat [Model](/id/concepts/models),
    [Subagen](/id/tools/subagents), [MiniMax](/id/providers/minimax), dan
    [Model lokal](/id/gateway/local-models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus konfigurasi saya?">
    Ubah hanya bidang model — hindari mengganti seluruh konfigurasi.

    - `/model` dalam percakapan (per sesi, lihat [Perintah garis miring](/id/tools/slash-commands))
    - `openclaw models set ...` (hanya memperbarui konfigurasi model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` dalam `~/.openclaw/openclaw.json` secara langsung

    Untuk pengeditan RPC, periksa terlebih dahulu dengan `config.schema.lookup` (jalur yang
    dinormalisasi, dokumentasi skema ringkas, ringkasan turunan), lalu utamakan `config.patch`
    daripada `config.apply` dengan objek parsial. Jika konfigurasi terlanjur tertimpa,
    pulihkan dari cadangan atau jalankan `openclaw doctor` untuk memperbaikinya.

    Dokumentasi: [Model](/id/concepts/models), [Konfigurasi](/id/cli/configure),
    [Konfigurasi](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan model yang dihosting sendiri (llama.cpp, vLLM, Ollama)?">
    Ya — Ollama adalah jalur termudah. Penyiapan cepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal, misalnya `ollama pull gemma4`
    3. Untuk model cloud juga, jalankan `ollama signin`
    4. Jalankan `openclaw onboard`, pilih `Ollama`, lalu `Local` atau `Cloud + Local`

    `Cloud + Local` menyediakan model cloud beserta model Ollama lokal Anda;
    model cloud seperti `kimi-k2.5:cloud` tidak perlu ditarik secara lokal. Untuk beralih
    secara manual: `openclaw models list`, lalu `openclaw models set ollama/<model>`.

    Model yang lebih kecil/sangat terkuantisasi lebih rentan terhadap injeksi prompt.
    Gunakan model besar untuk setiap bot yang memiliki akses alat; jika tetap menggunakan model kecil,
    aktifkan sandbox dan daftar izin alat yang ketat.

    Dokumentasi: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Penyedia model](/id/concepts/model-providers), [Keamanan](/id/gateway/security),
    [Sandbox](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model secara langsung (tanpa memulai ulang)?">
    Kirim `/model <name>` sebagai pesan mandiri. Lihat
    [Perintah garis miring](/id/tools/slash-commands) untuk
    daftar lengkap perintah, termasuk pemilih bernomor (`/model`, `/model
    list`, `/model 3`), `/model default` untuk menghapus penggantian sesi, dan
    `/model status` untuk detail titik akhir/mode API.

    Paksa profil autentikasi tertentu per sesi dengan `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Untuk melepas sematan profil yang ditetapkan dengan `@profile`, jalankan kembali `/model` tanpa
    sufiks (misalnya `/model anthropic/claude-opus-4-6`), atau pilih default dari
    `/model`. Gunakan `/model status` untuk mengonfirmasi profil autentikasi aktif.

  </Accordion>

  <Accordion title="Jika dua penyedia mengekspos id model yang sama, penyedia mana yang digunakan /model?">
    `/model provider/model` memilih rute penyedia tersebut secara tepat. Misalnya,
    `qianfan/deepseek-v4-flash` dan `deepseek/deepseek-v4-flash` adalah ref yang berbeda
    meskipun id modelnya sama — OpenClaw tidak diam-diam mengganti
    penyedia hanya berdasarkan kecocokan id.

    Ref `/model` yang dipilih pengguna menerapkan fallback secara ketat: jika
    penyedia/model tersebut tidak tersedia, balasan akan gagal secara jelas alih-alih
    beralih ke `agents.defaults.model.fallbacks`. Rantai fallback yang
    dikonfigurasi tetap berlaku untuk default yang dikonfigurasi, model utama tugas Cron, dan
    status fallback yang dipilih otomatis. Ketika proses tanpa penggantian sesi diizinkan
    menggunakan fallback, OpenClaw terlebih dahulu mencoba penyedia/model yang diminta, lalu
    fallback yang dikonfigurasi, kemudian model utama yang dikonfigurasi — sehingga id model
    tanpa penyedia yang duplikat tidak pernah langsung kembali ke penyedia default.

    Lihat [Model](/id/concepts/models) dan [Failover model](/id/concepts/model-failover).

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan GPT 5.5 untuk tugas sehari-hari dan Codex 5.5 untuk pemrograman?">
    Ya — pemilihan model dan pemilihan runtime merupakan hal yang terpisah:

    - **Agen pemrograman Codex native:** tetapkan `agents.defaults.model.primary` ke
      `openai/gpt-5.5`. Masuk dengan `openclaw models auth login --provider
      openai` untuk autentikasi langganan ChatGPT/Codex.
    - **Tugas OpenAI API langsung di luar perulangan agen:** konfigurasikan
      `OPENAI_API_KEY` untuk gambar, embedding, ucapan, waktu nyata, dan permukaan
      OpenAI API nonagen lainnya.
    - **Autentikasi kunci API agen OpenAI:** `/model openai/gpt-5.5` dengan profil
      kunci API `openai` yang terurut.
    - **Subagen:** arahkan tugas pemrograman ke agen yang berfokus pada Codex dengan
      model `openai/gpt-5.5` miliknya sendiri.

    Lihat [Model](/id/concepts/models) dan [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi mode cepat untuk GPT 5.5?">
    - **Per sesi:** kirim `/fast on` saat menggunakan `openai/gpt-5.5`.
    - **Default per model:** tetapkan
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` ke `true`.
    - **Batas otomatis:** `/fast auto` atau `params.fastMode: "auto"` menjalankan panggilan
      model baru dalam mode cepat hingga batas tercapai, lalu menjalankan panggilan percobaan ulang, fallback,
      hasil alat, atau kelanjutan berikutnya tanpa mode cepat. Batas default adalah
      60 detik; ganti dengan `params.fastAutoOnSeconds` pada model.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    Mode cepat dipetakan ke `service_tier = "priority"` pada permintaan OpenAI Responses
    native; nilai `service_tier` yang sudah ada dipertahankan dan mode cepat tidak
    menulis ulang `reasoning` atau `text.verbosity`. Penggantian `/fast` sesi mengungguli
    default konfigurasi.

    Lihat [Penalaran dan mode cepat](/id/tools/thinking) serta bagian Mode cepat
    di bawah Konfigurasi lanjutan pada halaman penyedia
    [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... tidak diizinkan" lalu tidak ada balasan?'>
    Jika `agents.defaults.modelPolicy.allow` tidak kosong, nilai tersebut menjadi
    **daftar izin** untuk `/model`, penggantian sesi, dan `--model`. Memilih model di luar daftar tersebut akan menghasilkan
    pesan berikut, bukan balasan normal:

    ```text
    Penggantian model "provider/model" tidak diizinkan oleh agents.defaults.modelPolicy.allow.
    ```

    Perbaikan: tambahkan model yang tepat atau wildcard penyedia seperti `"provider/*"` ke
    daftar `modelPolicy.allow` yang disebutkan, hapus/kosongkan daftar tersebut, atau pilih model
    dari `/model list`. Jika perintah juga
    menyertakan `--runtime codex`, perbarui daftar izin terlebih dahulu, lalu coba lagi
    perintah `/model provider/model --runtime codex` yang sama.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model tidak dikenal: minimax/MiniMax-M3"?'>
    Jika Anda menggunakan rilis OpenClaw lama, tingkatkan terlebih dahulu (atau jalankan dari sumber
    `main`) dan mulai ulang Gateway — `MiniMax-M3` mungkin belum ada dalam
    katalog rilis yang terinstal. Jika tidak, penyedia MiniMax belum
    dikonfigurasi (tidak ditemukan entri penyedia atau profil autentikasi), sehingga model tidak dapat
    diresolusi. Lihat bagian Pemecahan Masalah pada halaman penyedia
    [MiniMax](/id/providers/minimax) untuk daftar periksa perbaikan lengkap,
    tabel id penyedia/model, dan contoh blok konfigurasi.

  </Accordion>

  <Accordion title="Dapatkah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan MiniMax sebagai default dan ganti model per sesi — fallback
    digunakan untuk kesalahan, bukan "tugas sulit", jadi gunakan `/model` atau agen terpisah.

    **Opsi A: ganti per sesi**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Kemudian `/model gpt`.

    **Opsi B: agen terpisah** — Agen A menggunakan MiniMax secara default, Agen B
    menggunakan OpenAI secara default; arahkan berdasarkan agen atau gunakan `/agent` untuk beralih.

    Dokumentasi: [Model](/id/concepts/models), [Perutean Multiagen](/id/concepts/multi-agent),
    [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt merupakan pintasan bawaan?">
    Ya — singkatan bawaan yang hanya diterapkan ketika model target tersedia dalam
    `agents.defaults.models`:

    | Alias | Diresolusi menjadi |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Alias Anda sendiri dengan nama yang sama akan menggantikan alias bawaan.

  </Accordion>

  <Accordion title="Bagaimana cara menentukan/mengganti pintasan model (alias)?">
    Alias berada di `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Setelah itu, `/model sonnet` (atau `/<alias>` jika didukung) diresolusi ke
    id model tersebut.

  </Accordion>

  <Accordion title="Bagaimana cara menambahkan model dari penyedia lain seperti OpenRouter atau Z.AI?">
    OpenRouter (bayar per token; banyak model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (model GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Kunci penyedia yang tidak tersedia untuk penyedia/model yang dirujuk akan memunculkan kesalahan
    autentikasi runtime (misalnya `No API key found for provider "zai"`).

    **Tidak ditemukan kunci API untuk penyedia setelah menambahkan agen baru**

    Agen baru memiliki penyimpanan autentikasi kosong — autentikasi disimpan per agen di:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Perbaikan: jalankan `openclaw agents add <id>` dan konfigurasikan autentikasi di wizard, atau
    salin hanya profil statis portabel `api_key`/`token` dari penyimpanan
    agen utama. Untuk OAuth, masuk dari agen baru saat agen tersebut memerlukan
    akunnya sendiri. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent) untuk
    aturan lengkap penggunaan kembali `agentDir` dan berbagi kredensial — jangan pernah menggunakan kembali
    `agentDir` di antara agen.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Dua tahap:

    1. **Rotasi profil autentikasi** dalam penyedia yang sama.
    2. **Fallback model** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

    Masa jeda berlaku untuk profil yang gagal (backoff eksponensial), sehingga OpenClaw
    tetap merespons saat penyedia terkena pembatasan laju atau mengalami kegagalan sementara.

    Bucket pembatasan laju mencakup lebih dari sekadar `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) semuanya dianggap sebagai
    pembatasan laju yang memerlukan failover.

    Respons penagihan tidak selalu berupa `402`, dan beberapa `402` tetap berada dalam
    bucket sementara/pembatasan laju, bukan jalur penagihan. Teks
    penagihan eksplisit pada `401`/`403` tetap dapat diarahkan ke penagihan; pencocok
    teks khusus penyedia (misalnya OpenRouter `Key limit exceeded`) tetap dibatasi pada
    penyedianya sendiri. `402` yang tampak seperti jendela penggunaan yang dapat dicoba ulang atau
    batas pengeluaran organisasi/ruang kerja (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) diperlakukan sebagai `rate_limit`, bukan
    penonaktifan penagihan jangka panjang.

    Error luapan konteks sama sekali tidak masuk ke jalur fallback — pola
    seperti `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model`, atau `ollama error: context length exceeded` diarahkan ke
    Compaction/percobaan ulang, bukan melanjutkan fallback model.

    Teks error server generik memiliki cakupan yang lebih sempit daripada "apa pun yang memuat unknown/error
    di dalamnya". Bentuk sementara yang dibatasi pada penyedia dan dianggap sebagai sinyal
    failover: `An unknown error occurred` polos dari Anthropic, `Provider returned error` polos dari
    OpenRouter, error alasan penghentian seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server sementara (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`),
    serta error penyedia sibuk seperti `ModelNotReadyException` saat konteks penyedia
    cocok. Teks fallback internal generik seperti `LLM request failed
    with an unknown error.` tetap ditangani secara konservatif dan tidak memicu fallback
    dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "Tidak ditemukan kredensial untuk profil anthropic:default"?'>
    ID profil autentikasi `anthropic:default` tidak memiliki kredensial dalam
    penyimpanan autentikasi yang diharapkan.

    **Daftar periksa perbaikan:**

    - Konfirmasikan lokasi profil — saat ini:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; lama:
      `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).
    - Konfirmasikan bahwa Gateway memuat variabel lingkungan Anda. `ANTHROPIC_API_KEY` yang hanya ditetapkan di
      shell Anda tidak akan mencapai Gateway yang dijalankan melalui systemd/launchd — masukkan ke
      `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - Konfirmasikan bahwa Anda mengedit agen yang benar — konfigurasi multi-agen memiliki
      beberapa file `auth-profiles.json`.
    - Jalankan `openclaw models status` untuk melihat model yang dikonfigurasi dan status
      autentikasi penyedia.

    **Untuk "Tidak ditemukan kredensial untuk profil anthropic" (tanpa akhiran email):**

    Proses tersebut dikunci ke profil Anthropic yang tidak dapat ditemukan Gateway.

    - Gunakan Claude CLI: jalankan `openclaw models auth login --provider anthropic
      --method cli --set-default` pada host gateway.
    - Jika lebih memilih kunci API: masukkan `ANTHROPIC_API_KEY` ke
      `~/.openclaw/.env` pada host gateway, lalu hapus urutan terkunci
      yang memaksakan profil yang hilang:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Mode jarak jauh: profil autentikasi berada di mesin gateway, bukan laptop
      Anda — pastikan Anda menjalankan perintah di sana.

  </Accordion>

  <Accordion title="Mengapa Google Gemini juga dicoba dan gagal?">
    Jika konfigurasi model Anda menyertakan Google Gemini sebagai fallback (atau Anda
    beralih ke bentuk singkat Gemini), OpenClaw akan mencobanya saat fallback. Tidak adanya
    kredensial Google yang dikonfigurasi menghasilkan `No API key found for provider
    "google"`. Perbaikan: tambahkan autentikasi Google, atau hapus model Google dari
    `agents.defaults.model.fallbacks`/alias.

    **Permintaan LLM ditolak: tanda tangan pemikiran diperlukan (Google Antigravity)**

    Penyebab: riwayat sesi memiliki blok pemikiran tanpa tanda tangan (sering kali
    akibat stream yang dibatalkan/tidak lengkap); Google Antigravity mewajibkan tanda tangan
    pada blok pemikiran. OpenClaw menghapus blok pemikiran tanpa tanda tangan untuk Google
    Antigravity Claude; jika masih muncul, mulai sesi baru atau tetapkan
    `/thinking off` untuk agen tersebut.

  </Accordion>
</AccordionGroup>

## Profil autentikasi: pengertian dan cara mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil autentikasi?">
    Catatan kredensial bernama (OAuth atau kunci API) yang terkait dengan penyedia, disimpan
    di:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Periksa profil tersimpan tanpa menampilkan rahasia: `openclaw models auth
    list` (opsional `--provider <id>` atau `--json`). Lihat
    [CLI Model](/id/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Apa saja ID profil yang umum?">
    Diawali penyedia: `anthropic:default` (umum saat tidak ada identitas email),
    `anthropic:<email>` untuk identitas OAuth, atau ID khusus yang Anda
    pilih (misalnya `anthropic:work`).

  </Accordion>

  <Accordion title="Dapatkah saya mengatur profil autentikasi mana yang dicoba terlebih dahulu?">
    Ya. Konfigurasi `auth.order.<provider>` menetapkan urutan rotasi per penyedia
    (hanya metadata — tidak ada rahasia yang disimpan).

    OpenClaw dapat melewati profil yang sedang dalam **masa jeda** singkat (pembatasan laju,
    batas waktu, kegagalan autentikasi) atau status **dinonaktifkan** yang lebih lama
    (penagihan/kredit tidak mencukupi). Periksa dengan `openclaw models status
    --json` dan lihat `auth.unusableProfiles`. Sesuaikan dengan
    `auth.cooldowns.billingBackoffHours*`. Masa jeda pembatasan laju dapat
    dibatasi per model — profil yang sedang dalam masa jeda untuk satu model masih dapat melayani
    model lain pada penyedia yang sama; jendela penagihan/penonaktifan memblokir
    seluruh profil.

    Tetapkan penggantian urutan per agen (disimpan dalam `auth-state.json` milik agen tersebut):

    ```bash
    # Secara default menggunakan agen bawaan yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profil
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback dalam penyedia)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Hapus penggantian (kembali ke auth.order konfigurasi / round-robin)
    openclaw models auth order clear --provider anthropic

    # Targetkan agen tertentu
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifikasi apa yang benar-benar akan dicoba: `openclaw models status --probe`. Profil
    tersimpan yang tidak disertakan dalam urutan eksplisit akan melaporkan
    `excluded_by_auth_order`, bukan dicoba secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs kunci API - apa perbedaannya?">
    - **OAuth / login CLI** sering menggunakan akses langganan jika
      penyedia mendukungnya. Untuk Anthropic, backend Claude CLI milik OpenClaw
      menggunakan Claude Code `claude -p`, yang saat ini diperlakukan Anthropic sebagai
      penggunaan Agent SDK/terprogram yang mengambil dari batas penggunaan langganan —
      lihat [Anthropic](/id/providers/anthropic) untuk status jeda penagihan
      terkini dan tautan sumber.
    - **Kunci API** menggunakan penagihan per token.

    Wizard mendukung Anthropic Claude CLI, OAuth OpenAI Codex, dan kunci
    API.

  </Accordion>
</AccordionGroup>

## Terkait

- [Tanya Jawab Umum](/id/help/faq) — Tanya Jawab Umum utama
- [Tanya Jawab Umum — mulai cepat dan penyiapan penggunaan pertama](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
