---
read_when:
    - Mendiagnosis rotasi profil autentikasi, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami cara override model sesi berinteraksi dengan percobaan ulang fallback
sidebarTitle: Model failover
summary: Bagaimana OpenClaw merotasi profil auth dan melakukan fallback antar model
title: Pengalihan model saat gagal
x-i18n:
    generated_at: "2026-06-27T17:25:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendukungnya.

## Alur runtime

Untuk run teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

<Steps>
  <Step title="Selesaikan status sesi">
    Selesaikan model sesi aktif dan preferensi profil auth.
  </Step>
  <Step title="Bangun rantai kandidat">
    Bangun rantai kandidat model dari pemilihan model saat ini dan kebijakan fallback untuk sumber pemilihan tersebut. Default yang dikonfigurasi, primer cron job, dan model fallback yang dipilih otomatis dapat menggunakan fallback yang dikonfigurasi; pemilihan sesi pengguna eksplisit bersifat ketat.
  </Step>
  <Step title="Coba provider saat ini">
    Coba provider saat ini dengan aturan rotasi/cooldown profil auth.
  </Step>
  <Step title="Lanjut pada error yang layak failover">
    Jika provider itu habis dengan error yang layak failover, pindah ke kandidat model berikutnya.
  </Step>
  <Step title="Persistenkan override fallback">
    Persistenkan override fallback yang dipilih sebelum retry dimulai agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan runner. Override model yang dipersistenkan ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit saat gagal">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per upaya dan waktu berakhir cooldown terdekat jika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempersistenkan field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah retry fallback yang gagal menimpa mutasi sesi baru yang tidak terkait, seperti perubahan `/model` manual atau pembaruan rotasi sesi yang terjadi saat upaya sedang berjalan.

## Kebijakan sumber pemilihan

OpenClaw memisahkan provider/model yang dipilih dari alasan pemilihannya. Sumber itu mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Primer agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat eksplisit, atau berikan daftar tidak kosong untuk mengikutsertakan agen itu ke fallback model.
- **Override fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"`, dan model asal yang dipilih sebelum mencoba ulang. Override otomatis itu dapat terus berjalan melalui rantai fallback yang dikonfigurasi tanpa memeriksa primer pada setiap pesan, tetapi OpenClaw secara berkala memeriksa asal yang dikonfigurasi lagi dan menghapus override otomatis saat pulih. `/new`, `/reset`, dan `sessions.reset` juga menghapus override bersumber otomatis. Heartbeat yang berjalan tanpa `heartbeat.model` eksplisit menghapus override otomatis langsung ketika asalnya tidak lagi cocok dengan default yang saat ini dikonfigurasi.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pemilihan sesi yang tepat. Jika provider/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback yang dikonfigurasi yang tidak terkait.
- **Override sesi legacy**: entri sesi lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna sehingga pemilihan lama yang eksplisit tidak diam-diam diubah menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` cron job adalah primer job, bukan override sesi pengguna. Ini menggunakan fallback yang dikonfigurasi kecuali job menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat run cron ketat.

Interval probe primer fallback otomatis adalah lima menit dan tidak dapat dikonfigurasi. OpenClaw mengingat probe terbaru per sesi dan model primer sehingga primer yang gagal tidak dicoba ulang pada setiap giliran. OpenClaw mengirim pemberitahuan yang terlihat ketika sesi berpindah ke fallback dan pemberitahuan lain ketika kembali ke primer yang dipilih; pemberitahuan tidak diulang pada setiap giliran fallback yang lengket.

## Cache lewati kegagalan auth

Secara default, setiap giliran baru mempertahankan perilaku retry fallback yang ada: OpenClaw
akan mencoba setiap kandidat fallback yang dikonfigurasi lagi, termasuk kandidat
non-primer yang baru-baru ini gagal dengan `auth` atau `auth_permanent`.

Operator yang lebih memilih menekan kegagalan auth berulang tersebut dapat ikut serta dengan:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Saat diaktifkan, OpenClaw merekam marker lewati dalam memori, dengan cakupan sesi, untuk kandidat fallback
non-primer setelah kegagalan kelas auth. Marker diberi key
berdasarkan id sesi, provider, dan model. Kandidat primer tidak pernah dilewati, sehingga
pemilihan model pengguna eksplisit tetap memunculkan error auth yang sebenarnya. Cache bersifat
lokal proses dan dibersihkan saat Gateway dimulai ulang.

Nilainya adalah TTL dalam milidetik. `0` atau nilai yang tidak disetel menonaktifkan cache.
Nilai positif dibatasi antara 1 detik dan 10 menit.

## Pemberitahuan fallback yang terlihat pengguna

Ketika sesi berpindah ke fallback yang dipilih otomatis, OpenClaw mengirim pemberitahuan status di permukaan balasan yang sama:

```text
↪️ Fallback Model: <fallback> (dipilih <primary>; <reason>)
```

Ketika probe berikutnya berhasil dan sesi kembali ke primer yang dipilih, OpenClaw mengirim:

```text
↪️ Fallback Model dihapus: <primary> (sebelumnya <fallback>)
```

Pemberitahuan ini adalah pesan operasional, bukan konten asisten. Pemberitahuan dikirim satu kali per perubahan status, termasuk giliran yang hanya memiliki efek samping ketika memungkinkan, tetapi giliran fallback yang lengket tidak mengulanginya. Pengiriman melewati supresi balasan sumber normal, pemberitahuan tidak mengonsumsi slot balasan asisten pertama untuk channel berutas, dan dikecualikan dari text-to-speech serta ekstraksi commitment.

## Penyimpanan auth (key + OAuth)

OpenClaw menggunakan **profil auth** untuk API key dan token OAuth.

- Secret dan status routing auth runtime berada di `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.
- Konfigurasi `auth.profiles` / `auth.order` adalah **metadata + routing saja** (tanpa secret).
- File OAuth khusus impor legacy: `~/.openclaw/credentials/oauth.json` (diimpor ke penyimpanan auth per agen saat pertama digunakan).
- File legacy `auth-profiles.json`, `auth-state.json`, dan file `auth.json` per agen diimpor oleh `openclaw doctor --fix`.

Detail lebih lanjut: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID Profil

Login OAuth membuat profil berbeda agar beberapa akun dapat berdampingan.

- Default: `provider:default` ketika tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di penyimpanan profil auth `openclaw-agent.sqlite` per agen.

## Urutan rotasi

Ketika provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika disetel).
  </Step>
  <Step title="Profil yang dikonfigurasi">
    `auth.profiles` yang difilter berdasarkan provider.
  </Step>
  <Step title="Profil tersimpan">
    Entri profil auth SQLite per agen untuk provider.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Key primer:** jenis profil (**OAuth sebelum API key**).
- **Key sekunder:** `usageStats.lastUsed` (yang paling lama terlebih dahulu, dalam setiap jenis).
- **Profil cooldown/nonaktif** dipindahkan ke akhir, diurutkan berdasarkan waktu berakhir paling dekat.

### Kelengketan sesi (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat. OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan ulang hingga:

- sesi direset (`/new` / `/reset`)
- Compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/nonaktif

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis hingga sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil itu dicoba terlebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain pada batas laju/timeout. Ketika profil asli tersedia lagi, run baru dapat memilihnya lagi tanpa mengubah model atau runtime yang dipilih. Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih beralih profil.
</Note>

### Langganan OpenAI Codex ditambah cadangan API-key

Untuk model agen OpenAI, auth dan runtime terpisah. `openai/gpt-*` tetap berada pada
harness Codex sementara auth dapat berotasi antara profil langganan Codex dan
cadangan API-key OpenAI.

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

Gunakan `openai:*` untuk profil OAuth ChatGPT/Codex dan profil API-key
OpenAI. Ketika langganan mencapai batas penggunaan Codex,
OpenClaw merekam waktu reset persis ketika Codex menyediakannya, mencoba profil auth
berikutnya yang diurutkan, dan menjaga run tetap di dalam harness Codex. Setelah waktu reset
berlalu, profil langganan memenuhi syarat lagi dan pemilihan otomatis berikutnya dapat
kembali ke sana.

Gunakan profil yang disematkan pengguna hanya ketika Anda ingin memaksa satu akun/key untuk
sesi tersebut. Profil yang disematkan pengguna sengaja ketat dan tidak diam-diam melompat
ke profil lain.

## Cooldown

Ketika profil gagal karena error auth/batas laju (atau timeout yang terlihat seperti pembatasan laju), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk dalam bucket batas laju / timeout">
    Bucket batas laju itu lebih luas daripada `429` biasa: juga mencakup pesan provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Error format/permintaan tidak valid biasanya terminal karena mencoba ulang payload yang sama akan gagal dengan cara yang sama, jadi OpenClaw memunculkannya alih-alih merotasi profil auth. Jalur perbaikan-retry yang diketahui dapat ikut serta secara eksplisit: misalnya kegagalan validasi ID panggilan tool Cloud Code Assist disanitasi dan dicoba ulang sekali melalui kebijakan `allowFormatRetry`. Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk dalam bucket timeout itu ketika sumbernya cocok dengan pola transien yang diketahui. Misalnya, pesan wrapper stream runtime model polos `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap provider karena runtime model bersama memancarkannya ketika stream provider berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server transien seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks provider benar-benar OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK penyedia dapat tidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw secara default membatasi tunggu `retry-after-ms` / `retry-after` internal SDK pada 60 detik dan segera menampilkan respons yang dapat dicoba ulang lebih lama agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku coba ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown bercakupan model">
    Cooldown batas laju juga dapat dibatasi ke model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju saat id model yang gagal diketahui.
    - Model saudara pada penyedia yang sama masih dapat dicoba saat cooldown dibatasi ke model yang berbeda.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil di semua model.

  </Accordion>
</AccordionGroup>

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

Status disimpan dalam status autentikasi SQLite per agen di bawah `usageStats`:

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

Kegagalan penagihan/kredit (misalnya "kredit tidak mencukupi" / "saldo kredit terlalu rendah") diperlakukan sebagai layak failover, tetapi biasanya tidak sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih panjang) dan berotasi ke profil/penyedia berikutnya.

<Note>
Tidak semua respons yang berbentuk penagihan adalah `402`, dan tidak semua HTTP `402` masuk ke sini. OpenClaw mempertahankan teks penagihan eksplisit di jalur penagihan bahkan saat penyedia mengembalikan `401` atau `403`, tetapi pencocok khusus penyedia tetap dibatasi ke penyedia yang memilikinya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, kesalahan `402` sementara untuk jendela penggunaan dan batas belanja organisasi/workspace diklasifikasikan sebagai `rate_limit` saat pesannya terlihat dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Kesalahan tersebut tetap berada di jalur cooldown/failover singkat, bukan jalur penonaktifan penagihan yang panjang.
</Note>

Status disimpan dalam status autentikasi SQLite per agen:

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

- Backoff penagihan dimulai pada **5 jam**, berlipat dua per kegagalan penagihan, dan dibatasi pada **24 jam**.
- Penghitung backoff direset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Coba ulang karena kelebihan beban mengizinkan **1 rotasi profil penyedia yang sama** sebelum fallback model.
- Coba ulang karena kelebihan beban menggunakan **backoff 0 ms** secara default.

## Fallback model

Jika semua profil untuk suatu penyedia gagal, OpenClaw berpindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan autentikasi, batas laju, dan timeout yang sudah menghabiskan rotasi profil (kesalahan lain tidak memajukan fallback). Kesalahan penyedia yang tidak mengekspos detail yang cukup tetap diberi label dengan tepat dalam status fallback: `empty_response` berarti penyedia tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti penyedia secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada pengklasifikasi yang cocok.

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada cooldown penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi pada penyedia yang sama, lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu. Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke bucket kelebihan beban tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah run dimulai dari primary default terkonfigurasi, primary Cron, primary agen dengan fallback eksplisit, atau override fallback yang dipilih otomatis, OpenClaw dapat menelusuri rantai fallback terkonfigurasi yang cocok. Primary agen tanpa fallback eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau override penyedia/model CLI sekali pakai) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta plus fallback terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Fallback terkonfigurasi eksplisit dideduplikasi tetapi tidak difilter oleh allowlist model. Fallback tersebut diperlakukan sebagai niat operator yang eksplisit.
    - Jika run saat ini sudah berada pada fallback terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Saat tidak ada override fallback eksplisit yang diberikan, fallback terkonfigurasi dicoba sebelum primary terkonfigurasi meskipun model yang diminta menggunakan penyedia berbeda.
    - Saat tidak ada override fallback eksplisit yang diberikan ke runner fallback, primary terkonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap pada default normal setelah kandidat sebelumnya habis.
    - Saat pemanggil memberikan `fallbacksOverride`, runner menggunakan tepat model yang diminta plus daftar override tersebut. Daftar kosong menonaktifkan fallback model dan mencegah primary terkonfigurasi ditambahkan sebagai target coba ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang memajukan fallback

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan autentikasi
    - batas laju dan kehabisan cooldown
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan failover berbentuk timeout
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur failover agar model tersimpan yang basi tidak membuat loop coba ulang luar
    - kesalahan lain yang tidak dikenali saat masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - pembatalan eksplisit yang tidak berbentuk timeout/failover
    - kesalahan overflow konteks yang harus tetap berada di dalam logika Compaction/coba ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan akhir yang tidak diketahui saat tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku lewati cooldown vs probe

Saat setiap profil autentikasi untuk suatu penyedia sudah berada dalam cooldown, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan autentikasi persisten langsung melewati seluruh penyedia.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primary masih dapat diprobe dengan throttle agar pemulihan dimungkinkan tanpa restart.
    - Kandidat primary dapat diprobe mendekati kedaluwarsa cooldown, dengan throttle per penyedia.
    - Saudara fallback pada penyedia yang sama dapat dicoba meskipun ada cooldown saat kegagalan terlihat sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini terutama relevan saat batas laju bercakupan model dan model saudara mungkin masih pulih segera.
    - Probe cooldown sementara dibatasi menjadi satu per penyedia per run fallback agar satu penyedia tidak menghentikan fallback lintas penyedia.

  </Accordion>
</AccordionGroup>

## Override sesi dan peralihan model live

Perubahan model sesi adalah status bersama. Runner aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi live semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti coba ulang fallback harus berkoordinasi dengan peralihan model live:

- Hanya perubahan model yang secara eksplisit digerakkan pengguna yang menandai peralihan live tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi fallback, override Heartbeat, atau Compaction tidak pernah menandai peralihan live tertunda sendiri.
- Override model yang digerakkan pengguna diperlakukan sebagai pilihan persis untuk kebijakan fallback, sehingga penyedia terpilih yang tidak dapat dijangkau ditampilkan sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum coba ulang fallback dimulai, runner balasan mempertahankan field override fallback yang dipilih ke entri sesi.
- Override fallback otomatis tetap terpilih pada giliran berikutnya sehingga OpenClaw tidak memprobe primary yang diketahui buruk pada setiap pesan. OpenClaw secara berkala memprobe origin terkonfigurasi lagi dan menghapus override otomatis saat origin pulih; `/new`, `/reset`, dan `sessions.reset` segera menghapus override bersumber otomatis.
- Balasan pengguna mengumumkan transisi fallback dan pemulihan setelah fallback dihapus satu kali per perubahan status. Giliran fallback yang melekat tidak mengulangi pemberitahuan.
- `/status` menampilkan model yang dipilih dan, saat status fallback berbeda, model fallback aktif serta alasannya.
- Rekonsiliasi sesi live lebih memilih override sesi tersimpan daripada field model runtime yang basi.
- Jika kesalahan peralihan live menunjuk ke kandidat berikutnya dalam rantai fallback aktif, OpenClaw langsung melompat ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika upaya fallback gagal, runner hanya mengembalikan field override yang ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat yang gagal itu.

Ini mencegah race klasik:

<Steps>
  <Step title="Primary gagal">
    Model primary terpilih gagal.
  </Step>
  <Step title="Fallback dipilih dalam memori">
    Kandidat fallback dipilih dalam memori.
  </Step>
  <Step title="Penyimpanan sesi masih menyatakan primary lama">
    Penyimpanan sesi masih mencerminkan primary lama.
  </Step>
  <Step title="Rekonsiliasi live membaca status basi">
    Rekonsiliasi sesi live membaca status sesi yang basi.
  </Step>
  <Step title="Coba ulang tersentak kembali">
    Coba ulang tersentak kembali ke model lama sebelum upaya fallback dimulai.
  </Step>
</Steps>

Override fallback tersimpan menutup jendela tersebut, dan rollback sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per upaya yang memberi masukan ke log dan pesan cooldown yang terlihat oleh pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan failover serupa)
- status/kode opsional
- ringkasan kesalahan yang dapat dibaca manusia

Log `model_fallback_decision` terstruktur juga menyertakan field datar `fallbackStep*` saat kandidat gagal, dilewati, atau fallback berikutnya berhasil. Field ini membuat transisi yang dicoba eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga eksportir log dan diagnostik dapat merekonstruksi kegagalan primary bahkan saat fallback terminal juga gagal.

Saat setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner balasan luar dapat menggunakannya untuk membuat pesan yang lebih spesifik seperti "semua model untuk sementara terkena batas laju" dan menyertakan kedaluwarsa cooldown tercepat saat diketahui.

Ringkasan cooldown tersebut sadar model:

- batas laju bercakupan model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blok tersisa adalah batas laju bercakupan model yang cocok, OpenClaw melaporkan kedaluwarsa cocok terakhir yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk gambaran umum pemilihan model dan mekanisme cadangan yang lebih luas.
