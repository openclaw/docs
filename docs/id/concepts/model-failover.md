---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa jeda, atau perilaku peralihan model cadangan
    - Memperbarui aturan pengalihan kegagalan untuk profil autentikasi atau model
    - Memahami bagaimana penggantian model sesi berinteraksi dengan percobaan ulang cadangan
sidebarTitle: Model failover
summary: Cara OpenClaw merotasi profil autentikasi dan beralih ke model cadangan
title: Peralihan model saat gagal
x-i18n:
    generated_at: "2026-05-06T09:08:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendukungnya.

## Alur runtime

Untuk proses teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

<Steps>
  <Step title="Selesaikan status sesi">
    Selesaikan model sesi aktif dan preferensi profil auth.
  </Step>
  <Step title="Bangun rantai kandidat">
    Bangun rantai kandidat model dari pilihan model saat ini dan kebijakan fallback untuk sumber pilihan tersebut. Default yang dikonfigurasi, primer tugas cron, dan model fallback yang dipilih otomatis dapat menggunakan fallback yang dikonfigurasi; pilihan sesi pengguna eksplisit bersifat ketat.
  </Step>
  <Step title="Coba provider saat ini">
    Coba provider saat ini dengan aturan rotasi/cooldown profil auth.
  </Step>
  <Step title="Lanjutkan pada error yang layak failover">
    Jika provider tersebut habis dengan error yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Persist override fallback">
    Persist override fallback yang dipilih sebelum retry dimulai agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan runner. Override model yang dipersist ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit saat gagal">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan waktu berakhir cooldown terdekat ketika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempersist field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah retry fallback yang gagal menimpa mutasi sesi baru yang tidak terkait seperti perubahan manual `/model` atau pembaruan rotasi sesi yang terjadi saat percobaan sedang berjalan.

## Kebijakan sumber pilihan

OpenClaw memisahkan provider/model yang dipilih dari alasan mengapa itu dipilih. Sumber tersebut mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Primer agen**: `agents.list[].model` ketat kecuali objek model agen tersebut menyertakan `fallbacks` sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat menjadi eksplisit, atau berikan daftar tidak kosong untuk mengaktifkan fallback model bagi agen tersebut.
- **Override fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, dan `modelOverrideSource: "auto"` sebelum mencoba ulang. Override otomatis tersebut dapat terus berjalan melalui rantai fallback yang dikonfigurasi dan dibersihkan oleh `/new`, `/reset`, dan `sessions.reset`.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pilihan sesi eksak. Jika provider/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback terkonfigurasi yang tidak terkait.
- **Override sesi legacy**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna sehingga pilihan lama yang eksplisit tidak diam-diam dikonversi menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` tugas cron adalah primer tugas, bukan override sesi pengguna. Ini menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat proses cron ketat.

## Penyimpanan auth (key + OAuth)

OpenClaw menggunakan **profil auth** untuk API key dan token OAuth.

- Secret berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Status routing auth runtime berada di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Config `auth.profiles` / `auth.order` adalah **metadata + routing saja** (tanpa secret).
- File OAuth khusus impor legacy: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan).

Detail lebih lanjut: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil berbeda agar beberapa akun dapat berdampingan.

- Default: `provider:default` ketika email tidak tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Ketika provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Config eksplisit">
    `auth.order[provider]` (jika diatur).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` difilter berdasarkan provider.
  </Step>
  <Step title="Profil tersimpan">
    Entri di `auth-profiles.json` untuk provider.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Key primer:** jenis profil (**OAuth sebelum API key**).
- **Key sekunder:** `usageStats.lastUsed` (yang paling lama terlebih dahulu, dalam setiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan berdasarkan kedaluwarsa terdekat.

### Kelekatan sesi (ramah cache)

OpenClaw **mem-pin profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat. OpenClaw **tidak** merotasi pada setiap request. Profil yang di-pin digunakan ulang hingga:

- sesi direset (`/new` / `/reset`)
- compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis sampai sesi baru dimulai.

<Note>
Profil yang di-pin otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain saat rate limit/timeout. Profil yang di-pin pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model dikonfigurasi, OpenClaw pindah ke model berikutnya alih-alih mengganti profil.
</Note>

### Mengapa OAuth dapat "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round-robin dapat berpindah di antara keduanya lintas pesan kecuali di-pin. Untuk memaksa satu profil:

- Pin dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (ketika didukung oleh UI/permukaan chat Anda).

## Cooldown

Ketika profil gagal karena error auth/rate-limit (atau timeout yang tampak seperti rate limiting), OpenClaw menandainya dalam cooldown dan pindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk ke bucket rate-limit / timeout">
    Bucket rate-limit tersebut lebih luas daripada `429` biasa: ini juga mencakup pesan provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan periodik seperti `weekly/monthly limit reached`.

    Error format/request tidak valid (misalnya kegagalan validasi ID tool call Cloud Code Assist) diperlakukan sebagai layak failover dan menggunakan cooldown yang sama. Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke bucket timeout tersebut ketika sumbernya cocok dengan pola transient yang diketahui. Misalnya, pesan stream-wrapper pi-ai polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap provider karena pi-ai mengeluarkannya ketika stream provider berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server transient seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks provider memang OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK provider mungkin sebaliknya tidur selama jendela `Retry-After` yang lama sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw membatasi wait `retry-after-ms` / `retry-after` internal SDK pada 60 detik secara default dan segera memunculkan respons retryable yang lebih lama agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku retry](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown berbasis cakupan model">
    Cooldown rate-limit juga dapat berbasis cakupan model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan rate-limit ketika ID model yang gagal diketahui.
    - Model saudara pada provider yang sama masih dapat dicoba ketika cooldown dicakup ke model yang berbeda.
    - Jendela billing/dinonaktifkan tetap memblokir seluruh profil lintas model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

Status disimpan di `auth-state.json` di bawah `usageStats`:

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

## Penonaktifan billing

Kegagalan billing/kredit (misalnya "insufficient credits" / "credit balance too low") diperlakukan sebagai layak failover, tetapi biasanya tidak transient. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff lebih lama) dan merotasi ke profil/provider berikutnya.

<Note>
Tidak setiap respons berbentuk billing adalah `402`, dan tidak setiap HTTP `402` masuk ke sini. OpenClaw mempertahankan teks billing eksplisit di jalur billing bahkan ketika provider mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap dicakup ke provider yang memilikinya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, error `402` sementara terkait jendela penggunaan dan batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` ketika pesan tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Itu tetap berada pada jalur cooldown/failover singkat alih-alih jalur penonaktifan billing panjang.
</Note>

Status disimpan di `auth-state.json`:

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

- Backoff billing dimulai pada **5 jam**, berlipat dua per kegagalan billing, dan dibatasi pada **24 jam**.
- Counter backoff direset jika profil belum gagal selama **24 jam** (dapat dikonfigurasi).
- Retry overloaded mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Retry overloaded menggunakan **backoff 0 ms** secara default.

## Fallback model

Jika semua profil untuk suatu provider gagal, OpenClaw pindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, rate limit, dan timeout yang menghabiskan rotasi profil (error lain tidak melanjutkan fallback). Error provider yang tidak mengekspos detail yang cukup tetap diberi label presisi dalam status fallback: `empty_response` berarti provider tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti provider secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada classifier yang mencocokkannya.

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada jeda penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi penyedia yang sama, lalu beralih ke model cadangan terkonfigurasi berikutnya tanpa menunggu. Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke kelompok kelebihan beban tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah proses dimulai dari primer default terkonfigurasi, primer cron job, primer agen dengan cadangan eksplisit, atau override cadangan yang dipilih otomatis, OpenClaw dapat menelusuri rantai cadangan terkonfigurasi yang cocok. Primer agen tanpa cadangan eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau override penyedia/model CLI sekali pakai) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari cadangan yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta ditambah cadangan terkonfigurasi.

<AccordionGroup>
  <Accordion title="Rules">
    - Model yang diminta selalu berada di urutan pertama.
    - Cadangan terkonfigurasi eksplisit dideduplikasi tetapi tidak difilter oleh daftar izin model. Cadangan tersebut diperlakukan sebagai niat operator eksplisit.
    - Jika proses saat ini sudah berada pada cadangan terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika proses saat ini berada pada penyedia yang berbeda dari konfigurasi dan model saat ini belum menjadi bagian dari rantai cadangan terkonfigurasi, OpenClaw tidak menambahkan cadangan terkonfigurasi yang tidak terkait dari penyedia lain.
    - Ketika tidak ada override cadangan eksplisit yang diberikan ke runner cadangan, primer terkonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap pada default normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil memberikan `fallbacksOverride`, runner menggunakan persis model yang diminta ditambah daftar override tersebut. Daftar kosong menonaktifkan cadangan model dan mencegah primer terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang memajukan cadangan

<Tabs>
  <Tab title="Continues on">
    - kegagalan autentikasi
    - batas laju dan habisnya jeda
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan failover berbentuk timeout
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur failover agar model tersimpan yang usang tidak membuat loop percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Does not continue on">
    - pembatalan eksplisit yang tidak berbentuk timeout/failover
    - kesalahan luapan konteks yang harus tetap berada di dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan tidak dikenal terakhir ketika tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku lewati jeda vs probe

Ketika setiap profil autentikasi untuk sebuah penyedia sudah berada dalam jeda, OpenClaw tidak otomatis melewati penyedia itu selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Kegagalan autentikasi persisten langsung melewati seluruh penyedia.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primer masih dapat diprobe dengan pembatasan agar pemulihan memungkinkan tanpa memulai ulang.
    - Kandidat primer dapat diprobe mendekati berakhirnya jeda, dengan pembatas per penyedia.
    - Saudara cadangan pada penyedia yang sama dapat dicoba meskipun ada jeda ketika kegagalannya tampak sementara (`rate_limit`, `overloaded`, atau tidak dikenal). Ini terutama relevan ketika batas laju berlaku pada cakupan model dan model saudara mungkin masih dapat pulih segera.
    - Probe jeda sementara dibatasi satu per penyedia per proses cadangan agar satu penyedia tidak menghentikan cadangan lintas penyedia.

  </Accordion>
</AccordionGroup>

## Override sesi dan pergantian model langsung

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti percobaan ulang cadangan harus berkoordinasi dengan pergantian model langsung:

- Hanya perubahan model yang digerakkan pengguna secara eksplisit yang menandai pergantian langsung tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi cadangan, override Heartbeat, atau Compaction tidak pernah menandai pergantian langsung tertunda dengan sendirinya.
- Override model yang digerakkan pengguna diperlakukan sebagai pilihan persis untuk kebijakan cadangan, sehingga penyedia terpilih yang tidak dapat dijangkau muncul sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang cadangan dimulai, runner balasan mempertahankan field override cadangan terpilih ke entri sesi.
- Override cadangan otomatis tetap terpilih pada giliran berikutnya sehingga OpenClaw tidak memprobe primer yang diketahui buruk pada setiap pesan. `/new`, `/reset`, dan `sessions.reset` menghapus override bersumber otomatis dan mengembalikan sesi ke default terkonfigurasi.
- `/status` menampilkan model yang dipilih dan, ketika status cadangan berbeda, model cadangan aktif beserta alasannya.
- Rekonsiliasi sesi langsung lebih mengutamakan override sesi tersimpan daripada field model runtime yang usang.
- Jika kesalahan pergantian langsung menunjuk ke kandidat berikutnya dalam rantai cadangan aktif, OpenClaw langsung melompat ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika upaya cadangan gagal, runner mengembalikan hanya field override yang ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah race klasik:

<Steps>
  <Step title="Primary fails">
    Model primer yang dipilih gagal.
  </Step>
  <Step title="Fallback chosen in memory">
    Kandidat cadangan dipilih di memori.
  </Step>
  <Step title="Session store still says old primary">
    Penyimpanan sesi masih mencerminkan primer lama.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Rekonsiliasi sesi langsung membaca status sesi yang usang.
  </Step>
  <Step title="Retry snapped back">
    Percobaan ulang dikembalikan ke model lama sebelum upaya cadangan dimulai.
  </Step>
</Steps>

Override cadangan yang dipertahankan menutup celah itu, dan rollback sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per upaya yang memasok log dan pesan jeda yang terlihat pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan kesalahan yang dapat dibaca manusia

Log terstruktur `model_fallback_decision` juga menyertakan field datar `fallbackStep*` ketika kandidat gagal, dilewati, atau cadangan berikutnya berhasil. Field ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga pengekspor log dan diagnostik dapat merekonstruksi kegagalan primer bahkan ketika cadangan terminal juga gagal.

Ketika semua kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model sementara dibatasi lajunya" dan menyertakan waktu berakhir jeda paling cepat ketika diketahui.

Ringkasan jeda itu sadar model:

- batas laju bercakupan model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blok yang tersisa adalah batas laju bercakupan model yang cocok, OpenClaw melaporkan waktu kedaluwarsa cocok terakhir yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ikhtisar pilihan model dan cadangan yang lebih luas.
