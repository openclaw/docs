---
read_when:
    - Mendiagnosis rotasi profil auth, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil auth atau model
    - Memahami bagaimana override model sesi berinteraksi dengan retry fallback
sidebarTitle: Model failover
summary: Bagaimana OpenClaw merotasi profil auth dan melakukan fallback di berbagai model
title: Failover model
x-i18n:
    generated_at: "2026-04-26T11:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk run teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

<Steps>
  <Step title="Resolve session state">
    Resolve model sesi aktif dan preferensi auth-profile.
  </Step>
  <Step title="Build candidate chain">
    Bangun rantai kandidat model dari model sesi yang saat ini dipilih, lalu `agents.defaults.model.fallbacks` secara berurutan, diakhiri dengan primary yang dikonfigurasi ketika run dimulai dari override.
  </Step>
  <Step title="Try the current provider">
    Coba provider saat ini dengan aturan rotasi/cooldown auth-profile.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Jika provider tersebut habis dengan error yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Persist fallback override">
    Persist override fallback yang dipilih sebelum retry dimulai agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan runner.
  </Step>
  <Step title="Roll back narrowly on failure">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per-attempt dan waktu kedaluwarsa cooldown tercepat saat diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mem-persist field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah retry fallback yang gagal menimpa mutasi sesi lain yang lebih baru dan tidak terkait seperti perubahan `/model` manual atau pembaruan rotasi sesi yang terjadi saat attempt sedang berjalan.

## Penyimpanan auth (key + OAuth)

OpenClaw menggunakan **profil auth** untuk API key dan token OAuth.

- Secret disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Status routing auth runtime disimpan di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Config `auth.profiles` / `auth.order` hanya untuk **metadata + routing** (tanpa secret).
- File OAuth lama khusus impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan).

Detail lebih lanjut: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil yang berbeda agar beberapa akun dapat hidup berdampingan.

- Default: `provider:default` ketika tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Saat sebuah provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (jika diatur).
  </Step>
  <Step title="Configured profiles">
    `auth.profiles` yang difilter berdasarkan provider.
  </Step>
  <Step title="Stored profiles">
    Entri di `auth-profiles.json` untuk provider tersebut.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Key utama:** jenis profil (**OAuth sebelum API key**).
- **Key sekunder:** `usageStats.lastUsed` (yang paling lama digunakan lebih dulu, dalam setiap jenis).
- **Profil cooldown/disabled** dipindahkan ke akhir, diurutkan berdasarkan kedaluwarsa tercepat.

### Session stickiness (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat. OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali sampai:

- sesi di-reset (`/new` / `/reset`)
- Compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/disabled

Pemilihan manual melalui `/model …@<profileId>` menetapkan **user override** untuk sesi tersebut dan tidak dirotasi otomatis sampai sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh session router) diperlakukan sebagai **preferensi**: dicoba lebih dulu, tetapi OpenClaw dapat merotasi ke profil lain saat terkena rate limit/timeout. Profil yang disematkan pengguna tetap terkunci ke profil itu; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.
</Note>

### Mengapa OAuth bisa "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round-robin dapat berpindah di antara keduanya antar pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (saat didukung oleh UI/surface chat Anda).

## Cooldown

Saat sebuah profil gagal karena error auth/rate limit (atau timeout yang terlihat seperti rate limiting), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Apa yang masuk ke bucket rate-limit / timeout">
    Bucket rate-limit itu lebih luas daripada sekadar `429`: ini juga mencakup pesan provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Error format/invalid-request (misalnya kegagalan validasi ID pemanggilan tool Cloud Code Assist) diperlakukan sebagai layak failover dan menggunakan cooldown yang sama. Error stop-reason kompatibel OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke bucket timeout saat sumbernya cocok dengan pola transien yang diketahui. Misalnya, pesan stream-wrapper pi-ai polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap provider karena pi-ai mengeluarkannya saat stream provider berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server transien seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks provider memang OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK provider dapat tidur terlalu lama pada jendela `Retry-After` sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` hingga 60 detik secara default dan langsung menampilkan respons retryable yang lebih lama agar jalur failover ini dapat berjalan. Atur atau nonaktifkan batas ini dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Retry behavior](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown berskala model">
    Cooldown rate-limit juga bisa berskala model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan rate-limit saat ID model yang gagal diketahui.
    - Model saudara pada provider yang sama masih dapat dicoba ketika cooldown dibatasi ke model yang berbeda.
    - Jendela billing/disabled tetap memblokir seluruh profil di semua model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan exponential backoff:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas atas)

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

## Nonaktif karena billing

Kegagalan billing/kredit (misalnya "insufficient credits" / "credit balance too low") diperlakukan sebagai layak failover, tetapi biasanya tidak bersifat transien. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **disabled** (dengan backoff yang lebih panjang) dan merotasi ke profil/provider berikutnya.

<Note>
Tidak semua respons yang tampak seperti billing adalah `402`, dan tidak semua HTTP `402` masuk ke sini. OpenClaw mempertahankan teks billing eksplisit di jalur billing bahkan ketika provider mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap dibatasi pada provider pemiliknya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, error `402` sementara untuk jendela penggunaan dan batas belanja organisasi/workspace diklasifikasikan sebagai `rate_limit` ketika pesannya tampak bisa dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Ini tetap berada di jalur cooldown/failover singkat alih-alih jalur disable billing yang panjang.
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

- Backoff billing dimulai dari **5 jam**, berlipat dua pada setiap kegagalan billing, dan dibatasi hingga **24 jam**.
- Penghitung backoff di-reset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Retry overloaded mengizinkan **1 rotasi profil pada provider yang sama** sebelum fallback model.
- Retry overloaded menggunakan backoff **0 ms** secara default.

## Fallback model

Jika semua profil untuk suatu provider gagal, OpenClaw berpindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, rate limit, dan timeout yang menghabiskan rotasi profil (error lain tidak memajukan fallback).

Error overloaded dan rate-limit ditangani lebih agresif daripada cooldown billing. Secara default, OpenClaw mengizinkan satu retry auth-profile pada provider yang sama, lalu beralih ke fallback model berikutnya yang dikonfigurasi tanpa menunggu. Sinyal provider-busy seperti `ModelNotReadyException` masuk ke bucket overloaded tersebut. Atur ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah run dimulai dengan override model (hook atau CLI), fallback tetap berakhir di `agents.defaults.model.primary` setelah mencoba fallback yang dikonfigurasi.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta ditambah fallback yang dikonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu pertama.
    - Fallback eksplisit yang dikonfigurasi di-deduplicate tetapi tidak difilter oleh allowlist model. Ini diperlakukan sebagai niat operator yang eksplisit.
    - Jika run saat ini sudah berada pada fallback yang dikonfigurasi dalam keluarga provider yang sama, OpenClaw tetap menggunakan rantai terkonfigurasi penuh.
    - Jika run saat ini berada pada provider yang berbeda dari config dan model saat ini belum menjadi bagian dari rantai fallback yang dikonfigurasi, OpenClaw tidak menambahkan fallback terkonfigurasi yang tidak terkait dari provider lain.
    - Saat run dimulai dari override, primary yang dikonfigurasi ditambahkan di akhir agar rantai dapat kembali ke default normal setelah kandidat sebelumnya habis.

  </Accordion>
</AccordionGroup>

### Error mana yang memajukan fallback

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan auth
    - rate limit dan cooldown yang habis
    - error overloaded/provider-busy
    - error failover berbentuk timeout
    - disabled karena billing
    - `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar model persisten yang stale tidak membuat loop retry luar
    - error lain yang tidak dikenali saat masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - abort eksplisit yang tidak berbentuk timeout/failover
    - error context overflow yang seharusnya tetap berada di dalam logika compaction/retry (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - error unknown terakhir ketika tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku lewati cooldown vs probe

Saat setiap profil auth untuk suatu provider sudah berada dalam cooldown, OpenClaw tidak otomatis melewati provider itu selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan auth persisten langsung melewati seluruh provider.
    - Disabled karena billing biasanya dilewati, tetapi kandidat primary masih dapat diprobe dengan throttle agar pemulihan tetap mungkin tanpa restart.
    - Kandidat primary dapat diprobe mendekati kedaluwarsa cooldown, dengan throttle per provider.
    - Sibling fallback pada provider yang sama dapat dicoba meskipun sedang cooldown ketika kegagalannya terlihat transien (`rate_limit`, `overloaded`, atau unknown). Ini terutama relevan ketika rate limit berskala model dan model sibling mungkin langsung pulih.
    - Probe cooldown transien dibatasi satu kali per provider per fallback run agar satu provider tidak menahan fallback lintas provider.

  </Accordion>
</AccordionGroup>

## Override sesi dan switching model live

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`, pembaruan compaction/sesi, dan rekonsiliasi live-session semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti retry fallback harus berkoordinasi dengan switching model live:

- Hanya perubahan model eksplisit yang digerakkan pengguna yang menandai live switch tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi fallback, override heartbeat, atau compaction tidak pernah menandai live switch tertunda dengan sendirinya.
- Sebelum retry fallback dimulai, runner balasan mem-persist field override fallback yang dipilih ke entri sesi.
- Rekonsiliasi live-session lebih memilih override sesi persisten daripada field model runtime yang stale.
- Jika attempt fallback gagal, runner me-roll back hanya field override yang ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah race klasik:

<Steps>
  <Step title="Primary fails">
    Model primary yang dipilih gagal.
  </Step>
  <Step title="Fallback chosen in memory">
    Kandidat fallback dipilih di memori.
  </Step>
  <Step title="Session store still says old primary">
    Penyimpanan sesi masih mencerminkan primary lama.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Rekonsiliasi live-session membaca status sesi yang stale.
  </Step>
  <Step title="Retry snapped back">
    Retry kembali dipaksa ke model lama sebelum attempt fallback dimulai.
  </Step>
</Steps>

Override fallback yang persisten menutup celah itu, dan rollback sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per-attempt yang menjadi masukan untuk log dan pesan cooldown yang terlihat pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/code opsional
- ringkasan error yang mudah dibaca manusia

Saat setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model sedang terkena rate limit sementara" dan menyertakan kedaluwarsa cooldown tercepat saat diketahui.

Ringkasan cooldown itu sadar model:

- rate limit berskala model yang tidak terkait diabaikan untuk rantai provider/model yang dicoba
- jika pemblokiran yang tersisa adalah rate limit berskala model yang cocok, OpenClaw melaporkan kedaluwarsa cocok terakhir yang masih memblokir model tersebut

## Config terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Lihat [Models](/id/concepts/models) untuk gambaran umum yang lebih luas tentang pemilihan model dan fallback.
