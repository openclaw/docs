---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa jeda, atau perilaku beralih ke model cadangan
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami bagaimana penggantian model sesi berinteraksi dengan percobaan ulang cadangan
sidebarTitle: Model failover
summary: Bagaimana OpenClaw merotasi profil autentikasi dan melakukan fallback antar model
title: Alih gagal model
x-i18n:
    generated_at: "2026-05-11T20:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil autentikasi** dalam penyedia saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendukungnya.

## Alur runtime

Untuk eksekusi teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

<Steps>
  <Step title="Selesaikan status sesi">
    Selesaikan model sesi aktif dan preferensi profil autentikasi.
  </Step>
  <Step title="Bangun rantai kandidat">
    Bangun rantai kandidat model dari pilihan model saat ini dan kebijakan fallback untuk sumber pilihan tersebut. Default yang dikonfigurasi, primer tugas cron, dan model fallback yang dipilih otomatis dapat menggunakan fallback yang dikonfigurasi; pilihan sesi pengguna eksplisit bersifat ketat.
  </Step>
  <Step title="Coba penyedia saat ini">
    Coba penyedia saat ini dengan aturan rotasi/cooldown profil autentikasi.
  </Step>
  <Step title="Lanjutkan pada error yang layak failover">
    Jika penyedia tersebut habis dengan error yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Pertahankan override fallback">
    Pertahankan override fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca sesi lain melihat penyedia/model yang sama dengan yang akan digunakan runner. Override model yang dipertahankan ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit pada kegagalan">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan waktu berakhir cooldown terdekat jika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempertahankan field pilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi baru yang tidak terkait, seperti perubahan `/model` manual atau pembaruan rotasi sesi yang terjadi saat percobaan sedang berjalan.

## Kebijakan sumber pilihan

OpenClaw memisahkan penyedia/model yang dipilih dari alasan pemilihannya. Sumber tersebut mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Primer agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat eksplisit, atau sediakan daftar yang tidak kosong untuk mengikutsertakan agen tersebut ke fallback model.
- **Override fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, dan model asal yang dipilih sebelum mencoba ulang. Override otomatis itu dapat terus menelusuri rantai fallback yang dikonfigurasi dan dihapus oleh `/new`, `/reset`, dan `sessions.reset`. Eksekusi Heartbeat tanpa `heartbeat.model` eksplisit juga menghapus override otomatis langsung ketika asalnya tidak lagi cocok dengan default terkonfigurasi saat ini.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pilihan sesi persis. Jika penyedia/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback terkonfigurasi yang tidak terkait.
- **Override sesi lama**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna agar pilihan lama yang eksplisit tidak diam-diam dikonversi menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` tugas cron adalah primer tugas, bukan override sesi pengguna. Itu menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat eksekusi cron bersifat ketat.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk kunci API dan token OAuth.

- Rahasia berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Status perutean autentikasi runtime berada di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfigurasi `auth.profiles` / `auth.order` adalah **metadata + perutean saja** (tanpa rahasia).
- File OAuth lama khusus impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan).

Detail selengkapnya: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa penyedia)

## ID profil

Login OAuth membuat profil terpisah agar beberapa akun dapat berdampingan.

- Default: `provider:default` ketika tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Ketika sebuah penyedia memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika diatur).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` yang difilter berdasarkan penyedia.
  </Step>
  <Step title="Profil tersimpan">
    Entri di `auth-profiles.json` untuk penyedia.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci primer:** jenis profil (**OAuth sebelum kunci API**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang paling lama lebih dulu, dalam setiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan berdasarkan waktu berakhir terdekat.

### Kelekatan sesi (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** agar cache penyedia tetap hangat. OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali hingga:

- sesi direset (`/new` / `/reset`)
- compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain saat terjadi batas laju/timeout. Ketika profil asli tersedia kembali, eksekusi baru dapat memprioritaskannya lagi tanpa mengubah model atau runtime yang dipilih. Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.
</Note>

### Langganan OpenAI Codex plus cadangan API key

Untuk model agen OpenAI, auth dan runtime terpisah. `openai/gpt-*` tetap berada di
harness Codex sementara auth dapat berotasi antara profil langganan Codex dan
cadangan API key OpenAI.

Gunakan `auth.order.openai` untuk urutan yang terlihat oleh pengguna:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Profil langganan Codex yang ada masih dapat menggunakan id profil lama
`openai-codex:*`. Cadangan API key yang diurutkan dapat berupa profil API key
`openai:*` biasa. Ketika langganan mencapai batas penggunaan Codex,
OpenClaw mencatat waktu reset persis saat Codex menyediakannya, mencoba profil
auth berikutnya dalam urutan, dan menjaga eksekusi tetap di dalam harness Codex. Setelah waktu reset
berlalu, profil langganan memenuhi syarat lagi dan pemilihan otomatis berikutnya
dapat kembali ke profil tersebut.

Gunakan profil yang disematkan pengguna hanya saat Anda ingin memaksa satu akun/key untuk
sesi tersebut. Profil yang disematkan pengguna sengaja dibuat ketat dan tidak diam-diam melompat
ke profil lain.

## Cooldown

Ketika profil gagal karena kesalahan auth/batas laju (atau timeout yang terlihat seperti pembatasan laju), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Apa yang masuk ke kategori batas laju / timeout">
    Kategori batas laju itu lebih luas daripada `429` biasa: kategori ini juga mencakup pesan penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Kesalahan format/permintaan tidak valid biasanya terminal karena mencoba ulang payload yang sama akan gagal dengan cara yang sama, jadi OpenClaw menampilkannya alih-alih merotasi profil autentikasi. Jalur perbaikan coba ulang yang diketahui dapat ikut serta secara eksplisit: misalnya kegagalan validasi ID panggilan alat Cloud Code Assist dibersihkan dan dicoba ulang sekali melalui kebijakan `allowFormatRetry`. Kesalahan alasan berhenti yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke kategori timeout itu ketika sumbernya cocok dengan pola sementara yang dikenal. Misalnya, pesan stream-wrapper pi-ai polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap penyedia karena pi-ai memancarkannya ketika stream penyedia berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server sementara seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks penyedianya benar-benar OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK penyedia mungkin, jika tidak dibatasi, tidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw membatasi penantian `retry-after-ms` / `retry-after` internal SDK pada 60 detik secara default dan langsung menampilkan respons yang dapat dicoba ulang yang lebih panjang agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas tersebut dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku coba ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown berskala model">
    Cooldown batas laju juga dapat berskala model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika ID model yang gagal diketahui.
    - Model saudara pada penyedia yang sama masih dapat dicoba ketika cooldown dibatasi ke model lain.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil di seluruh model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

Status disimpan dalam `auth-state.json` di bawah `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Penonaktifan penagihan

Kegagalan penagihan/kredit (misalnya "insufficient credits" / "credit balance too low") diperlakukan sebagai layak failover, tetapi biasanya tidak bersifat sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih panjang) dan merotasi ke profil/penyedia berikutnya.

<Note>
Tidak setiap respons yang berbentuk penagihan adalah `402`, dan tidak setiap HTTP `402` masuk ke sini. OpenClaw mempertahankan teks penagihan eksplisit di jalur penagihan bahkan ketika penyedia mengembalikan `401` atau `403` sebagai gantinya, tetapi pencocok khusus penyedia tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, error `402` sementara untuk jendela penggunaan dan batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` saat pesannya tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Error tersebut tetap berada di jalur cooldown/failover singkat, bukan jalur penonaktifan penagihan yang panjang.
</Note>

State disimpan di `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Default:

- Backoff penagihan dimulai dari **5 jam**, berlipat dua untuk setiap kegagalan penagihan, dan dibatasi hingga **24 jam**.
- Penghitung backoff direset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang akibat overload mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Percobaan ulang akibat overload menggunakan **backoff 0 md** secara default.

## Fallback model

Jika semua profil untuk suatu provider gagal, OpenClaw berpindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, batas rate, dan timeout yang telah menghabiskan rotasi profil (error lain tidak memajukan fallback). Error provider yang tidak menampilkan detail yang cukup tetap diberi label secara presisi dalam state fallback: `empty_response` berarti provider tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti provider secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada classifier yang cocok.

Error overload dan batas rate ditangani lebih agresif daripada cooldown penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil auth pada provider yang sama, lalu beralih ke fallback model berikutnya yang dikonfigurasi tanpa menunggu. Sinyal provider sibuk seperti `ModelNotReadyException` masuk ke bucket overload tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah run dimulai dari primary default yang dikonfigurasi, primary cron job, primary agent dengan fallback eksplisit, atau override fallback yang dipilih otomatis, OpenClaw dapat menelusuri rantai fallback terkonfigurasi yang sesuai. Primary agent tanpa fallback eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau override provider/model CLI sekali pakai) bersifat ketat: jika provider/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta plus fallback yang dikonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Fallback eksplisit yang dikonfigurasi dideduplikasi tetapi tidak difilter oleh allowlist model. Fallback tersebut diperlakukan sebagai niat operator eksplisit.
    - Jika run saat ini sudah berada pada fallback yang dikonfigurasi dalam keluarga provider yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika tidak ada override fallback eksplisit yang diberikan, fallback yang dikonfigurasi dicoba sebelum primary yang dikonfigurasi meskipun model yang diminta menggunakan provider berbeda.
    - Jika tidak ada override fallback eksplisit yang diberikan ke runner fallback, primary yang dikonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap ke default normal setelah kandidat sebelumnya habis.
    - Saat pemanggil memberikan `fallbacksOverride`, runner menggunakan tepat model yang diminta plus daftar override tersebut. Daftar kosong menonaktifkan fallback model dan mencegah primary yang dikonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Error mana yang memajukan fallback

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan auth
    - batas rate dan habisnya cooldown
    - error overload/provider sibuk
    - error failover berbentuk timeout
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar model tersimpan yang sudah usang tidak membuat loop percobaan ulang luar
    - error lain yang tidak dikenali saat masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - abort eksplisit yang tidak berbentuk timeout/failover
    - error overflow konteks yang seharusnya tetap berada dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - error tidak dikenal terakhir saat tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku skip cooldown vs probe

Saat setiap profil auth untuk suatu provider sudah berada dalam cooldown, OpenClaw tidak otomatis melewati provider tersebut selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan auth persisten langsung melewati seluruh provider.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primary masih dapat diprobe dengan throttle agar pemulihan mungkin dilakukan tanpa restart.
    - Kandidat primary dapat diprobe mendekati berakhirnya cooldown, dengan throttle per provider.
    - Sibling fallback pada provider yang sama dapat dicoba meskipun ada cooldown saat kegagalan tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini sangat relevan saat batas rate bersifat khusus model dan model sibling masih dapat segera pulih.
    - Probe cooldown sementara dibatasi satu per provider per run fallback agar satu provider tidak menghambat fallback lintas-provider.

  </Accordion>
</AccordionGroup>

## Override sesi dan penggantian model live

Perubahan model sesi adalah state bersama. Runner aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi live semuanya membaca atau menulis bagian dari entri sesi yang sama.

Artinya, percobaan ulang fallback harus berkoordinasi dengan penggantian model live:

- Hanya perubahan model eksplisit yang digerakkan pengguna yang menandai penggantian live tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi fallback, override Heartbeat, atau Compaction tidak pernah menandai penggantian live tertunda sendiri.
- Override model yang digerakkan pengguna diperlakukan sebagai pilihan persis untuk kebijakan fallback, sehingga provider terpilih yang tidak dapat dijangkau muncul sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang fallback dimulai, runner balasan mempertahankan field override fallback yang dipilih ke entri sesi.
- Override fallback otomatis tetap dipilih pada giliran berikutnya sehingga OpenClaw tidak memprobe primary yang diketahui bermasalah pada setiap pesan. `/new`, `/reset`, dan `sessions.reset` menghapus override yang bersumber otomatis dan mengembalikan sesi ke default yang dikonfigurasi.
- `/status` menampilkan model yang dipilih dan, saat state fallback berbeda, model fallback aktif serta alasannya.
- Rekonsiliasi sesi live lebih memilih override sesi yang dipertahankan daripada field model runtime yang usang.
- Jika error penggantian live menunjuk ke kandidat berikutnya dalam rantai fallback aktif, OpenClaw langsung melompat ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika upaya fallback gagal, runner melakukan rollback hanya pada field override yang ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah race klasik:

<Steps>
  <Step title="Primary gagal">
    Model primary yang dipilih gagal.
  </Step>
  <Step title="Fallback dipilih di memori">
    Kandidat fallback dipilih di memori.
  </Step>
  <Step title="Penyimpanan sesi masih menyatakan primary lama">
    Penyimpanan sesi masih mencerminkan primary lama.
  </Step>
  <Step title="Rekonsiliasi live membaca state usang">
    Rekonsiliasi sesi live membaca state sesi yang usang.
  </Step>
  <Step title="Percobaan ulang dikembalikan">
    Percobaan ulang dikembalikan ke model lama sebelum upaya fallback dimulai.
  </Step>
</Steps>

Override fallback yang dipertahankan menutup celah itu, dan rollback sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per upaya yang menjadi input untuk log dan pesan cooldown yang ditampilkan kepada pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan error yang dapat dibaca manusia

Log terstruktur `model_fallback_decision` juga menyertakan field `fallbackStep*` datar saat kandidat gagal, dilewati, atau fallback berikutnya berhasil. Field ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga eksportir log dan diagnostik dapat merekonstruksi kegagalan primary bahkan saat fallback terminal juga gagal.

Saat setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membuat pesan yang lebih spesifik seperti "semua model untuk sementara terkena batas rate" dan menyertakan waktu berakhir cooldown paling awal jika diketahui.

Ringkasan cooldown tersebut sadar model:

- batas rate khusus model yang tidak terkait diabaikan untuk rantai provider/model yang dicoba
- jika blok yang tersisa adalah batas rate khusus model yang cocok, OpenClaw melaporkan waktu berakhir terakhir yang cocok yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ikhtisar pemilihan model dan fallback yang lebih luas.
