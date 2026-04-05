---
read_when:
    - Mendiagnosis rotasi profil auth, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil auth atau model
    - Memahami bagaimana override model sesi berinteraksi dengan percobaan ulang fallback
summary: Bagaimana OpenClaw merotasi profil auth dan melakukan fallback antar model
title: Failover Model
x-i18n:
    generated_at: "2026-04-05T13:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover model

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk eksekusi teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

1. Model sesi yang saat ini dipilih.
2. `agents.defaults.model.fallbacks` yang dikonfigurasi secara berurutan.
3. Model utama yang dikonfigurasi di akhir saat eksekusi dimulai dari sebuah override.

Di dalam setiap kandidat, OpenClaw mencoba failover profil auth sebelum maju ke
kandidat model berikutnya.

Urutan tingkat tinggi:

1. Resolusikan model sesi aktif dan preferensi profil auth.
2. Bangun rantai kandidat model.
3. Coba provider saat ini dengan aturan rotasi/cooldown profil auth.
4. Jika provider tersebut habis dengan error yang layak failover, pindah ke kandidat
   model berikutnya.
5. Simpan override fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca
   sesi lain melihat provider/model yang sama yang akan digunakan runner.
6. Jika kandidat fallback gagal, kembalikan hanya field override sesi milik fallback
   saat field tersebut masih cocok dengan kandidat gagal itu.
7. Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail
   per percobaan dan waktu cooldown berakhir paling cepat saat diketahui.

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Reply runner
hanya menyimpan field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi lain yang lebih baru
seperti perubahan `/model` manual atau pembaruan rotasi sesi yang terjadi saat
percobaan sedang berjalan.

## Penyimpanan auth (key + OAuth)

OpenClaw menggunakan **profil auth** untuk API key dan token OAuth.

- Secret disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Config `auth.profiles` / `auth.order` hanya untuk **metadata + perutean** (tanpa secret).
- File OAuth lama hanya untuk impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan).

Detail lebih lanjut: [/concepts/oauth](/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil yang berbeda agar banyak akun dapat hidup berdampingan.

- Default: `provider:default` saat email tidak tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Saat sebuah provider memiliki banyak profil, OpenClaw memilih urutan seperti ini:

1. **Config eksplisit**: `auth.order[provider]` (jika disetel).
2. **Profil yang dikonfigurasi**: `auth.profiles` yang difilter menurut provider.
3. **Profil tersimpan**: entri dalam `auth-profiles.json` untuk provider tersebut.

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci utama:** jenis profil (**OAuth sebelum API key**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang paling lama lebih dulu, di dalam tiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan menurut waktu berakhir paling cepat.

### Kekakuan sesi (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat.
OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali sampai:

- sesi direset (`/new` / `/reset`)
- pemadatan selesai (jumlah pemadatan bertambah)
- profil sedang cooldown/dinonaktifkan

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi itu
dan tidak dirotasi otomatis sampai sesi baru dimulai.

Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**:
profil itu dicoba lebih dulu, tetapi OpenClaw dapat merotasi ke profil lain pada rate limit/timeout.
Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model
dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.

### Mengapa OAuth bisa "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round-robin dapat berpindah di antara keduanya antar pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (jika didukung oleh UI/permukaan chat Anda).

## Cooldown

Saat sebuah profil gagal karena error auth/rate-limit (atau timeout yang terlihat
seperti rate limiting), OpenClaw menandainya sebagai cooldown dan berpindah ke profil berikutnya.
Bucket rate-limit itu lebih luas daripada sekadar `429`: ini juga mencakup pesan provider
seperti `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti
`weekly/monthly limit reached`.
Error format/permintaan tidak valid (misalnya kegagalan validasi ID pemanggilan tool Cloud Code Assist)
dianggap layak failover dan menggunakan cooldown yang sama.
Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`,
`stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal
timeout/failover.
Teks server generik yang dicakup provider juga dapat masuk ke bucket timeout itu saat
sumbernya cocok dengan pola transien yang dikenal. Misalnya, teks Anthropic biasa
`An unknown error occurred` dan payload JSON `api_error` dengan teks server transien
seperti `internal server error`, `unknown error, 520`, `upstream error`,
atau `backend error` diperlakukan sebagai timeout yang layak failover. Teks upstream generik
khusus OpenRouter seperti `Provider returned error` biasa juga diperlakukan sebagai
timeout hanya saat konteks providernya benar-benar OpenRouter. Teks fallback internal
generik seperti `LLM request failed with an unknown error.` tetap konservatif dan
tidak memicu failover dengan sendirinya.

Cooldown rate-limit juga dapat dicakup model:

- OpenClaw mencatat `cooldownModel` untuk kegagalan rate-limit saat id model
  yang gagal diketahui.
- Model saudara pada provider yang sama masih dapat dicoba saat cooldown
  dicakup ke model yang berbeda.
- Jendela billing/dinonaktifkan tetap memblokir seluruh profil lintas model.

Cooldown menggunakan exponential backoff:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas atas)

Status disimpan dalam `auth-profiles.json` di bawah `usageStats`:

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

Kegagalan billing/kredit (misalnya “insufficient credits” / “credit balance too low”) diperlakukan layak failover, tetapi biasanya tidak bersifat sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **disabled** (dengan backoff yang lebih panjang) dan merotasi ke profil/provider berikutnya.

Tidak setiap respons yang terlihat seperti billing adalah `402`, dan tidak setiap HTTP `402` masuk
ke sini. OpenClaw mempertahankan teks billing eksplisit di jalur billing meskipun sebuah
provider mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap
dibatasi pada provider yang memilikinya (misalnya OpenRouter `403 Key limit
exceeded`). Sementara itu error `402` sementara untuk jendela penggunaan dan
batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` saat
pesannya tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, atau `organization spending limit exceeded`).
Error tersebut tetap berada pada jalur cooldown/failover singkat alih-alih jalur
penonaktifan billing yang panjang.

Status disimpan dalam `auth-profiles.json`:

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

- Backoff billing dimulai dari **5 jam**, berlipat ganda per kegagalan billing, dan dibatasi pada **24 jam**.
- Penghitung backoff direset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang overloaded mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Percobaan ulang overloaded menggunakan backoff **0 md** secara default.

## Fallback model

Jika semua profil untuk suatu provider gagal, OpenClaw berpindah ke model berikutnya dalam
`agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, rate limit, dan
timeout yang menghabiskan rotasi profil (error lain tidak memajukan fallback).

Error overloaded dan rate-limit ditangani lebih agresif daripada cooldown billing.
Secara default, OpenClaw mengizinkan satu percobaan ulang profil auth pada provider yang sama,
lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu.
Sinyal provider sibuk seperti `ModelNotReadyException` masuk ke bucket overloaded
tersebut. Atur ini dengan `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, dan
`auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah eksekusi dimulai dengan override model (hook atau CLI), fallback tetap berakhir pada
`agents.defaults.model.primary` setelah mencoba fallback yang dikonfigurasi.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta
ditambah fallback yang dikonfigurasi.

Aturan:

- Model yang diminta selalu pertama.
- Fallback eksplisit yang dikonfigurasi dideduplikasi tetapi tidak difilter menurut allowlist
  model. Fallback tersebut diperlakukan sebagai maksud operator yang eksplisit.
- Jika eksekusi saat ini sudah berada pada fallback terkonfigurasi dalam keluarga provider yang sama,
  OpenClaw tetap menggunakan rantai terkonfigurasi penuh.
- Jika eksekusi saat ini menggunakan provider yang berbeda dari config dan model saat ini
  belum menjadi bagian dari rantai fallback terkonfigurasi, OpenClaw tidak
  menambahkan fallback terkonfigurasi yang tidak terkait dari provider lain.
- Saat eksekusi dimulai dari override, model utama yang dikonfigurasi ditambahkan di
  akhir agar rantai dapat kembali ke default normal setelah kandidat sebelumnya habis.

### Error mana yang memajukan fallback

Fallback model berlanjut pada:

- kegagalan auth
- rate limit dan cooldown yang habis
- error overloaded/provider-busy
- error failover berbentuk timeout
- penonaktifan billing
- `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover sehingga model tersimpan yang usang tidak membuat loop percobaan ulang luar
- error tak dikenali lainnya saat masih ada kandidat yang tersisa

Fallback model tidak berlanjut pada:

- pembatalan eksplisit yang tidak berbentuk timeout/failover
- error luapan konteks yang harus tetap berada di dalam logika pemadatan/percobaan ulang
  (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, atau `ollama error: context
length exceeded`)
- error tak dikenal terakhir saat tidak ada kandidat tersisa

### Perilaku lewati cooldown vs probe

Saat setiap profil auth untuk suatu provider sudah dalam cooldown, OpenClaw
tidak otomatis melewati provider itu selamanya. OpenClaw membuat keputusan per kandidat:

- Kegagalan auth persisten langsung melewati seluruh provider.
- Penonaktifan billing biasanya dilewati, tetapi kandidat utama masih dapat diprobe
  dengan throttle agar pemulihan tetap mungkin tanpa memulai ulang.
- Kandidat utama dapat diprobe saat mendekati berakhirnya cooldown, dengan throttle per provider.
- Model saudara pada fallback provider yang sama dapat dicoba meskipun cooldown saat
  kegagalannya terlihat sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini
  sangat relevan saat sebuah rate limit dicakup model dan model saudara mungkin
  masih dapat pulih segera.
- Probe cooldown transien dibatasi satu kali per provider per eksekusi fallback agar
  satu provider tidak menghambat fallback lintas provider.

## Override sesi dan peralihan model langsung

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`,
pembaruan pemadatan/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis
bagian dari entri sesi yang sama.

Artinya percobaan ulang fallback harus berkoordinasi dengan peralihan model langsung:

- Hanya perubahan model eksplisit yang digerakkan pengguna yang menandai pending live switch. Itu
  mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi fallback, override heartbeat,
  atau pemadatan tidak pernah menandai pending live switch dengan sendirinya.
- Sebelum percobaan ulang fallback dimulai, reply runner menyimpan field override fallback
  yang dipilih ke entri sesi.
- Rekonsiliasi sesi langsung lebih mengutamakan override sesi yang tersimpan daripada
  field model runtime yang usang.
- Jika percobaan fallback gagal, runner mengembalikan hanya field override yang
  ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah race klasik:

1. Model utama gagal.
2. Kandidat fallback dipilih di memori.
3. Penyimpanan sesi masih menyatakan model utama lama.
4. Rekonsiliasi sesi langsung membaca status sesi yang usang.
5. Percobaan ulang dipaksa kembali ke model lama sebelum percobaan fallback
   dimulai.

Override fallback yang disimpan menutup celah itu, dan rollback yang sempit
menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang memberi makan log dan
pesan cooldown yang terlihat oleh pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan
  alasan failover serupa)
- status/kode opsional
- ringkasan error yang dapat dibaca manusia

Saat setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Reply runner luar
dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model
sementara terkena rate limit" dan menyertakan waktu cooldown berakhir paling cepat saat diketahui.

Ringkasan cooldown itu sadar model:

- rate limit yang dicakup model dan tidak terkait diabaikan untuk rantai
  provider/model yang dicoba
- jika sisa bloknya adalah rate limit yang cocok dan dicakup model, OpenClaw
  melaporkan waktu berakhir cocok terakhir yang masih memblokir model tersebut

## Config terkait

Lihat [Konfigurasi Gateway](/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Lihat [Models](/concepts/models) untuk gambaran umum yang lebih luas tentang pemilihan model dan fallback.
