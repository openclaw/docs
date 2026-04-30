---
read_when:
    - Memilih atau mengganti model, mengonfigurasi alias
    - Pemecahan masalah failover model / "Semua model gagal"
    - Memahami profil autentikasi dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'Tanya jawab: nilai bawaan model, pemilihan, alias, peralihan, pengalihan kegagalan, dan profil autentikasi'
title: 'FAQ: model dan autentikasi'
x-i18n:
    generated_at: "2026-04-30T09:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  Tanya jawab model dan profil autentikasi. Untuk penyiapan, sesi, gateway, kanal, dan
  pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Model: default, pemilihan, alias, peralihan

  <AccordionGroup>
  <Accordion title='Apa itu "model default"?'>
    Model default OpenClaw adalah apa pun yang Anda tetapkan sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model dirujuk sebagai `provider/model` (contoh: `openai/gpt-5.5` atau `openai-codex/gpt-5.5`). Jika Anda menghilangkan penyedia, OpenClaw pertama-tama mencoba alias, lalu kecocokan penyedia terkonfigurasi yang unik untuk id model persis tersebut, dan baru setelah itu kembali ke penyedia default terkonfigurasi sebagai jalur kompatibilitas yang sudah usang. Jika penyedia itu tidak lagi mengekspos model default terkonfigurasi, OpenClaw kembali ke penyedia/model terkonfigurasi pertama alih-alih menampilkan default penyedia terhapus yang sudah basi. Anda tetap harus menetapkan `provider/model` secara **eksplisit**.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia di tumpukan penyedia Anda.
    **Untuk agen dengan alat aktif atau input tidak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rutekan berdasarkan peran agen.

    MiniMax memiliki dokumentasinya sendiri: [MiniMax](/id/providers/minimax) dan
    [Model lokal](/id/gateway/local-models).

    Pedoman praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agen dan menggunakan sub-agen untuk
    memparalelkan tugas panjang (setiap sub-agen memakai token). Lihat [Model](/id/concepts/models) dan
    [Sub-agen](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap injeksi prompt
    dan perilaku tidak aman. Lihat [Keamanan](/id/gateway/security).

    Konteks tambahan: [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus konfigurasi saya?">
    Gunakan **perintah model** atau edit hanya bidang **model**. Hindari penggantian konfigurasi penuh.

    Opsi aman:

    - `/model` dalam chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui konfigurasi model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda bermaksud mengganti seluruh konfigurasi.
    Untuk edit RPC, inspeksi dengan `config.schema.lookup` terlebih dahulu dan utamakan `config.patch`. Payload lookup memberi Anda jalur ternormalisasi, dokumentasi/kendala skema dangkal, dan ringkasan turunan langsung
    untuk pembaruan parsial.
    Jika Anda menimpa konfigurasi, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaiki.

    Dokumentasi: [Model](/id/concepts/models), [Konfigurasi](/id/cli/configure), [Konfig](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model yang di-host sendiri (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Tarik model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan tarikan lokal
    - untuk peralihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap injeksi prompt.
    Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan alat.
    Jika Anda tetap menginginkan model kecil, aktifkan sandboxing dan allowlist alat yang ketat.

    Dokumentasi: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Penyedia model](/id/concepts/model-providers), [Keamanan](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Apa yang digunakan OpenClaw, Flawd, dan Krill untuk model?">
    - Deployment ini dapat berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi penyedia tetap.
    - Periksa pengaturan runtime saat ini pada setiap Gateway dengan `openclaw models status`.
    - Untuk agen sensitif keamanan/dengan alat aktif, gunakan model generasi terbaru terkuat yang tersedia.

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model secara langsung (tanpa memulai ulang)?">
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

    Anda juga dapat memaksa profil autentikasi tertentu untuk penyedia (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agen mana yang aktif, file `auth-profiles.json` mana yang digunakan, dan profil autentikasi mana yang akan dicoba berikutnya.
    Ini juga menampilkan endpoint penyedia terkonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

    **Bagaimana cara melepas pin profil yang saya tetapkan dengan @profile?**

    Jalankan ulang `/model` **tanpa** sufiks `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk memastikan profil autentikasi mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.5 untuk tugas harian dan Codex 5.5 untuk coding?">
    Ya. Tetapkan satu sebagai default dan beralih sesuai kebutuhan:

    - **Peralihan cepat (per sesi):** `/model openai/gpt-5.5` untuk tugas kunci API OpenAI langsung saat ini atau `/model openai-codex/gpt-5.5` untuk tugas GPT-5.5 Codex OAuth.
    - **Default:** tetapkan `agents.defaults.model.primary` ke `openai/gpt-5.5` untuk penggunaan kunci API atau `openai-codex/gpt-5.5` untuk penggunaan GPT-5.5 Codex OAuth.
    - **Sub-agen:** rutekan tugas coding ke sub-agen dengan model default berbeda.

    Lihat [Model](/id/concepts/models) dan [Perintah slash](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi mode cepat untuk GPT 5.5?">
    Gunakan toggle sesi atau default konfigurasi:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.5` atau `openai-codex/gpt-5.5`.
    - **Default per model:** tetapkan `agents.defaults.models["openai/gpt-5.5"].params.fastMode` atau `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` ke `true`.

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

    Untuk OpenAI, mode cepat dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override sesi `/fast` mengalahkan default konfigurasi.

    Lihat [Thinking dan mode cepat](/id/tools/thinking) dan [mode cepat OpenAI](/id/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` ditetapkan, itu menjadi **allowlist** untuk `/model` dan override sesi apa pun.
    Memilih model yang tidak ada dalam daftar tersebut mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Kesalahan itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **penyedia belum dikonfigurasi** (tidak ditemukan konfigurasi penyedia MiniMax atau profil autentikasi), sehingga model tidak dapat diresolusikan.

    Daftar periksa perbaikan:

    1. Upgrade ke rilis OpenClaw saat ini (atau jalankan dari sumber `main`), lalu mulai ulang Gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau autentikasi MiniMax
       ada di env/profil autentikasi sehingga penyedia yang cocok dapat diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau OAuth MiniMax tersimpan
       untuk `minimax-portal`).
    3. Gunakan id model persis (peka huruf besar-kecil) untuk jalur autentikasi Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       kunci API, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       dan pilih dari daftar (atau `/model list` dalam chat).

    Lihat [MiniMax](/id/providers/minimax) dan [Model](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan ganti model **per sesi** saat diperlukan.
    Fallback adalah untuk **kesalahan**, bukan "tugas sulit," jadi gunakan `/model` atau agen terpisah.

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

    Dokumentasi: [Model](/id/concepts/models), [Perutean Multi-Agen](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt adalah pintasan bawaan?">
    Ya. OpenClaw menyertakan beberapa singkatan default (hanya diterapkan saat model ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` untuk penyiapan kunci API, atau `openai-codex/gpt-5.5` saat dikonfigurasi untuk Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menetapkan alias sendiri dengan nama yang sama, nilai Anda yang berlaku.

  </Accordion>

  <Accordion title="Bagaimana cara mendefinisikan/mengoverride pintasan model (alias)?">
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

    Lalu `/model sonnet` (atau `/<alias>` jika didukung) diresolusikan ke ID model tersebut.

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

    Jika Anda merujuk ke penyedia/model tetapi kunci penyedia yang diperlukan tidak ada, Anda akan mendapatkan kesalahan auth runtime (mis. `No API key found for provider "zai"`).

    **Tidak ada kunci API yang ditemukan untuk penyedia setelah menambahkan agen baru**

    Ini biasanya berarti **agen baru** memiliki penyimpanan auth kosong. Auth bersifat per agen dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan auth selama wizard.
    - Atau salin hanya profil `api_key` / `token` statis yang portabel dari penyimpanan auth agen utama ke penyimpanan auth agen baru.
    - Untuk profil OAuth, masuk dari agen baru saat agen itu memerlukan akunnya sendiri; jika tidak, OpenClaw dapat membaca melalui agen default/utama tanpa mengkloning token refresh.

    Jangan **gunakan ulang** `agentDir` antar agen; hal itu menyebabkan benturan auth/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi profil auth** dalam penyedia yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku untuk profil yang gagal (backoff eksponensial), sehingga OpenClaw dapat terus merespons meskipun penyedia terkena pembatasan laju atau gagal sementara.

    Bucket batas laju mencakup lebih dari respons `429` biasa. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai batas
    laju yang layak memicu failover.

    Beberapa respons yang tampak seperti penagihan bukan `402`, dan beberapa
    respons HTTP `402` juga tetap berada di bucket sementara itu. Jika penyedia
    mengembalikan teks penagihan eksplisit pada `401` atau `403`, OpenClaw masih dapat
    tetap menempatkannya di jalur penagihan, tetapi pencocok teks khusus penyedia
    tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru tampak seperti jendela penggunaan yang dapat dicoba ulang atau
    batas pengeluaran organisasi/ruang kerja (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan penagihan yang lama.

    Kesalahan luapan konteks berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur compaction/coba ulang alih-alih melanjutkan
    fallback model.

    Teks kesalahan server generik sengaja dibuat lebih sempit daripada "apa pun yang berisi
    unknown/error". OpenClaw memang memperlakukan bentuk sementara yang dibatasi penyedia
    seperti Anthropic polos `An unknown error occurred`, OpenRouter polos
    `Provider returned error`, kesalahan alasan berhenti seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server sementara
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan kesalahan penyedia sibuk seperti `ModelNotReadyException` sebagai
    sinyal timeout/kelebihan beban yang layak memicu failover ketika konteks penyedia
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu fallback model dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Ini berarti sistem mencoba menggunakan ID profil auth `anthropic:default`, tetapi tidak dapat menemukan kredensial untuk profil tersebut di penyimpanan auth yang diharapkan.

    **Checklist perbaikan:**

    - **Konfirmasi lokasi profil auth** (jalur baru vs legacy)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Konfirmasi variabel env Anda dimuat oleh Gateway**
      - Jika Anda menyetel `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Letakkan di `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda mengedit agen yang benar**
      - Setup multi-agen berarti bisa ada beberapa file `auth-profiles.json`.
    - **Periksa kewajaran status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah penyedia sudah diautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti proses dijepit ke profil auth Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan auth miliknya.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` pada host gateway.
    - **Jika Anda ingin menggunakan kunci API sebagai gantinya**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **host gateway**.
      - Hapus urutan yang dijepit yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Konfirmasi Anda menjalankan perintah pada host gateway**
      - Dalam mode jarak jauh, profil auth berada di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa ini juga mencoba Google Gemini dan gagal?">
    Jika konfigurasi model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke singkatan Gemini), OpenClaw akan mencobanya selama fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: berikan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak dirutekan ke sana.

    **Permintaan LLM ditolak: signature thinking diperlukan (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok thinking tanpa signature** (sering kali dari
    stream yang dibatalkan/sebagian). Google Antigravity memerlukan signature untuk blok thinking.

    Perbaikan: OpenClaw sekarang menghapus blok thinking tanpa signature untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau setel `/thinking off` untuk agen tersebut.

  </Accordion>
</AccordionGroup>

## Profil auth: apa itu dan cara mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu profil auth?">
    Profil auth adalah catatan kredensial bernama (OAuth atau kunci API) yang terikat pada penyedia. Profil berada di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Apa saja ID profil yang umum?">
    OpenClaw menggunakan ID berprefiks penyedia seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (mis. `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol profil auth mana yang dicoba terlebih dahulu?">
    Ya. Konfigurasi mendukung metadata opsional untuk profil dan pengurutan per penyedia (`auth.order.<provider>`). Ini **tidak** menyimpan rahasia; ini memetakan ID ke penyedia/mode dan menetapkan urutan rotasi.

    OpenClaw mungkin melewati profil sementara jika profil berada dalam **cooldown** singkat (batas laju/timeout/kegagalan auth) atau status **disabled** yang lebih lama (penagihan/kredit tidak cukup). Untuk memeriksanya, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyetelan: `auth.cooldowns.billingBackoffHours*`.

    Cooldown batas laju dapat dibatasi per model. Profil yang sedang cooldown
    untuk satu model masih dapat digunakan untuk model saudara pada penyedia yang sama,
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

    Untuk memverifikasi apa yang sebenarnya akan dicoba, gunakan:

    ```bash
    openclaw models status --probe
    ```

    Jika profil tersimpan dihilangkan dari urutan eksplisit, probe melaporkan
    `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya diam-diam.

  </Accordion>

  <Accordion title="OAuth vs kunci API - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **Kunci API** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan kunci API.

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama
- [FAQ — mulai cepat dan setup pertama kali](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
