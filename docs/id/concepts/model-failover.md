---
read_when:
    - Mendiagnosis rotasi profil autentikasi, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami bagaimana penggantian model sesi berinteraksi dengan percobaan ulang fallback
sidebarTitle: Model failover
summary: Bagaimana OpenClaw merotasi profil autentikasi dan melakukan fallback lintas model
title: Pengalihan model saat gagal
x-i18n:
    generated_at: "2026-07-04T15:36:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil autentikasi** dalam penyedia saat ini.
2. **Fallback model** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

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
  <Step title="Lanjutkan pada galat yang layak failover">
    Jika penyedia tersebut habis dengan galat yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Pertahankan override fallback">
    Pertahankan override fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca sesi lain melihat penyedia/model yang sama dengan yang akan digunakan runner. Override model yang dipertahankan ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit saat gagal">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan waktu kedaluwarsa cooldown terdekat ketika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempertahankan field pilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi lain yang lebih baru dan tidak terkait, seperti perubahan manual `/model` atau pembaruan rotasi sesi yang terjadi saat percobaan sedang berjalan.

## Kebijakan sumber pilihan

OpenClaw memisahkan penyedia/model yang dipilih dari alasan pemilihannya. Sumber tersebut mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Primer agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat eksplisit, atau berikan daftar tidak kosong untuk mengikutkan agen tersebut ke fallback model.
- **Override fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, dan model asal yang dipilih sebelum mencoba ulang. Override otomatis itu dapat terus menelusuri rantai fallback yang dikonfigurasi tanpa memeriksa primer pada setiap pesan, tetapi OpenClaw secara berkala memeriksa asal yang dikonfigurasi lagi dan menghapus override otomatis saat pulih. `/new`, `/reset`, dan `sessions.reset` juga menghapus override bersumber otomatis. Heartbeat berjalan tanpa `heartbeat.model` eksplisit menghapus override otomatis langsung ketika asalnya tidak lagi cocok dengan default yang dikonfigurasi saat ini.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pilihan sesi persis. Jika penyedia/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback yang dikonfigurasi dan tidak terkait.
- **Override sesi lama**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna agar pilihan lama yang eksplisit tidak diam-diam diubah menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` tugas cron adalah primer tugas, bukan override sesi pengguna. Ini menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat eksekusi cron ketat.

Interval pemeriksaan primer fallback otomatis adalah lima menit dan tidak dapat dikonfigurasi. OpenClaw mengingat pemeriksaan terbaru per sesi dan model primer sehingga primer yang gagal tidak dicoba ulang pada setiap giliran. OpenClaw mengirim pemberitahuan yang terlihat ketika sesi berpindah ke fallback dan pemberitahuan lain ketika kembali ke primer yang dipilih; OpenClaw tidak mengulang pemberitahuan pada setiap giliran fallback yang lengket.

## Cache lewati kegagalan autentikasi

Secara default, setiap giliran baru mempertahankan perilaku percobaan ulang fallback yang ada: OpenClaw
akan mencoba setiap kandidat fallback yang dikonfigurasi lagi, termasuk kandidat
non-primer yang baru-baru ini gagal dengan `auth` atau `auth_permanent`.

Operator yang lebih suka menekan kegagalan autentikasi berulang tersebut dapat ikut serta dengan:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Saat diaktifkan, OpenClaw mencatat marker lewati dalam memori yang berlingkup sesi untuk
kandidat fallback non-primer setelah kegagalan kelas autentikasi. Marker tersebut dikunci
berdasarkan id sesi, penyedia, dan model. Kandidat primer tidak pernah dilewati, sehingga
pilihan model pengguna eksplisit tetap memunculkan galat autentikasi sebenarnya. Cache bersifat
lokal proses dan dihapus saat Gateway dimulai ulang.

Nilainya adalah TTL dalam milidetik. `0` atau nilai yang tidak diatur menonaktifkan cache.
Nilai positif dibatasi antara 1 detik dan 10 menit.

## Pemberitahuan fallback yang terlihat pengguna

Ketika sesi berpindah ke fallback yang dipilih otomatis, OpenClaw mengirim pemberitahuan status di permukaan balasan yang sama:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Ketika pemeriksaan berikutnya berhasil dan sesi kembali ke primer yang dipilih, OpenClaw mengirim:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Pemberitahuan ini adalah pesan operasional, bukan konten asisten. Pemberitahuan dikirim sekali per perubahan status, termasuk giliran yang hanya memiliki efek samping jika memungkinkan, tetapi giliran fallback yang lengket tidak mengulanginya. Pengiriman melewati supresi balasan sumber normal, pemberitahuan tidak memakai slot balasan asisten pertama untuk channel berutas, dan dikecualikan dari teks-ke-ucapan serta ekstraksi komitmen.

## Penyimpanan autentikasi (kunci + OAuth)

OpenClaw menggunakan **profil autentikasi** untuk kunci API dan token OAuth.

- Secret dan status routing autentikasi runtime berada di `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi `auth.profiles` / `auth.order` adalah **metadata + routing saja** (tanpa secret).
- File OAuth lama yang hanya diimpor: `~/.openclaw/credentials/oauth.json` (diimpor ke store autentikasi per agen pada penggunaan pertama).
- File lama `auth-profiles.json`, `auth-state.json`, dan `auth.json` per agen diimpor oleh `openclaw doctor --fix`.

Detail lebih lanjut: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa penyedia)

## ID profil

Login OAuth membuat profil yang berbeda sehingga beberapa akun dapat hidup berdampingan.

- Default: `provider:default` ketika tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di store profil autentikasi `openclaw-agent.sqlite` per agen.

## Urutan rotasi

Ketika penyedia memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika diatur).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` difilter berdasarkan penyedia.
  </Step>
  <Step title="Profil tersimpan">
    Entri profil autentikasi SQLite per agen untuk penyedia.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci primer:** jenis profil (**OAuth sebelum kunci API**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang paling lama terlebih dahulu, dalam setiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan berdasarkan kedaluwarsa terdekat.

### Kelengketan sesi (ramah cache)

OpenClaw **menyematkan profil autentikasi yang dipilih per sesi** untuk menjaga cache penyedia tetap hangat. OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali hingga:

- sesi direset (`/new` / `/reset`)
- compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba terlebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain pada batas laju/timeout. Ketika profil asli tersedia lagi, eksekusi baru dapat lebih memilihnya kembali tanpa mengubah model atau runtime yang dipilih. Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih berganti profil.
</Note>

### Langganan OpenAI Codex plus cadangan kunci API

Untuk model agen OpenAI, autentikasi dan runtime terpisah. `openai/gpt-*` tetap berada di
harness Codex sementara autentikasi dapat merotasi antara profil langganan Codex dan
cadangan kunci API OpenAI.

Gunakan `auth.order.openai` untuk urutan yang terlihat pengguna:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Gunakan `openai:*` untuk profil OAuth ChatGPT/Codex dan profil kunci API OpenAI.
Ketika langganan mencapai batas penggunaan Codex,
OpenClaw mencatat waktu reset persis ketika Codex menyediakannya, mencoba profil autentikasi
berurutan berikutnya, dan menjaga eksekusi tetap di dalam harness Codex. Setelah waktu reset
berlalu, profil langganan memenuhi syarat lagi dan pilihan otomatis berikutnya dapat kembali
ke profil tersebut.

Gunakan profil yang disematkan pengguna hanya ketika Anda ingin memaksa satu akun/kunci untuk
sesi tersebut. Profil yang disematkan pengguna sengaja ketat dan tidak diam-diam melompat
ke profil lain.

## Cooldown

Ketika profil gagal karena galat autentikasi/batas laju (atau timeout yang tampak seperti pembatasan laju), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk ke bucket batas laju / timeout">
    Bucket batas laju itu lebih luas daripada `429` biasa: ini juga mencakup pesan penyedia seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Galat format/permintaan tidak valid biasanya terminal karena mencoba ulang payload yang sama akan gagal dengan cara yang sama, sehingga OpenClaw memunculkannya alih-alih merotasi profil autentikasi. Jalur perbaikan percobaan ulang yang diketahui dapat ikut serta secara eksplisit: misalnya kegagalan validasi ID panggilan alat Cloud Code Assist disanitasi dan dicoba ulang sekali melalui kebijakan `allowFormatRetry`. Galat alasan berhenti yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke bucket timeout itu ketika sumber cocok dengan pola transien yang diketahui. Misalnya, pesan wrapper stream runtime model polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap penyedia karena runtime model bersama memancarkannya ketika stream penyedia berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server transien seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks penyedia sebenarnya adalah OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK penyedia mungkin akan tidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw secara default membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` pada 60 detik dan langsung menampilkan respons yang dapat dicoba ulang lebih lama agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku percobaan ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown berbasis model">
    Cooldown batas laju juga dapat berbasis model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika id model yang gagal diketahui.
    - Model saudara pada penyedia yang sama masih dapat dicoba ketika cooldown dibatasi ke model yang berbeda.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil di seluruh model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

Status disimpan dalam status auth SQLite per agen di bawah `usageStats`:

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

Kegagalan penagihan/kredit (misalnya "insufficient credits" / "credit balance too low") diperlakukan sebagai layak failover, tetapi biasanya tidak bersifat sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih lama) dan berotasi ke profil/penyedia berikutnya.

<Note>
Tidak setiap respons yang tampak seperti penagihan adalah `402`, dan tidak setiap HTTP `402` masuk ke sini. OpenClaw mempertahankan teks penagihan eksplisit di jalur penagihan meskipun penyedia mengembalikan `401` atau `403`, tetapi pencocok khusus penyedia tetap dibatasi pada penyedia yang memilikinya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, kesalahan sementara `402` untuk jendela penggunaan dan batas pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` ketika pesannya tampak dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Kesalahan tersebut tetap berada pada jalur cooldown/failover singkat, bukan jalur penonaktifan penagihan yang panjang.
</Note>

Status disimpan dalam status auth SQLite per agen:

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

- Backoff penagihan dimulai pada **5 jam**, berlipat dua untuk setiap kegagalan penagihan, dan dibatasi pada **24 jam**.
- Penghitung backoff direset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang karena kelebihan beban mengizinkan **1 rotasi profil penyedia yang sama** sebelum fallback model.
- Percobaan ulang karena kelebihan beban menggunakan **backoff 0 md** secara default.

## Fallback model

Jika semua profil untuk sebuah penyedia gagal, OpenClaw berpindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, batas laju, dan timeout yang telah menghabiskan rotasi profil (kesalahan lain tidak memajukan fallback). Kesalahan penyedia yang tidak mengekspos detail yang cukup tetap diberi label secara tepat dalam status fallback: `empty_response` berarti penyedia tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti penyedia secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada pengklasifikasi yang cocok.

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada cooldown penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil auth penyedia yang sama, lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu. Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke bucket kelebihan beban tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Ketika sebuah run dimulai dari primary default terkonfigurasi, primary tugas cron, primary agen dengan fallback eksplisit, atau override fallback yang dipilih otomatis, OpenClaw dapat menelusuri rantai fallback terkonfigurasi yang sesuai. Primary agen tanpa fallback eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau override penyedia/model CLI satu kali) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan tersebut alih-alih menjawab dari fallback yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta ditambah fallback terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu menjadi yang pertama.
    - Fallback terkonfigurasi eksplisit dideduplikasi tetapi tidak difilter oleh daftar izin model. Fallback tersebut diperlakukan sebagai niat operator eksplisit.
    - Jika run saat ini sudah berada pada fallback terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan rantai terkonfigurasi lengkap.
    - Ketika tidak ada override fallback eksplisit yang diberikan, fallback terkonfigurasi dicoba sebelum primary terkonfigurasi meskipun model yang diminta menggunakan penyedia yang berbeda.
    - Ketika tidak ada override fallback eksplisit yang diberikan ke runner fallback, primary terkonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap pada default normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil menyediakan `fallbacksOverride`, runner menggunakan tepat model yang diminta ditambah daftar override tersebut. Daftar kosong menonaktifkan fallback model dan mencegah primary terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang memajukan fallback

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan auth
    - batas laju dan habisnya cooldown
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan failover berbentuk timeout
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur failover agar model persisten yang usang tidak membuat loop percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - abort eksplisit yang tidak berbentuk timeout/failover
    - kesalahan luapan konteks yang harus tetap berada di dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan akhir yang tidak diketahui ketika tidak ada kandidat tersisa
    - penolakan keamanan Claude Fable 5; permintaan kunci API langsung menangani hal tersebut di tingkat penyedia melalui fallback sisi server Anthropic ke `claude-opus-4-8` sebagai gantinya (lihat [Anthropic](/id/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Perilaku lewati cooldown vs probe

Ketika setiap profil auth untuk sebuah penyedia sudah berada dalam cooldown, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan auth persisten langsung melewati seluruh penyedia.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primary masih dapat diprobe dengan throttle agar pemulihan mungkin dilakukan tanpa memulai ulang.
    - Kandidat primary dapat diprobe menjelang kedaluwarsa cooldown, dengan throttle per penyedia.
    - Saudara fallback penyedia yang sama dapat dicoba meskipun cooldown aktif ketika kegagalan tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini sangat relevan ketika batas laju berbasis model dan model saudara mungkin masih dapat pulih segera.
    - Probe cooldown sementara dibatasi satu per penyedia per run fallback agar satu penyedia tidak menghambat fallback lintas penyedia.

  </Accordion>
</AccordionGroup>

## Override sesi dan pengalihan model langsung

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`, pembaruan compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti percobaan ulang fallback harus berkoordinasi dengan pengalihan model langsung:

- Hanya perubahan model yang didorong pengguna secara eksplisit yang menandai pengalihan langsung tertunda. Itu mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang didorong sistem seperti rotasi fallback, override Heartbeat, atau Compaction tidak pernah menandai pengalihan langsung tertunda sendiri.
- Override model yang didorong pengguna diperlakukan sebagai pilihan tepat untuk kebijakan fallback, sehingga penyedia terpilih yang tidak dapat dijangkau muncul sebagai kegagalan, bukan disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang fallback dimulai, runner balasan mempertahankan kolom override fallback yang dipilih ke entri sesi.
- Override fallback otomatis tetap dipilih pada giliran berikutnya sehingga OpenClaw tidak memprobe primary yang diketahui buruk pada setiap pesan. OpenClaw secara berkala memprobe origin terkonfigurasi lagi dan menghapus override otomatis ketika pulih; `/new`, `/reset`, dan `sessions.reset` langsung menghapus override yang bersumber otomatis.
- Balasan pengguna mengumumkan transisi fallback dan pemulihan fallback yang dihapus satu kali per perubahan status. Giliran fallback yang lengket tidak mengulang pemberitahuan.
- `/status` menampilkan model yang dipilih dan, ketika status fallback berbeda, model fallback aktif serta alasannya.
- Rekonsiliasi sesi langsung lebih memilih override sesi persisten daripada kolom model runtime yang usang.
- Jika kesalahan pengalihan langsung menunjuk ke kandidat berikutnya dalam rantai fallback aktif, OpenClaw langsung melompat ke model yang dipilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika percobaan fallback gagal, runner hanya mengembalikan kolom override yang ditulisnya, dan hanya jika kolom tersebut masih cocok dengan kandidat yang gagal tersebut.

Ini mencegah race klasik:

<Steps>
  <Step title="Primary gagal">
    Model primary yang dipilih gagal.
  </Step>
  <Step title="Fallback dipilih di memori">
    Kandidat fallback dipilih di memori.
  </Step>
  <Step title="Penyimpanan sesi masih menyebut primary lama">
    Penyimpanan sesi masih mencerminkan primary lama.
  </Step>
  <Step title="Rekonsiliasi langsung membaca status usang">
    Rekonsiliasi sesi langsung membaca status sesi yang usang.
  </Step>
  <Step title="Percobaan ulang tersentak kembali">
    Percobaan ulang tersentak kembali ke model lama sebelum percobaan fallback dimulai.
  </Step>
</Steps>

Override fallback persisten menutup jendela tersebut, dan rollback yang sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang memasok log dan pesan cooldown yang terlihat pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan kesalahan yang mudah dibaca manusia

Log terstruktur `model_fallback_decision` juga menyertakan kolom datar `fallbackStep*` ketika kandidat gagal, dilewati, atau fallback berikutnya berhasil. Kolom ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga eksportir log dan diagnostik dapat merekonstruksi kegagalan primary bahkan ketika fallback terminal juga gagal.

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model sementara terkena batas laju" dan menyertakan kedaluwarsa cooldown paling awal ketika diketahui.

Ringkasan cooldown tersebut sadar model:

- batas laju berbasis model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blok yang tersisa adalah batas laju berbasis model yang cocok, OpenClaw melaporkan kedaluwarsa cocok terakhir yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ikhtisar pemilihan model dan fallback yang lebih luas.
