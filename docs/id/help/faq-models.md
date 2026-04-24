---
read_when:
    - Memilih atau mengganti model, mengonfigurasi alias
    - Men-debug failover model / "Semua model gagal"
    - Memahami profil autentikasi dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'FAQ: default, pemilihan, alias, pengalihan, failover, dan profil autentikasi model'
title: 'FAQ: model dan autentikasi'
x-i18n:
    generated_at: "2026-04-24T09:11:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Tanya jawab tentang model dan auth-profile. Untuk penyiapan, sesi, gateway, channel, dan
  pemecahan masalah, lihat [FAQ](/id/help/faq) utama.

  ## Model: default, pemilihan, alias, pengalihan

  <AccordionGroup>
  <Accordion title='Apa yang dimaksud dengan "model default"?'>
    Model default OpenClaw adalah apa pun yang Anda atur sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model dirujuk sebagai `provider/model` (contoh: `openai/gpt-5.4` atau `openai-codex/gpt-5.5`). Jika Anda menghilangkan provider, OpenClaw pertama-tama mencoba alias, lalu kecocokan exact model id provider-terkonfigurasi yang unik, dan hanya setelah itu menggunakan fallback ke provider default yang dikonfigurasi sebagai jalur kompatibilitas usang. Jika provider itu tidak lagi mengekspos model default yang dikonfigurasi, OpenClaw menggunakan fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider yang telah dihapus dan usang. Anda tetap sebaiknya **secara eksplisit** menetapkan `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia di tumpukan provider Anda.
    **Untuk agen dengan alat aktif atau input tak tepercaya:** utamakan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan arahkan berdasarkan peran agen.

    MiniMax memiliki dokumennya sendiri: [MiniMax](/id/providers/minimax) dan
    [Model lokal](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agen dan menggunakan subagen untuk
    memparalelkan tugas panjang (setiap subagen mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap prompt
    injection dan perilaku tidak aman. Lihat [Keamanan](/id/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya bidang **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang berniat mengganti seluruh config.
    Untuk edit RPC, periksa terlebih dahulu dengan `config.schema.lookup` dan utamakan `config.patch`.
    Payload lookup memberi Anda path yang dinormalisasi, dokumen/kendala skema dangkal, dan ringkasan child langsung.
    untuk pembaruan parsial.
    Jika Anda memang menimpa config, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaikinya.

    Dokumen: [Models](/id/concepts/models), [Configure](/id/cli/configure), [Config](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Pasang Ollama dari `https://ollama.com/download`
    2. Pull model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk pengalihan manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat menyarankan **model besar** untuk bot apa pun yang dapat menggunakan alat.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist alat yang ketat.

    Dokumen: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Provider model](/id/concepts/model-providers), [Keamanan](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini bisa berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini di setiap gateway dengan `openclaw models status`.
    - Untuk agen yang sensitif terhadap keamanan/menggunakan alat, gunakan model generasi terbaru terkuat yang tersedia.
  </Accordion>

  <Accordion title="Bagaimana cara mengganti model secara langsung (tanpa restart)?">
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

    Anda juga dapat memaksa auth profile tertentu untuk provider tersebut (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agen mana yang aktif, file `auth-profiles.json` mana yang sedang digunakan, dan auth profile mana yang akan dicoba berikutnya.
    Perintah ini juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) bila tersedia.

    **Bagaimana cara melepas penyematan profil yang saya atur dengan @profile?**

    Jalankan ulang `/model` **tanpa** sufiks `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk memastikan auth profile mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.5 untuk tugas harian dan Codex 5.5 untuk coding?">
    Ya. Tetapkan satu sebagai default dan ganti sesuai kebutuhan:

    - **Pengalihan cepat (per sesi):** `/model openai/gpt-5.4` untuk tugas API key OpenAI langsung saat ini atau `/model openai-codex/gpt-5.5` untuk tugas OAuth GPT-5.5 Codex.
    - **Default:** atur `agents.defaults.model.primary` ke `openai/gpt-5.4` untuk penggunaan API key atau `openai-codex/gpt-5.5` untuk penggunaan OAuth GPT-5.5 Codex.
    - **Subagen:** rute tugas coding ke subagen dengan model default yang berbeda.

    Akses API key langsung untuk `openai/gpt-5.5` didukung setelah OpenAI mengaktifkan
    GPT-5.5 pada API publik. Sampai saat itu GPT-5.5 hanya tersedia melalui langganan/OAuth.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi fast mode untuk GPT 5.5?">
    Gunakan toggle sesi atau default config:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.4` atau `openai-codex/gpt-5.5`.
    - **Default per model:** atur `agents.defaults.models["openai/gpt-5.4"].params.fastMode` atau `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` ke `true`.

    Contoh:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Untuk OpenAI, fast mode dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override sesi `/fast` mengalahkan default config.

    Lihat [Thinking and fast mode](/id/tools/thinking) dan [OpenAI fast mode](/id/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` diatur, itu menjadi **allowlist** untuk `/model` dan override sesi apa pun.
    Memilih model yang tidak ada dalam daftar itu akan mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error itu dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model tersebut ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ditemukan config provider MiniMax atau auth
    profile), sehingga model tidak dapat di-resolve.

    Checklist perbaikan:

    1. Perbarui ke rilis OpenClaw saat ini (atau jalankan dari source `main`), lalu mulai ulang gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/auth profile sehingga provider yang cocok dapat diinjeksi
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth yang tersimpan untuk `minimax-portal`).
    3. Gunakan exact model id (peka huruf besar/kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan
       API key, atau `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` untuk penyiapan OAuth.
    4. Jalankan:

       ```bash
       openclaw models list
       ```

       dan pilih dari daftar (atau `/model list` di chat).

    Lihat [MiniMax](/id/providers/minimax) dan [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan MiniMax sebagai default dan OpenAI untuk tugas kompleks?">
    Ya. Gunakan **MiniMax sebagai default** dan ganti model **per sesi** saat diperlukan.
    Fallback adalah untuk **error**, bukan "tugas sulit", jadi gunakan `/model` atau agen terpisah.

    **Opsi A: ganti per sesi**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
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
    - Rute berdasarkan agen atau gunakan `/agent` untuk beralih

    Dokumen: [Models](/id/concepts/models), [Perutean Multi-Agent](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt merupakan pintasan bawaan?">
    Ya. OpenClaw menyertakan beberapa shorthand default (hanya diterapkan saat model ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` untuk penyiapan API key, atau `openai-codex/gpt-5.5` saat dikonfigurasi untuk OAuth Codex
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda mengatur alias Anda sendiri dengan nama yang sama, nilai Anda yang menang.

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

    Lalu `/model sonnet` (atau `/<alias>` saat didukung) akan di-resolve ke model ID tersebut.

  </Accordion>

  <Accordion title="Bagaimana cara menambahkan model dari provider lain seperti OpenRouter atau Z.AI?">
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

    Jika Anda merujuk `provider/model` tetapi kunci provider yang diperlukan tidak ada, Anda akan mendapat error autentikasi runtime (misalnya `No API key found for provider "zai"`).

    **No API key found for provider setelah menambahkan agen baru**

    Ini biasanya berarti **agen baru** memiliki penyimpanan auth yang kosong. Auth bersifat per-agen dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan auth selama wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agen utama ke `agentDir` agen baru.

    Jangan gunakan kembali `agentDir` di beberapa agen; hal itu menyebabkan konflik auth/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi auth profile** di dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku pada profil yang gagal (exponential backoff), sehingga OpenClaw dapat tetap merespons bahkan saat provider terkena rate limit atau gagal sementara.

    Bucket rate-limit mencakup lebih dari sekadar respons `429` biasa. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    rate limit yang layak untuk failover.

    Beberapa respons yang terlihat seperti billing bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada di bucket transien itu. Jika provider mengembalikan
    teks billing eksplisit pada `401` atau `403`, OpenClaw masih dapat mempertahankannya di
    jalur billing, tetapi matcher teks khusus provider tetap dibatasi ke
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru terlihat seperti jendela penggunaan yang dapat dicoba ulang atau
    batas pengeluaran organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan penonaktifan billing yang panjang.

    Error context overflow berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur Compaction/percobaan ulang alih-alih memajukan
    fallback model.

    Teks error server generik sengaja lebih sempit daripada "apa pun yang
    berisi unknown/error". OpenClaw memang memperlakukan bentuk transien yang dicakup provider
    seperti Anthropic kosong `An unknown error occurred`, OpenRouter kosong
    `Provider returned error`, error stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server transien
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider-sibuk seperti `ModelNotReadyException` sebagai
    sinyal timeout/overloaded yang layak untuk failover saat konteks provider
    cocok.
    Teks fallback internal generik seperti `LLM request failed with an unknown
    error.` tetap konservatif dan tidak memicu fallback model dengan sendirinya.

  </Accordion>

  <Accordion title='Apa arti "No credentials found for profile anthropic:default"?'>
    Artinya sistem mencoba menggunakan ID auth profile `anthropic:default`, tetapi tidak dapat menemukan kredensial untuk itu di penyimpanan auth yang diharapkan.

    **Checklist perbaikan:**

    - **Pastikan lokasi auth profile** (path baru vs lama)
      - Saat ini: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Lama: `~/.openclaw/agent/*` (dimigrasikan oleh `openclaw doctor`)
    - **Pastikan env var Anda dimuat oleh Gateway**
      - Jika Anda mengatur `ANTHROPIC_API_KEY` di shell tetapi menjalankan Gateway melalui systemd/launchd, Gateway mungkin tidak mewarisinya. Letakkan di `~/.openclaw/.env` atau aktifkan `env.shellEnv`.
    - **Pastikan Anda mengedit agen yang benar**
      - Penyiapan multi-agen berarti bisa ada beberapa file `auth-profiles.json`.
    - **Periksa kewarasan status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider telah diautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Artinya run disematkan ke auth profile Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan auth miliknya.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` pada host gateway.
    - **Jika Anda ingin menggunakan API key sebagai gantinya**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **host gateway**.
      - Hapus urutan penyematan apa pun yang memaksa profil yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Pastikan Anda menjalankan perintah pada host gateway**
      - Dalam mode remote, auth profile disimpan di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa OpenClaw juga mencoba Google Gemini lalu gagal?">
    Jika config model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya selama fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak diarahkan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok thinking tanpa signature** (sering berasal
    dari stream yang dibatalkan/parsial). Google Antigravity memerlukan signature untuk blok thinking.

    Perbaikan: OpenClaw sekarang menghapus blok thinking tanpa signature untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau atur `/thinking off` untuk agen tersebut.

  </Accordion>
</AccordionGroup>

## Auth profile: apa itu dan cara mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu auth profile?">
    Auth profile adalah catatan kredensial bernama (OAuth atau API key) yang terikat ke provider. Profil disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Seperti apa ID profil yang umum?">
    OpenClaw menggunakan ID berprefiks provider seperti:

    - `anthropic:default` (umum saat tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (misalnya `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol auth profile mana yang dicoba lebih dulu?">
    Ya. Config mendukung metadata opsional untuk profil dan urutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat melewati sebuah profil untuk sementara jika profil tersebut berada dalam **cooldown** singkat (rate limit/timeout/kegagalan auth) atau status **nonaktif** yang lebih lama (billing/kredit tidak cukup). Untuk memeriksa ini, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyesuaian: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate-limit dapat dicakup per model. Profil yang sedang cooldown
    untuk satu model masih dapat digunakan untuk model sibling pada provider yang sama,
    sedangkan jendela billing/nonaktif tetap memblokir seluruh profil.

    Anda juga dapat menetapkan override urutan **per agen** (disimpan di `auth-state.json` agen tersebut) melalui CLI:

    ```bash
    # Default ke agen default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profil (hanya coba yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback di dalam provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Hapus override (fallback ke config auth.order / round-robin)
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

  <Accordion title="OAuth vs API key - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **API key** menggunakan billing bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan API key.

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama
- [FAQ — quick start dan penyiapan pertama kali](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
