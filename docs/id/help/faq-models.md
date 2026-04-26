---
read_when:
    - Memilih atau mengganti model, mengonfigurasi alias
    - Men-debug failover model / "Semua model gagal"
    - Memahami profil auth dan cara mengelolanya
sidebarTitle: Models FAQ
summary: 'FAQ: default model, pemilihan, alias, switching, failover, dan profil auth'
title: 'FAQ: model dan auth'
x-i18n:
    generated_at: "2026-04-26T11:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  Tanya jawab model dan auth-profile. Untuk penyiapan, sesi, gateway, channel, dan
  troubleshooting, lihat [FAQ](/id/help/faq) utama.

  ## Model: default, pemilihan, alias, switching

  <AccordionGroup>
  <Accordion title='Apa yang dimaksud dengan "default model"?'>
    Default model OpenClaw adalah apa pun yang Anda atur sebagai:

    ```
    agents.defaults.model.primary
    ```

    Model direferensikan sebagai `provider/model` (contoh: `openai/gpt-5.5` atau `openai-codex/gpt-5.5`). Jika Anda menghilangkan provider, OpenClaw pertama-tama mencoba alias, lalu kecocokan provider terkonfigurasi yang unik untuk model id persis itu, dan baru setelah itu fallback ke provider default yang dikonfigurasi sebagai jalur kompatibilitas usang. Jika provider tersebut tidak lagi mengekspos default model yang dikonfigurasi, OpenClaw fallback ke provider/model terkonfigurasi pertama alih-alih menampilkan default provider usang yang telah dihapus. Anda tetap harus **secara eksplisit** menetapkan `provider/model`.

  </Accordion>

  <Accordion title="Model apa yang Anda rekomendasikan?">
    **Default yang direkomendasikan:** gunakan model generasi terbaru terkuat yang tersedia di stack provider Anda.
    **Untuk agen dengan tool atau input tak tepercaya:** prioritaskan kekuatan model daripada biaya.
    **Untuk chat rutin/berisiko rendah:** gunakan model fallback yang lebih murah dan rutekan berdasarkan peran agen.

    MiniMax memiliki dokumentasinya sendiri: [MiniMax](/id/providers/minimax) dan
    [Model lokal](/id/gateway/local-models).

    Aturan praktis: gunakan **model terbaik yang mampu Anda bayar** untuk pekerjaan berisiko tinggi, dan model yang lebih murah
    untuk chat rutin atau ringkasan. Anda dapat merutekan model per agen dan menggunakan subagen untuk
    memparalelkan tugas panjang (setiap subagen mengonsumsi token). Lihat [Models](/id/concepts/models) dan
    [Sub-agents](/id/tools/subagents).

    Peringatan keras: model yang lebih lemah/terlalu terkuantisasi lebih rentan terhadap prompt
    injection dan perilaku tidak aman. Lihat [Security](/id/gateway/security).

    Konteks lebih lanjut: [Models](/id/concepts/models).

  </Accordion>

  <Accordion title="Bagaimana cara mengganti model tanpa menghapus config saya?">
    Gunakan **perintah model** atau edit hanya field **model**. Hindari penggantian config penuh.

    Opsi aman:

    - `/model` di chat (cepat, per sesi)
    - `openclaw models set ...` (hanya memperbarui config model)
    - `openclaw configure --section model` (interaktif)
    - edit `agents.defaults.model` di `~/.openclaw/openclaw.json`

    Hindari `config.apply` dengan objek parsial kecuali Anda memang berniat mengganti seluruh config.
    Untuk edit RPC, periksa dulu dengan `config.schema.lookup` dan pilih `config.patch`. Payload lookup memberi Anda path ternormalisasi, dokumen/skema dangkal beserta batasannya, dan ringkasan child langsung.
    untuk pembaruan parsial.
    Jika Anda memang menimpa config, pulihkan dari cadangan atau jalankan ulang `openclaw doctor` untuk memperbaiki.

    Dokumentasi: [Models](/id/concepts/models), [Configure](/id/cli/configure), [Config](/id/cli/config), [Doctor](/id/gateway/doctor).

  </Accordion>

  <Accordion title="Bisakah saya menggunakan model self-hosted (llama.cpp, vLLM, Ollama)?">
    Ya. Ollama adalah jalur termudah untuk model lokal.

    Penyiapan tercepat:

    1. Instal Ollama dari `https://ollama.com/download`
    2. Pull model lokal seperti `ollama pull gemma4`
    3. Jika Anda juga menginginkan model cloud, jalankan `ollama signin`
    4. Jalankan `openclaw onboard` dan pilih `Ollama`
    5. Pilih `Local` atau `Cloud + Local`

    Catatan:

    - `Cloud + Local` memberi Anda model cloud plus model Ollama lokal Anda
    - model cloud seperti `kimi-k2.5:cloud` tidak memerlukan pull lokal
    - untuk switching manual, gunakan `openclaw models list` dan `openclaw models set ollama/<model>`

    Catatan keamanan: model yang lebih kecil atau sangat terkuantisasi lebih rentan terhadap prompt
    injection. Kami sangat merekomendasikan **model besar** untuk bot apa pun yang dapat menggunakan tool.
    Jika Anda tetap ingin model kecil, aktifkan sandboxing dan allowlist tool yang ketat.

    Dokumentasi: [Ollama](/id/providers/ollama), [Model lokal](/id/gateway/local-models),
    [Model providers](/id/concepts/model-providers), [Security](/id/gateway/security),
    [Sandboxing](/id/gateway/sandboxing).

  </Accordion>

  <Accordion title="Model apa yang digunakan OpenClaw, Flawd, dan Krill?">
    - Deployment ini bisa berbeda dan dapat berubah seiring waktu; tidak ada rekomendasi provider yang tetap.
    - Periksa pengaturan runtime saat ini pada masing-masing gateway dengan `openclaw models status`.
    - Untuk agen yang sensitif terhadap keamanan/menggunakan tool, gunakan model generasi terbaru terkuat yang tersedia.
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

    Anda dapat melihat model yang tersedia dengan `/model`, `/model list`, atau `/model status`.

    `/model` (dan `/model list`) menampilkan pemilih ringkas bernomor. Pilih berdasarkan nomor:

    ```
    /model 3
    ```

    Anda juga dapat memaksa auth profile tertentu untuk provider tersebut (per sesi):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` menampilkan agen mana yang aktif, file `auth-profiles.json` mana yang digunakan, dan auth profile mana yang akan dicoba berikutnya.
    Ini juga menampilkan endpoint provider yang dikonfigurasi (`baseUrl`) dan mode API (`api`) jika tersedia.

    **Bagaimana cara melepas pin profile yang saya tetapkan dengan @profile?**

    Jalankan ulang `/model` **tanpa** akhiran `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jika Anda ingin kembali ke default, pilih dari `/model` (atau kirim `/model <default provider/model>`).
    Gunakan `/model status` untuk mengonfirmasi auth profile mana yang aktif.

  </Accordion>

  <Accordion title="Bisakah saya menggunakan GPT 5.5 untuk tugas harian dan Codex 5.5 untuk coding?">
    Ya. Tetapkan salah satunya sebagai default dan ganti sesuai kebutuhan:

    - **Switch cepat (per sesi):** `/model openai/gpt-5.5` untuk tugas API key OpenAI langsung saat ini atau `/model openai-codex/gpt-5.5` untuk tugas OAuth GPT-5.5 Codex.
    - **Default:** atur `agents.defaults.model.primary` ke `openai/gpt-5.5` untuk penggunaan API key atau `openai-codex/gpt-5.5` untuk penggunaan OAuth GPT-5.5 Codex.
    - **Subagen:** rutekan tugas coding ke subagen dengan default model yang berbeda.

    Lihat [Models](/id/concepts/models) dan [Slash commands](/id/tools/slash-commands).

  </Accordion>

  <Accordion title="Bagaimana cara mengonfigurasi fast mode untuk GPT 5.5?">
    Gunakan toggle sesi atau default config:

    - **Per sesi:** kirim `/fast on` saat sesi menggunakan `openai/gpt-5.5` atau `openai-codex/gpt-5.5`.
    - **Default per model:** atur `agents.defaults.models["openai/gpt-5.5"].params.fastMode` atau `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` ke `true`.

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

    Untuk OpenAI, fast mode dipetakan ke `service_tier = "priority"` pada permintaan Responses native yang didukung. Override sesi `/fast` mengalahkan default config.

    Lihat [Thinking and fast mode](/id/tools/thinking) dan [OpenAI fast mode](/id/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Mengapa saya melihat "Model ... is not allowed" lalu tidak ada balasan?'>
    Jika `agents.defaults.models` diatur, itu menjadi **allowlist** untuk `/model` dan override sesi apa pun.
    Memilih model yang tidak ada di daftar tersebut akan mengembalikan:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Error tersebut dikembalikan **sebagai pengganti** balasan normal. Perbaikan: tambahkan model itu ke
    `agents.defaults.models`, hapus allowlist, atau pilih model dari `/model list`.

  </Accordion>

  <Accordion title='Mengapa saya melihat "Unknown model: minimax/MiniMax-M2.7"?'>
    Ini berarti **provider belum dikonfigurasi** (tidak ditemukan config provider MiniMax atau auth
    profile), sehingga model tidak dapat di-resolve.

    Checklist perbaikan:

    1. Upgrade ke rilis OpenClaw terkini (atau jalankan dari source `main`), lalu restart gateway.
    2. Pastikan MiniMax dikonfigurasi (wizard atau JSON), atau auth MiniMax
       ada di env/auth profiles sehingga provider yang cocok dapat disuntikkan
       (`MINIMAX_API_KEY` untuk `minimax`, `MINIMAX_OAUTH_TOKEN` atau MiniMax
       OAuth yang tersimpan untuk `minimax-portal`).
    3. Gunakan model id yang tepat (peka huruf besar/kecil) untuk jalur auth Anda:
       `minimax/MiniMax-M2.7` atau `minimax/MiniMax-M2.7-highspeed` untuk penyiapan API key,
       atau `minimax-portal/MiniMax-M2.7` /
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
    Fallback adalah untuk **error**, bukan "tugas berat", jadi gunakan `/model` atau agen terpisah.

    **Opsi A: ganti per sesi**

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
    - Rutekan berdasarkan agen atau gunakan `/agent` untuk berpindah

    Dokumentasi: [Models](/id/concepts/models), [Multi-Agent Routing](/id/concepts/multi-agent), [MiniMax](/id/providers/minimax), [OpenAI](/id/providers/openai).

  </Accordion>

  <Accordion title="Apakah opus / sonnet / gpt merupakan shortcut bawaan?">
    Ya. OpenClaw menyediakan beberapa shorthand default (hanya diterapkan saat model tersebut ada di `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` untuk penyiapan API key, atau `openai-codex/gpt-5.5` saat dikonfigurasi untuk Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jika Anda menetapkan alias Anda sendiri dengan nama yang sama, nilai Anda yang akan menang.

  </Accordion>

  <Accordion title="Bagaimana cara mendefinisikan/mengoverride shortcut model (alias)?">
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

    Jika Anda mereferensikan `provider/model` tetapi key provider yang diperlukan tidak ada, Anda akan mendapatkan error auth runtime (misalnya `No API key found for provider "zai"`).

    **Tidak ada API key yang ditemukan untuk provider setelah menambahkan agen baru**

    Ini biasanya berarti **agen baru** memiliki penyimpanan auth kosong. Auth bersifat per-agen dan
    disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opsi perbaikan:

    - Jalankan `openclaw agents add <id>` dan konfigurasikan auth selama wizard.
    - Atau salin `auth-profiles.json` dari `agentDir` agen utama ke `agentDir` agen baru.

    Jangan gunakan ulang `agentDir` di beberapa agen; itu menyebabkan benturan auth/sesi.

  </Accordion>
</AccordionGroup>

## Failover model dan "Semua model gagal"

<AccordionGroup>
  <Accordion title="Bagaimana cara kerja failover?">
    Failover terjadi dalam dua tahap:

    1. **Rotasi auth profile** dalam provider yang sama.
    2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

    Cooldown berlaku untuk profile yang gagal (exponential backoff), sehingga OpenClaw dapat tetap merespons bahkan ketika sebuah provider terkena rate limit atau gagal sementara.

    Bucket rate-limit mencakup lebih dari sekadar respons `429`. OpenClaw
    juga memperlakukan pesan seperti `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, dan batas
    jendela penggunaan berkala (`weekly/monthly limit reached`) sebagai
    rate limit yang layak failover.

    Beberapa respons yang tampak seperti billing bukan `402`, dan beberapa respons HTTP `402`
    juga tetap berada di bucket transien itu. Jika sebuah provider mengembalikan
    teks billing eksplisit pada `401` atau `403`, OpenClaw tetap dapat menyimpannya di
    jalur billing, tetapi matcher teks khusus provider tetap dibatasi pada
    provider yang memilikinya (misalnya OpenRouter `Key limit exceeded`). Jika pesan `402`
    justru tampak seperti batas jendela penggunaan yang bisa dicoba ulang atau
    batas belanja organisasi/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw memperlakukannya sebagai
    `rate_limit`, bukan disabled billing jangka panjang.

    Error context-overflow berbeda: signature seperti
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, atau `ollama error: context length
    exceeded` tetap berada di jalur compaction/retry alih-alih memajukan
    fallback model.

    Teks error server generik sengaja dibuat lebih sempit daripada "apa saja yang
    mengandung unknown/error". OpenClaw memang memperlakukan bentuk transien yang
    dibatasi provider seperti Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, error stop-reason seperti `Unhandled stop reason:
    error`, payload JSON `api_error` dengan teks server transien
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), dan error provider-busy seperti `ModelNotReadyException` sebagai
    sinyal timeout/overloaded yang layak failover ketika konteks provider
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
      - Penyiapan multi-agen berarti mungkin ada beberapa file `auth-profiles.json`.
    - **Periksa kewarasan status model/auth**
      - Gunakan `openclaw models status` untuk melihat model yang dikonfigurasi dan apakah provider telah diautentikasi.

    **Checklist perbaikan untuk "No credentials found for profile anthropic"**

    Ini berarti run disematkan ke auth profile Anthropic, tetapi Gateway
    tidak dapat menemukannya di penyimpanan auth-nya.

    - **Gunakan Claude CLI**
      - Jalankan `openclaw models auth login --provider anthropic --method cli --set-default` pada host gateway.
    - **Jika Anda ingin menggunakan API key**
      - Letakkan `ANTHROPIC_API_KEY` di `~/.openclaw/.env` pada **host gateway**.
      - Hapus urutan pinned yang memaksa profile yang hilang:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Pastikan Anda menjalankan perintah di host gateway**
      - Dalam mode remote, auth profile berada di mesin gateway, bukan laptop Anda.

  </Accordion>

  <Accordion title="Mengapa OpenClaw juga mencoba Google Gemini lalu gagal?">
    Jika config model Anda menyertakan Google Gemini sebagai fallback (atau Anda beralih ke shorthand Gemini), OpenClaw akan mencobanya selama fallback model. Jika Anda belum mengonfigurasi kredensial Google, Anda akan melihat `No API key found for provider "google"`.

    Perbaikan: sediakan auth Google, atau hapus/hindari model Google di `agents.defaults.model.fallbacks` / alias agar fallback tidak dirutekan ke sana.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Penyebab: riwayat sesi berisi **blok thinking tanpa signature** (sering kali dari
    stream yang dibatalkan/parsial). Google Antigravity memerlukan signature untuk blok thinking.

    Perbaikan: OpenClaw sekarang menghapus blok thinking tanpa signature untuk Google Antigravity Claude. Jika masih muncul, mulai **sesi baru** atau atur `/thinking off` untuk agen tersebut.

  </Accordion>
</AccordionGroup>

## Auth profile: apa itu dan bagaimana mengelolanya

Terkait: [/concepts/oauth](/id/concepts/oauth) (alur OAuth, penyimpanan token, pola multi-akun)

<AccordionGroup>
  <Accordion title="Apa itu auth profile?">
    Auth profile adalah catatan kredensial bernama (OAuth atau API key) yang terikat ke provider. Profile disimpan di:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Seperti apa ID profile yang umum?">
    OpenClaw menggunakan ID berawalan provider seperti:

    - `anthropic:default` (umum ketika tidak ada identitas email)
    - `anthropic:<email>` untuk identitas OAuth
    - ID kustom yang Anda pilih (misalnya `anthropic:work`)

  </Accordion>

  <Accordion title="Bisakah saya mengontrol auth profile mana yang dicoba lebih dulu?">
    Ya. Config mendukung metadata opsional untuk profile dan urutan per provider (`auth.order.<provider>`). Ini **tidak** menyimpan secret; ini memetakan ID ke provider/mode dan menetapkan urutan rotasi.

    OpenClaw dapat sementara melewati sebuah profile jika profile itu berada dalam **cooldown** singkat (rate limit/timeout/kegagalan auth) atau status **disabled** yang lebih lama (billing/kredit tidak cukup). Untuk memeriksanya, jalankan `openclaw models status --json` dan periksa `auth.unusableProfiles`. Penyetelan: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate-limit dapat berskala model. Profile yang sedang cooldown
    untuk satu model masih dapat digunakan untuk model sibling pada provider yang sama,
    sementara jendela billing/disabled tetap memblokir seluruh profile.

    Anda juga dapat menetapkan override urutan **per-agen** (disimpan di `auth-state.json` agen tersebut) melalui CLI:

    ```bash
    # Default ke agen default yang dikonfigurasi (hilangkan --agent)
    openclaw models auth order get --provider anthropic

    # Kunci rotasi ke satu profile saja (hanya coba yang ini)
    openclaw models auth order set --provider anthropic anthropic:default

    # Atau tetapkan urutan eksplisit (fallback dalam provider)
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

    Jika profile tersimpan dihilangkan dari urutan eksplisit, probe melaporkan
    `excluded_by_auth_order` untuk profile tersebut alih-alih mencobanya secara diam-diam.

  </Accordion>

  <Accordion title="OAuth vs API key - apa bedanya?">
    OpenClaw mendukung keduanya:

    - **OAuth** sering memanfaatkan akses langganan (jika berlaku).
    - **API key** menggunakan penagihan bayar per token.

    Wizard secara eksplisit mendukung Anthropic Claude CLI, OpenAI Codex OAuth, dan API key.

  </Accordion>
</AccordionGroup>

## Terkait

- [FAQ](/id/help/faq) — FAQ utama
- [FAQ — quick start dan penyiapan saat pertama kali](/id/help/faq-first-run)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
