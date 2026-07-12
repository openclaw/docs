---
read_when:
    - Memilih atau mengganti model, mengonfigurasi alias
    - Men-debug failover model / "Semua model gagal"
    - Memahami profil autentikasi dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'FAQ: default model, pemilihan, alias, peralihan, failover, dan profil autentikasi'
title: 'FAQ: model dan autentikasi'
x-i18n:
    generated_at: "2026-07-12T14:15:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Tanya jawab model dan profil autentikasi. Untuk penyiapan, sesi, Gateway, saluran, dan
  pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Model: default, pemilihan, alias, peralihan

  <AccordionGroup>
  <Accordion title='Apa itu "model default"?'>
    Atur dengan:

    ```text
    agents.defaults.model.primary
    ```

    Model adalah referensi `provider/model` (contoh: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Selalu tetapkan `provider/model` secara eksplisit. Jika
    Anda menghilangkan penyedia, OpenClaw terlebih dahulu mencoba mencocokkan alias, lalu
    mencocokkan model tersebut dengan penyedia terkonfigurasi yang unik, kemudian kembali
    ke penyedia default yang dikonfigurasi (jalur kompatibilitas yang tidak digunakan lagi).
    Jika penyedia tersebut tidak lagi memiliki model default yang dikonfigurasi, OpenClaw
    akan beralih ke penyedia/model pertama yang dikonfigurasi, bukan menggunakan default
    yang sudah usang.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    Gunakan model generasi terbaru terkuat yang ditawarkan tumpukan penyedia Anda,
    terutama untuk agen dengan dukungan alat atau masukan yang tidak tepercaya — model
    yang lebih lemah atau terlalu terkuantisasi lebih rentan terhadap injeksi prompt dan
    perilaku tidak aman (lihat [Keamanan](/id/gateway/security)). Arahkan model yang lebih
    murah ke percakapan rutin/berisiko rendah berdasarkan peran agen.

    Arahkan model per agen dan gunakan subagen untuk memparalelkan tugas panjang (setiap
    subagen menggunakan tokennya sendiri). Lihat [Model](/id/concepts/models),
    [Subagen](/id/tools/subagents), [MiniMax](/id/providers/minimax), dan
    [Model lokal](/id/gateway/local-models).

  </Accordion>

  <Accordion title="Bagaimana cara beralih model tanpa menghapus konfigurasi saya?">
    Ubah hanya kolom model — hindari mengganti seluruh konfigurasi.

    - `/model` dalam percakapan (per sesi, lihat [Perintah garis miring](/id/tools/slash-commands))
    - `openclaw models set ...` (hanya memperbarui konfigurasi model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` langsung di `~/.openclaw/openclaw.json`

    Untuk pengeditan RPC, periksa terlebih dahulu dengan `config.schema.lookup` (jalur
    yang dinormalisasi, dokumentasi skema ringkas, ringkasan anak), lalu utamakan
    `config.patch` daripada `config.apply` dengan objek parsial. Jika Anda terlanjur
    menimpa konfigurasi, pulihkan dari cadangan atau jalankan `openclaw doctor` untuk
    memperbaikinya.

    Dokumentasi: [Model](/id/concepts/models), [Konfigurasi](/id/cli/configure),
    [Konfigurasi](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang dihosting sendiri (llama.cpp, vLLM, Ollama)?">
    Ya — Ollama adalah jalur termudah. Penyiapan cepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal, misalnya `ollama pull gemma4`
    3. Untuk model cloud juga, jalankan `ollama signin`
    4. Jalankan `openclaw onboard`, pilih `Ollama`, lalu `Local` atau `Cloud + Local`

    `Cloud + Local` memberi Anda model cloud sekaligus model Ollama lokal;
    model cloud seperti `kimi-k2.5:cloud` tidak perlu ditarik secara lokal. Untuk beralih
    secara manual: `openclaw models list`, lalu `openclaw models set ollama/<model>`.

    Model yang lebih kecil/sangat terkuantisasi lebih rentan terhadap injeksi prompt.
    Gunakan model besar untuk bot apa pun yang memiliki akses alat; jika Anda tetap
    menggunakan model kecil, aktifkan sandbox dan daftar izin alat yang ketat.

    Dokumentasi: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Penyedia model](/id/concepts/model-providers), [Keamanan](/id/gateway/security),
    [Sandbox](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Bagaimana cara beralih model secara langsung (tanpa memulai ulang)?">
    Kirim `/model <name>` sebagai pesan tersendiri. Lihat
    [Perintah garis miring](/id/tools/slash-commands) untuk
    daftar perintah lengkap, termasuk pemilih bernomor (`/model`, `/model
    list`, `/model 3`), `/model default` untuk menghapus penggantian sesi, dan
    `/model status` untuk detail titik akhir/mode API.

    Paksa profil autentikasi tertentu per sesi dengan `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Untuk melepas sematan profil yang ditetapkan dengan `@profile`, jalankan kembali
    `/model` tanpa akhiran (misalnya `/model anthropic/claude-opus-4-6`), atau pilih
    default dari `/model`. Gunakan `/model status` untuk mengonfirmasi profil
    autentikasi yang aktif.

  </Accordion>

  <Accordion title="Jika dua penyedia menawarkan ID model yang sama, penyedia mana yang digunakan /model?">
    `/model provider/model` memilih rute penyedia tersebut secara tepat. Misalnya,
    `qianfan/deepseek-v4-flash` dan `deepseek/deepseek-v4-flash` adalah referensi yang
    berbeda meskipun ID modelnya sama — OpenClaw tidak beralih penyedia secara diam-diam
    hanya berdasarkan kecocokan ID.

    Referensi `/model` yang dipilih pengguna bersifat ketat untuk pengalihan cadangan:
    jika penyedia/model tersebut tidak tersedia, balasan akan gagal secara terlihat dan
    tidak beralih ke `agents.defaults.model.fallbacks`. Rantai cadangan yang dikonfigurasi
    tetap berlaku untuk default terkonfigurasi, model utama tugas Cron, dan status
    cadangan yang dipilih otomatis. Ketika eksekusi tanpa penggantian sesi diizinkan
    menggunakan cadangan, OpenClaw terlebih dahulu mencoba penyedia/model yang diminta,
    lalu cadangan terkonfigurasi, kemudian model utama terkonfigurasi — sehingga ID model
    biasa yang duplikat tidak pernah langsung kembali ke penyedia default.

    Lihat [Model](/id/concepts/models) dan [Pengalihan model](/id/concepts/model-failover).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.5 untuk tugas harian dan Codex 5.5 untuk pemrograman?">
    Ya — pilihan model dan pilihan runtime merupakan hal yang terpisah:

    - **Agen pemrograman Codex native:** atur `agents.defaults.model.primary` ke
      `openai/gpt-5.5`. Masuk dengan `openclaw models auth login --provider
      openai` untuk autentikasi langganan ChatGPT/Codex.
    - **Tugas OpenAI API langsung di luar loop agen:** konfigurasi
      `OPENAI_API_KEY` untuk gambar, embedding, ucapan, waktu nyata, dan
      antarmuka OpenAI API nonagen lainnya.
    - **Autentikasi kunci API agen OpenAI:** `/model openai/gpt-5.5` dengan profil
      kunci API `openai` yang terurut.
    - **Subagen:** arahkan tugas pemrograman ke agen yang berfokus pada Codex dengan
      model `openai/gpt-5.5` miliknya sendiri.

    Lihat [Model](/id/concepts/models) dan [Perintah garis miring](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi mode cepat untuk GPT 5.5?">
    - **Per sesi:** kirim `/fast on` saat menggunakan `openai/gpt-5.5`.
    - **Default per model:** atur
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` ke `true`.
    - **Batas waktu otomatis:** `/fast auto` atau `params.fastMode: "auto"` menjalankan
      pemanggilan model baru dalam mode cepat hingga batas waktu, lalu menjalankan
      pemanggilan percobaan ulang, cadangan, hasil alat, atau lanjutan tanpa mode cepat.
      Batas waktu default adalah 60 detik; ganti dengan `params.fastAutoOnSeconds` pada
      model.

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

    Lihat [Pemikiran dan mode cepat](/id/tools/thinking) dan bagian Mode cepat
    di bawah Konfigurasi lanjutan pada halaman penyedia [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... tidak diizinkan" lalu tidak mendapat balasan?'>
    Jika `agents.defaults.models` ditetapkan, kolom tersebut menjadi **daftar izin** untuk
    `/model` dan penggantian sesi. Memilih model di luar daftar tersebut akan menghasilkan
    pesan ini sebagai ganti balasan normal:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Perbaikan: tambahkan model yang tepat ke `agents.defaults.models`, tambahkan wildcard
    penyedia seperti `"provider/*": {}` untuk katalog dinamis, hapus daftar izin, atau
    pilih model dari `/model list`. Jika perintah juga menyertakan `--runtime codex`,
    perbarui daftar izin terlebih dahulu, lalu coba kembali perintah
    `/model provider/model --runtime codex` yang sama.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model tidak dikenal: minimax/MiniMax-M3"?'>
    Jika Anda menggunakan rilis OpenClaw yang lebih lama, tingkatkan terlebih dahulu
    (atau jalankan dari sumber `main`) dan mulai ulang Gateway — `MiniMax-M3` mungkin
    belum tercantum dalam katalog rilis yang Anda instal. Jika tidak, penyedia MiniMax
    belum dikonfigurasi (entri penyedia atau profil autentikasi tidak ditemukan), sehingga
    model tidak dapat diresolusikan. Lihat bagian Pemecahan masalah pada halaman penyedia
    [MiniMax](/id/providers/minimax) untuk daftar periksa perbaikan lengkap,
    tabel ID penyedia/model, dan contoh blok konfigurasi.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan MiniMax sebagai default dan beralih model per sesi — cadangan digunakan
    untuk kesalahan, bukan "tugas sulit", jadi gunakan `/model` atau agen terpisah.

    **Opsi A: beralih per sesi**

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

    **Opsi B: agen terpisah** — Agen A menggunakan MiniMax sebagai default, Agen B
    menggunakan OpenAI sebagai default; arahkan berdasarkan agen atau gunakan `/agent`
    untuk beralih.

    Dokumentasi: [Model](/id/concepts/models), [Perutean Multi-Agen](/id/concepts/multi-agent),
    [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt merupakan pintasan bawaan?">
    Ya — singkatan bawaan, hanya diterapkan ketika model target ada di
    `agents.defaults.models`:

    | Alias | Diresolusikan menjadi |
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

  <Accordion title="Bagaimana cara mendefinisikan/mengganti pintasan model (alias)?">
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

    Kemudian `/model sonnet` (atau `/<alias>` jika didukung) diresolusikan ke
    ID model tersebut.

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

    Ketiadaan kunci penyedia untuk penyedia/model yang dirujuk akan memunculkan kesalahan
    autentikasi runtime (misalnya `No API key found for provider "zai"`).

    **Kunci API untuk penyedia tidak ditemukan setelah menambahkan agen baru**

    Agen baru memiliki penyimpanan autentikasi kosong — autentikasi disimpan per agen di:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Perbaikan: jalankan `openclaw agents add <id>` dan konfigurasikan autentikasi di wizard, atau
    salin hanya profil statis portabel `api_key`/`token` dari penyimpanan agen
    utama. Untuk OAuth, masuklah dari agen baru saat agen tersebut memerlukan
    akunnya sendiri. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent) untuk
    aturan lengkap penggunaan kembali `agentDir` dan berbagi kredensial — jangan pernah menggunakan kembali
    `agentDir` di beberapa agen.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Dua tahap:

    1. **Rotasi profil autentikasi** dalam penyedia yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Masa jeda berlaku pada profil yang gagal (backoff eksponensial), sehingga OpenClaw
    tetap merespons saat penyedia terkena pembatasan laju atau mengalami kegagalan sementara.

    Kelompok pembatasan laju mencakup lebih dari sekadar `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted`, dan batas berkala
    jendela penggunaan (`weekly/monthly limit reached`) semuanya dianggap sebagai
    pembatasan laju yang layak memicu failover.

    Respons penagihan tidak selalu berupa `402`, dan beberapa `402` tetap masuk
    kelompok sementara/pembatasan laju, bukan jalur penagihan. Teks penagihan yang eksplisit
    pada `401`/`403` masih dapat diarahkan ke penagihan; pencocok teks khusus
    penyedia (misalnya `Key limit exceeded` dari OpenRouter) tetap terbatas pada
    penyedianya masing-masing. `402` yang menunjukkan jendela penggunaan yang dapat
    dicoba ulang atau batas pengeluaran organisasi/ruang kerja (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) diperlakukan sebagai `rate_limit`, bukan
    penonaktifan penagihan jangka panjang.

    Galat luapan konteks sepenuhnya tidak masuk jalur fallback — penanda
    seperti `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model`, atau `ollama error: context length exceeded` diarahkan ke
    Compaction/percobaan ulang, bukan melanjutkan fallback model.

    Teks galat server generik memiliki cakupan yang lebih sempit daripada "apa pun yang memuat unknown/error
    di dalamnya". Bentuk sementara yang terbatas pada penyedia dan dianggap sebagai sinyal
    failover: `An unknown error occurred` polos dari Anthropic, `Provider returned error`
    polos dari OpenRouter, galat alasan penghentian seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server sementara (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`),
    dan galat penyedia sibuk seperti `ModelNotReadyException` jika konteks penyedia
    sesuai. Teks fallback internal generik seperti `LLM request failed
    with an unknown error.` tetap ditangani secara konservatif dan tidak memicu fallback
    dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    ID profil autentikasi `anthropic:default` tidak memiliki kredensial dalam
    penyimpanan autentikasi yang diharapkan.

    **Daftar periksa perbaikan:**

    - Pastikan lokasi profil — saat ini:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; versi lama:
      `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`).
    - Pastikan Gateway memuat variabel lingkungan Anda. `ANTHROPIC_API_KEY` yang hanya diatur di
      shell Anda tidak akan tersedia bagi Gateway yang dijalankan melalui systemd/launchd — letakkan di
      `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - Pastikan Anda mengedit agen yang tepat — konfigurasi multi-agen memiliki
      beberapa berkas `auth-profiles.json`.
    - Jalankan `openclaw models status` untuk melihat model yang dikonfigurasi dan status
      autentikasi penyedia.

    **Untuk "No credentials found for profile anthropic" (tanpa akhiran surel):**

    Proses dikunci ke profil Anthropic yang tidak dapat ditemukan Gateway.

    - Gunakan Claude CLI: jalankan `openclaw models auth login --provider anthropic
      --method cli --set-default` pada host Gateway.
    - Sebaiknya gunakan kunci API: letakkan `ANTHROPIC_API_KEY` di
      `~/.openclaw/.env` pada host Gateway, lalu hapus urutan yang dikunci
      dan memaksakan penggunaan profil yang hilang:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Mode jarak jauh: profil autentikasi berada di mesin Gateway, bukan di
      laptop Anda — pastikan Anda menjalankan perintah di sana.

  </Accordion>

  <Accordion title="Mengapa Google Gemini juga dicoba dan gagal?">
    Jika konfigurasi model Anda menyertakan Google Gemini sebagai fallback (atau Anda
    beralih ke singkatan Gemini), OpenClaw akan mencobanya selama fallback. Jika tidak ada
    kredensial Google yang dikonfigurasi, akan muncul `No API key found for provider
    "google"`. Perbaikan: tambahkan autentikasi Google, atau hapus model Google dari
    `agents.defaults.model.fallbacks`/alias.

    **Permintaan LLM ditolak: tanda tangan pemikiran diperlukan (Google Antigravity)**

    Penyebab: riwayat sesi memiliki blok pemikiran tanpa tanda tangan (sering kali
    berasal dari aliran yang dibatalkan/tidak lengkap); Google Antigravity memerlukan tanda tangan
    pada blok pemikiran. OpenClaw menghapus blok pemikiran tanpa tanda tangan untuk Google
    Antigravity Claude; jika masih muncul, mulai sesi baru atau atur
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

    Periksa profil yang tersimpan tanpa menampilkan rahasia: `openclaw models auth
    list` (opsional dengan `--provider <id>` atau `--json`). Lihat
    [CLI Model](/id/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Apa saja ID profil yang umum?">
    Diawali nama penyedia: `anthropic:default` (umum jika tidak ada identitas surel),
    `anthropic:<email>` untuk identitas OAuth, atau ID khusus yang Anda
    pilih (misalnya `anthropic:work`).

  </Accordion>

  <Accordion title="Dapatkah saya mengatur profil autentikasi mana yang dicoba lebih dahulu?">
    Ya. Konfigurasi `auth.order.<provider>` menetapkan urutan rotasi per penyedia
    (hanya metadata — tidak ada rahasia yang disimpan).

    OpenClaw dapat melewati profil yang berada dalam **masa jeda** singkat (pembatasan laju,
    batas waktu, kegagalan autentikasi) atau status **dinonaktifkan** yang lebih lama
    (penagihan/kredit tidak mencukupi). Periksa dengan `openclaw models status
    --json` dan lihat `auth.unusableProfiles`. Sesuaikan dengan
    `auth.cooldowns.billingBackoffHours*`. Masa jeda pembatasan laju dapat berlaku
    khusus per model — profil yang sedang dalam masa jeda untuk satu model masih dapat melayani
    model lain pada penyedia yang sama; jendela penagihan/penonaktifan memblokir
    seluruh profil.

    Tetapkan penggantian urutan per agen (disimpan dalam `auth-state.json` agen tersebut):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Verifikasi apa yang benar-benar akan dicoba: `openclaw models status --probe`. Profil
    tersimpan yang tidak disertakan dalam urutan eksplisit akan melaporkan
    `excluded_by_auth_order`, bukan dilewati secara diam-diam tanpa dicoba.

  </Accordion>

  <Accordion title="OAuth dibandingkan kunci API — apa perbedaannya?">
    - **OAuth / login CLI** sering menggunakan akses langganan jika
      didukung oleh penyedia. Untuk Anthropic, backend Claude CLI OpenClaw
      menggunakan `claude -p` dari Claude Code, yang saat ini oleh Anthropic dianggap sebagai
      penggunaan Agent SDK/terprogram yang memakai batas penggunaan langganan —
      lihat [Anthropic](/id/providers/anthropic) untuk status penghentian sementara penagihan
      terkini dan tautan sumber.
    - **Kunci API** menggunakan penagihan per token.

    Wizard mendukung Anthropic Claude CLI, OAuth OpenAI Codex, dan kunci
    API.

  </Accordion>
</AccordionGroup>

## Terkait

- [Pertanyaan umum](/id/help/faq) — pertanyaan umum utama
- [Pertanyaan umum — mulai cepat dan penyiapan pertama kali](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
