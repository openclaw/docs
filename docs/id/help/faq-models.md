---
read_when:
    - Memilih atau beralih model, mengonfigurasi alias
    - Memecahkan masalah peralihan cadangan model / "Semua model gagal"
    - Memahami profil autentikasi dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'FAQ: default model, pemilihan, alias, peralihan, failover, dan profil autentikasi'
title: 'Tanya jawab: model dan autentikasi'
x-i18n:
    generated_at: "2026-05-07T13:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Tanya jawab model dan profil auth. Untuk penyiapan, sesi, Gateway, saluran, dan
  pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Model: default, pemilihan, alias, peralihan

  <AccordionGroup>
  <Accordion title='Apa itu "model default"?'>
    Model default OpenClaw adalah apa pun yang Anda tetapkan sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model dirujuk sebagai `provider/model` (contoh: `openai/gpt-5.5` atau `anthropic/claude-sonnet-4-6`). Jika Anda menghilangkan penyedia, OpenClaw pertama-tama mencoba alias, lalu kecocokan penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru setelah itu kembali ke penyedia default yang dikonfigurasi sebagai jalur kompatibilitas yang tidak digunakan lagi. Jika penyedia tersebut tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw kembali ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia yang sudah dihapus dan basi. Anda tetap harus menetapkan `provider/model` secara **eksplisit**.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia di tumpukan penyedia Anda.
    **Untuk agen yang mengaktifkan alat atau input tidak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk obrolan rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rutekan berdasarkan peran agen.

    MiniMax memiliki dokumentasinya sendiri: [MiniMax](/id/providers/minimax) dan
    [Model lokal](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda biayai** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk obrolan rutin atau ringkasan. Anda dapat merutekan model per agen dan menggunakan sub-agen untuk
    memparalelkan tugas panjang (setiap sub-agen mengonsumsi token). Lihat [Model](/id/concepts/models) dan
    [Sub-agen](/id/tools/subagents).

    Peringatan kuat: model yang lebih lemah/terkuantisasi berlebihan lebih rentan terhadap injeksi
    prompt dan perilaku tidak aman. Lihat [Keamanan](/id/gateway/security).

    Konteks tambahan: [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara beralih model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya bidang **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda bermaksud mengganti seluruh config.
    Untuk edit RPC, periksa dengan `config.schema.lookup` terlebih dahulu dan lebih pilih `config.patch`. Payload lookup memberi Anda path yang dinormalisasi, dokumen/kendala skema dangkal, dan ringkasan anak langsung.
    untuk pembaruan parsial.
    Jika Anda menimpa config, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaiki.

    Dokumen: [Model](/id/concepts/models), [Konfigurasi](/id/cli/configure), [Config](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap injeksi
    prompt. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan alat.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist alat yang ketat.

    Dokumen: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Penyedia model](/id/concepts/model-providers), [Keamanan](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini dapat berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi penyedia tetap.
    - Periksa pengaturan runtime saat ini di setiap gateway dengan `openclaw models status`.
    - Untuk agen yang sensitif keamanan/mengaktifkan alat, gunakan model generasi terbaru terkuat yang tersedia.

  </Accordion>

  <Accordion title="Bagaimana cara beralih model saat berjalan (tanpa restart)?">
    Gunakan perintah `/model` sebagai pesan mandiri:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Ini adalah alias bawaan. Alias kustom dapat ditambahkan melalui `agents.defaults.models`.

    Anda dapat mencantumkan model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

    `/model` (dan `/model list`) menampilkan pemilih ringkas bernomor. Pilih berdasarkan nomor:

    ```
    /model 3
    ```

    Anda juga dapat memaksa profil auth tertentu untuk penyedia (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agen mana yang aktif, file `auth-profiles.json` mana yang digunakan, dan profil auth mana yang akan dicoba berikutnya.
    Ini juga menampilkan endpoint penyedia yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

    **Bagaimana cara melepas pin profil yang saya tetapkan dengan @profile?**

    Jalankan ulang `/model` **tanpa** sufiks `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk mengonfirmasi profil auth mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.5 untuk tugas harian dan Codex 5.5 untuk coding?">
    Ya. Perlakukan pilihan model dan pilihan runtime secara terpisah:

    - **Agen coding Codex native:** tetapkan `agents.defaults.model.primary` ke `openai/gpt-5.5`. Masuk dengan `openclaw models auth login --provider openai-codex` saat Anda ingin auth langganan ChatGPT/Codex.
    - **Tugas OpenAI API langsung di luar loop agen:** konfigurasikan `OPENAI_API_KEY` untuk gambar, embedding, ucapan, realtime, dan permukaan OpenAI API non-agen lainnya.
    - **Auth kunci API agen OpenAI:** gunakan `/model openai/gpt-5.5` dengan profil kunci API `openai-codex` yang berurutan.
    - **Sub-agen:** rutekan tugas coding ke agen khusus Codex dengan model dan default `agentRuntime` miliknya sendiri.

    Lihat [Model](/id/concepts/models) dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi mode cepat untuk GPT 5.5?">
    Gunakan toggle sesi atau default config:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.5`.
    - **Default per model:** tetapkan `agents.defaults.models["openai/gpt-5.5"].params.fastMode` ke `true`.

    Contoh:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Untuk OpenAI, mode cepat dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override `/fast` sesi mengalahkan default config.

    Lihat [Berpikir dan mode cepat](/id/tools/thinking) dan [Mode cepat OpenAI](/id/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` ditetapkan, itu menjadi **allowlist** untuk `/model` dan override
    sesi apa pun. Memilih model yang tidak ada dalam daftar tersebut mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Error tersebut dikembalikan **alih-alih** balasan normal. Perbaikan: tambahkan model ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.
    Jika perintah juga menyertakan `--runtime codex`, tambahkan model terlebih dahulu lalu coba lagi
    perintah `/model provider/model --runtime codex` yang sama.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **penyedia belum dikonfigurasi** (tidak ada config penyedia MiniMax atau profil auth
    yang ditemukan), sehingga model tidak dapat diselesaikan.

    Checklist perbaikan:

    1. Tingkatkan ke rilis OpenClaw saat ini (atau jalankan dari sumber `main`), lalu restart gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/profil auth sehingga penyedia yang cocok dapat diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau OAuth MiniMax tersimpan
       untuk `minimax-portal`).
    3. Gunakan id model persis (peka huruf besar/kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       kunci API, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       dan pilih dari daftar (atau `/model list` di chat).

    Lihat [MiniMax](/id/providers/minimax) dan [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan beralih model **per sesi** saat diperlukan.
    Fallback adalah untuk **error**, bukan "tugas sulit", jadi gunakan `/model` atau agen terpisah.

    **Opsi A: beralih per sesi**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Lalu:

    ```
    /model gpt
    ```

    **Opsi B: agen terpisah**

    - Default Agen A: MiniMax
    - Default Agen B: OpenAI
    - Rutekan berdasarkan agen atau gunakan `/agent` untuk beralih

    Dokumen: [Model](/id/concepts/models), [Perutean Multi-Agen](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah pintasan bawaan?">
    Ya. OpenClaw menyertakan beberapa singkatan default (hanya diterapkan saat model ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menetapkan alias Anda sendiri dengan nama yang sama, nilai Anda yang menang.

  </Accordion>

  <Accordion title="Bagaimana cara mendefinisikan/mengganti pintasan model (alias)?">
    Alias berasal dari `agents.defaults.models.<modelId>.alias`. Contoh:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Lalu `/model sonnet` (atau `/<alias>` saat didukung) diselesaikan ke ID model tersebut.

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jika Anda merujuk provider/model tetapi kunci provider yang diperlukan tidak ada, Anda akan mendapatkan galat autentikasi runtime (misalnya `No API key found for provider "zai"`).

    **Tidak ada kunci API yang ditemukan untuk provider setelah menambahkan agen baru**

    Ini biasanya berarti **agen baru** memiliki penyimpanan autentikasi kosong. Autentikasi bersifat per agen dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan autentikasi selama wizard.
    - Atau salin hanya profil `api_key` / `token` statis portabel dari penyimpanan autentikasi agen utama ke penyimpanan autentikasi agen baru.
    - Untuk profil OAuth, masuk dari agen baru saat agen tersebut membutuhkan akunnya sendiri; jika tidak, OpenClaw dapat membaca melalui agen default/utama tanpa menggandakan token refresh.

    Jangan **gunakan ulang** `agentDir` di antara agen; itu menyebabkan tabrakan autentikasi/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi profil autentikasi** dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown diterapkan pada profil yang gagal (backoff eksponensial), sehingga OpenClaw dapat tetap merespons meskipun provider terkena rate limit atau sementara gagal.

    Bucket rate-limit mencakup lebih dari sekadar respons `429`. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    rate limit yang layak memicu failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa
    respons HTTP `402` juga tetap berada dalam bucket transien tersebut. Jika
    provider mengembalikan teks penagihan eksplisit pada `401` atau `403`, OpenClaw tetap dapat
    menempatkannya di jalur penagihan, tetapi pencocok teks khusus provider tetap dibatasi pada
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru tampak seperti jendela penggunaan yang dapat dicoba ulang atau
    batas pengeluaran organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan penagihan jangka panjang.

    Galat context-overflow berbeda: tanda tangan seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada pada jalur Compaction/coba ulang, bukan melanjutkan
    fallback model.

    Teks galat server generik sengaja dibuat lebih sempit daripada "apa pun yang berisi
    unknown/error". OpenClaw memang memperlakukan bentuk transien yang dibatasi provider
    seperti Anthropic polos `An unknown error occurred`, OpenRouter polos
    `Provider returned error`, galat stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server transien
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan galat provider sibuk seperti `ModelNotReadyException` sebagai
    sinyal timeout/overloaded yang layak memicu failover saat konteks provider
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu fallback model dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Ini berarti sistem mencoba menggunakan ID profil autentikasi `anthropic:default`, tetapi tidak dapat menemukan kredensial untuk profil tersebut di penyimpanan autentikasi yang diharapkan.

    **Daftar periksa perbaikan:**

    - **Konfirmasi tempat profil autentikasi berada** (jalur baru vs lama)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Konfirmasi env var Anda dimuat oleh Gateway**
      - Jika Anda menetapkan `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Letakkan di `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda mengedit agen yang benar**
      - Penyiapan multi-agen berarti mungkin ada beberapa file `auth-profiles.json`.
    - **Periksa kewajaran status model/autentikasi**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider telah diautentikasi.

    **Daftar periksa perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti proses dijepit ke profil autentikasi Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan autentikasinya.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` pada host gateway.
    - **Jika Anda ingin menggunakan kunci API sebagai gantinya**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **host gateway**.
      - Bersihkan urutan yang dijepit yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Konfirmasi Anda menjalankan perintah pada host gateway**
      - Dalam mode jarak jauh, profil autentikasi berada di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa Google Gemini juga dicoba dan gagal?">
    Jika konfigurasi model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya selama fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan autentikasi Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak dirutekan ke sana.

    **Permintaan LLM ditolak: tanda tangan berpikir diperlukan (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok berpikir tanpa tanda tangan** (sering dari
    stream yang dibatalkan/sebagian). Google Antigravity memerlukan tanda tangan untuk blok berpikir.

    Perbaikan: OpenClaw sekarang menghapus blok berpikir tanpa tanda tangan untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau setel `/thinking off` untuk agen tersebut.

  </Accordion>
</AccordionGroup>

## Profil autentikasi: apa itu dan cara mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil autentikasi?">
    Profil autentikasi adalah catatan kredensial bernama (OAuth atau kunci API) yang terkait dengan provider. Profil berada di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Untuk memeriksa profil tersimpan tanpa menampilkan rahasia, jalankan `openclaw models auth list` (opsional `--provider <id>` atau `--json`). Lihat [CLI Model](/id/cli/models#auth-profiles) untuk detail.

  </Accordion>

  <Accordion title="Apa saja ID profil yang umum?">
    OpenClaw menggunakan ID berprefiks provider seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID khusus yang Anda pilih (misalnya `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol profil autentikasi mana yang dicoba lebih dulu?">
    Ya. Konfigurasi mendukung metadata opsional untuk profil dan pengurutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan rahasia; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw mungkin sementara melewati profil jika profil tersebut berada dalam **cooldown** singkat (rate limit/timeout/kegagalan autentikasi) atau status **disabled** yang lebih lama (penagihan/kredit tidak mencukupi). Untuk memeriksanya, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyetelan: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate-limit dapat bersifat terbatas pada model. Profil yang sedang cooling down
    untuk satu model masih bisa digunakan untuk model saudara pada provider yang sama,
    sementara jendela penagihan/disabled tetap memblokir seluruh profil.

    Anda juga dapat menetapkan override urutan **per agen** (disimpan dalam `auth-state.json` milik agen tersebut) melalui CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Untuk menargetkan agen tertentu:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Untuk memverifikasi apa yang benar-benar akan dicoba, gunakan:

    ```bash
    openclaw models status --probe
    ```

    Jika profil tersimpan dihilangkan dari urutan eksplisit, probe melaporkan
    `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs kunci API - apa perbedaannya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **Kunci API** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan kunci API.

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama
- [FAQ — mulai cepat dan penyiapan pertama kali](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
