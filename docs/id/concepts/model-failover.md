---
read_when:
    - Mendiagnosis rotasi profil autentikasi, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami bagaimana override model sesi berinteraksi dengan percobaan ulang fallback
summary: Cara OpenClaw merotasi profil autentikasi dan menggunakan fallback di berbagai model
title: Failover model
x-i18n:
    generated_at: "2026-04-24T09:04:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil autentikasi** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk run teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

1. Model sesi yang saat ini dipilih.
2. `agents.defaults.model.fallbacks` yang dikonfigurasi secara berurutan.
3. Model utama yang dikonfigurasi di akhir ketika run dimulai dari override.

Di dalam setiap kandidat, OpenClaw mencoba failover profil autentikasi sebelum maju ke
kandidat model berikutnya.

Urutan tingkat tinggi:

1. Resolve model sesi aktif dan preferensi profil autentikasi.
2. Bangun rantai kandidat model.
3. Coba provider saat ini dengan aturan rotasi/cooldown profil autentikasi.
4. Jika provider itu habis dengan error yang layak untuk failover, pindah ke kandidat
   model berikutnya.
5. Persist override fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca
   sesi lain melihat provider/model yang sama yang akan digunakan runner.
6. Jika kandidat fallback gagal, rollback hanya bidang override sesi milik fallback
   ketika bidang-bidang itu masih cocok dengan kandidat gagal tersebut.
7. Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan
   dan waktu kedaluwarsa cooldown tercepat saat diketahui.

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner
balasan hanya mem-persist bidang pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi tak terkait yang lebih baru
seperti perubahan manual `/model` atau pembaruan rotasi sesi yang terjadi
saat percobaan sedang berjalan.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk API key maupun token OAuth.

- Secret disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Status routing autentikasi runtime disimpan di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Config `auth.profiles` / `auth.order` hanya untuk **metadata + routing** (tanpa secret).
- File OAuth lama yang hanya untuk impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat penggunaan pertama).

Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil yang berbeda agar beberapa akun dapat hidup berdampingan.

- Default: `provider:default` saat tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Saat sebuah provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

1. **Config eksplisit**: `auth.order[provider]` (jika diatur).
2. **Profil terkonfigurasi**: `auth.profiles` yang difilter berdasarkan provider.
3. **Profil tersimpan**: entri di `auth-profiles.json` untuk provider tersebut.

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round‑robin:

- **Kunci utama:** jenis profil (**OAuth sebelum API key**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang paling lama dulu, dalam setiap jenis).
- **Profil cooldown/nonaktif** dipindahkan ke akhir, diurutkan berdasarkan waktu kedaluwarsa tercepat.

### Sticky sesi (ramah cache)

OpenClaw **menyematkan profil autentikasi yang dipilih per sesi** untuk menjaga cache provider tetap hangat.
OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali sampai:

- sesi di-reset (`/new` / `/reset`)
- Compaction selesai (jumlah Compaction bertambah)
- profil berada dalam cooldown/nonaktif

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi itu
dan tidak dirotasi otomatis sampai sesi baru dimulai.

Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**:
profil itu dicoba terlebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain saat ada rate limit/timeout.
Profil yang disematkan pengguna tetap terkunci ke profil itu; jika gagal dan fallback model
dikonfigurasi, OpenClaw pindah ke model berikutnya alih-alih mengganti profil.

### Mengapa OAuth bisa “terlihat hilang”

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round‑robin dapat berpindah di antara keduanya di beberapa pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (saat didukung oleh UI/surface chat Anda).

## Cooldown

Saat sebuah profil gagal karena error autentikasi/rate-limit (atau timeout yang terlihat
seperti rate limiting), OpenClaw menandainya dalam cooldown dan pindah ke profil berikutnya.
Bucket rate-limit itu lebih luas daripada `429` biasa: bucket itu juga mencakup pesan provider
seperti `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti
`weekly/monthly limit reached`.
Error format/invalid-request (misalnya kegagalan validasi ID tool call Cloud Code Assist)
diperlakukan layak untuk failover dan menggunakan cooldown yang sama.
Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`,
`stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal
timeout/failover.
Teks server generik yang dicakup provider juga dapat masuk ke bucket timeout itu saat
sumbernya cocok dengan pola transien yang diketahui. Misalnya, teks kosong Anthropic
`An unknown error occurred` dan payload JSON `api_error` dengan teks server transien
seperti `internal server error`, `unknown error, 520`, `upstream error`,
atau `backend error` diperlakukan layak untuk failover sebagai timeout. Teks upstream generik khusus OpenRouter seperti `Provider returned error` juga diperlakukan sebagai
timeout hanya saat konteks providernya benar-benar OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap
konservatif dan tidak memicu failover dengan sendirinya.

Beberapa SDK provider bisa saja tidur selama jendela `Retry-After` yang panjang sebelum
mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan
OpenAI, OpenClaw membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` hingga 60
detik secara default dan langsung menampilkan respons retryable yang lebih lama agar jalur
failover ini bisa berjalan. Sesuaikan atau nonaktifkan batas dengan
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [/concepts/retry](/id/concepts/retry).

Cooldown rate-limit juga dapat dicakup per model:

- OpenClaw mencatat `cooldownModel` untuk kegagalan rate-limit saat model yang gagal
  diketahui.
- Model sibling pada provider yang sama masih dapat dicoba saat cooldown
  dicakup ke model yang berbeda.
- Jendela billing/nonaktif tetap memblokir seluruh profil lintas model.

Cooldown menggunakan exponential backoff:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas maksimum)

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

Kegagalan billing/kredit (misalnya “insufficient credits” / “credit balance too low”) diperlakukan layak untuk failover, tetapi biasanya tidak bersifat transien. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **nonaktif** (dengan backoff lebih panjang) dan merotasi ke profil/provider berikutnya.

Tidak setiap respons yang berbentuk billing adalah `402`, dan tidak setiap HTTP `402` masuk
ke sini. OpenClaw menjaga teks billing eksplisit tetap di jalur billing bahkan saat sebuah
provider malah mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap
dibatasi ke provider yang memilikinya (misalnya OpenRouter `403 Key limit
exceeded`). Sementara itu error jendela penggunaan `402` sementara dan
batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` saat
pesannya terlihat dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, atau `organization spending limit exceeded`).
Error ini tetap berada di jalur cooldown/failover pendek alih-alih jalur
penonaktifan billing panjang.

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

- Backoff billing dimulai dari **5 jam**, berlipat ganda pada setiap kegagalan billing, dan dibatasi hingga **24 jam**.
- Penghitung backoff di-reset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang overloaded mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Percobaan ulang overloaded menggunakan backoff **0 ms** secara default.

## Fallback model

Jika semua profil untuk sebuah provider gagal, OpenClaw berpindah ke model berikutnya di
`agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan autentikasi, rate limit, dan
timeout yang menghabiskan rotasi profil (error lain tidak memajukan fallback).

Error overloaded dan rate-limit ditangani lebih agresif daripada cooldown
billing. Secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi pada provider yang sama,
lalu beralih ke model fallback terkonfigurasi berikutnya tanpa menunggu.
Sinyal provider sibuk seperti `ModelNotReadyException` masuk ke bucket overloaded
itu. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, dan
`auth.cooldowns.rateLimitedProfileRotations`.

Saat run dimulai dengan override model (hook atau CLI), fallback tetap berakhir di
`agents.defaults.model.primary` setelah mencoba fallback terkonfigurasi apa pun.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang sedang diminta
plus fallback yang dikonfigurasi.

Aturan:

- Model yang diminta selalu pertama.
- Fallback eksplisit yang dikonfigurasi di-deduplicate tetapi tidak difilter oleh allowlist
  model. Mereka diperlakukan sebagai niat operator yang eksplisit.
- Jika run saat ini sudah berada pada fallback terkonfigurasi di keluarga provider yang sama,
  OpenClaw tetap menggunakan rantai terkonfigurasi penuh.
- Jika run saat ini berada pada provider yang berbeda dari config dan model saat ini
  itu belum menjadi bagian dari rantai fallback terkonfigurasi, OpenClaw tidak
  menambahkan fallback terkonfigurasi yang tidak terkait dari provider lain.
- Saat run dimulai dari override, primary yang dikonfigurasi ditambahkan di
  akhir agar rantai dapat kembali menetap ke default normal setelah kandidat
  sebelumnya habis.

### Error mana yang memajukan fallback

Fallback model berlanjut pada:

- kegagalan autentikasi
- rate limit dan cooldown yang habis
- error overloaded/provider-sibuk
- error failover berbentuk timeout
- penonaktifan billing
- `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar model persisten yang usang tidak membuat loop percobaan ulang luar
- error tak dikenal lainnya ketika masih ada kandidat yang tersisa

Fallback model tidak berlanjut pada:

- abort eksplisit yang tidak berbentuk timeout/failover
- error context overflow yang seharusnya tetap berada di dalam logika Compaction/percobaan ulang
  (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, atau `ollama error: context
length exceeded`)
- error unknown final saat tidak ada kandidat tersisa

### Perilaku lewati cooldown vs probe

Saat setiap profil autentikasi untuk sebuah provider sudah berada dalam cooldown, OpenClaw
tidak otomatis melewati provider itu selamanya. OpenClaw membuat keputusan per kandidat:

- Kegagalan autentikasi persisten langsung melewati seluruh provider.
- Penonaktifan billing biasanya dilewati, tetapi kandidat utama masih dapat diprobe
  dengan throttle agar pemulihan tetap dimungkinkan tanpa restart.
- Kandidat utama dapat diprobe mendekati akhir cooldown, dengan throttle
  per provider.
- Sibling fallback pada provider yang sama dapat dicoba meskipun sedang cooldown ketika
  kegagalannya terlihat transien (`rate_limit`, `overloaded`, atau unknown). Ini
  sangat relevan ketika rate limit dicakup per model dan model sibling mungkin
  masih dapat pulih segera.
- Probe cooldown transien dibatasi satu per provider per run fallback agar
  satu provider tidak menahan fallback lintas provider.

## Override sesi dan pengalihan model live

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`,
pembaruan Compaction/sesi, dan rekonsiliasi sesi live semuanya membaca atau menulis
bagian dari entri sesi yang sama.

Artinya percobaan ulang fallback harus berkoordinasi dengan pengalihan model live:

- Hanya perubahan model eksplisit yang dipicu pengguna yang menandai pending live switch. Itu
  mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang dipicu sistem seperti rotasi fallback, override Heartbeat,
  atau Compaction tidak pernah menandai pending live switch sendiri.
- Sebelum percobaan ulang fallback dimulai, runner balasan mem-persist
  bidang override fallback yang dipilih ke entri sesi.
- Rekonsiliasi sesi live mengutamakan override sesi yang dipersist dibanding bidang model runtime yang usang.
- Jika percobaan fallback gagal, runner me-rollback hanya bidang override
  yang ditulisnya, dan hanya jika bidang-bidang itu masih cocok dengan kandidat gagal tersebut.

Ini mencegah race klasik:

1. Primary gagal.
2. Kandidat fallback dipilih di memori.
3. Penyimpanan sesi masih menyatakan primary lama.
4. Rekonsiliasi sesi live membaca status sesi yang usang.
5. Percobaan ulang kembali dipaksa ke model lama sebelum percobaan fallback
   dimulai.

Override fallback yang dipersist menutup celah itu, dan rollback yang sempit
menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang memberi makan log dan
pesan cooldown yang terlihat oleh pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan
  alasan failover serupa)
- status/kode opsional
- ringkasan error yang dapat dibaca manusia

Saat setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner
balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model
sementara terkena rate limit" dan menyertakan waktu kedaluwarsa cooldown tercepat saat diketahui.

Ringkasan cooldown itu sadar model:

- rate limit yang dicakup per model tetapi tidak terkait diabaikan untuk rantai
  provider/model yang dicoba
- jika blok yang tersisa adalah rate limit yang cocok dan dicakup per model, OpenClaw
  melaporkan waktu kedaluwarsa terakhir yang cocok dan masih memblokir model itu

## Config terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Models](/id/concepts/models) untuk ikhtisar yang lebih luas tentang pemilihan model dan fallback.
