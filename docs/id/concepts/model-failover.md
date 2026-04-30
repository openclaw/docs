---
read_when:
    - Mendiagnosis rotasi profil autentikasi, masa jeda, atau perilaku kembali ke model cadangan
    - Memperbarui aturan failover untuk profil autentikasi atau model
    - Memahami cara penggantian model sesi berinteraksi dengan percobaan ulang menggunakan mekanisme cadangan
sidebarTitle: Model failover
summary: Cara OpenClaw menggilir profil autentikasi dan beralih ke cadangan antar model
title: Pengalihan model saat gagal
x-i18n:
    generated_at: "2026-04-30T09:44:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk eksekusi teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

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
    Persist override fallback yang dipilih sebelum percobaan ulang dimulai agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan runner. Override model yang dipersist ditandai `modelOverrideSource: "auto"`.
  </Step>
  <Step title="Rollback secara sempit pada kegagalan">
    Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback ketika field tersebut masih cocok dengan kandidat yang gagal itu.
  </Step>
  <Step title="Lempar FallbackSummaryError jika habis">
    Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per percobaan dan waktu kedaluwarsa cooldown terdekat jika diketahui.
  </Step>
</Steps>

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner balasan hanya mempersist field pilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi lain yang lebih baru dan tidak terkait, seperti perubahan manual `/model` atau pembaruan rotasi sesi yang terjadi saat percobaan sedang berjalan.

## Kebijakan sumber pilihan

OpenClaw memisahkan provider/model yang dipilih dari alasan pemilihannya. Sumber tersebut mengontrol apakah rantai fallback diizinkan:

- **Default yang dikonfigurasi**: `agents.defaults.model.primary` menggunakan `agents.defaults.model.fallbacks`.
- **Primer agen**: `agents.list[].model` bersifat ketat kecuali objek model agen tersebut menyertakan `fallbacks` miliknya sendiri. Gunakan `fallbacks: []` untuk membuat perilaku ketat menjadi eksplisit, atau berikan daftar tidak kosong untuk mengikutsertakan agen tersebut ke fallback model.
- **Override fallback otomatis**: fallback runtime menulis `providerOverride`, `modelOverride`, dan `modelOverrideSource: "auto"` sebelum mencoba ulang. Override otomatis itu dapat terus berjalan di rantai fallback yang dikonfigurasi dan dihapus oleh `/new`, `/reset`, dan `sessions.reset`.
- **Override sesi pengguna**: `/model`, pemilih model, `session_status(model=...)`, dan `sessions.patch` menulis `modelOverrideSource: "user"`. Itu adalah pilihan sesi yang persis. Jika provider/model yang dipilih gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari fallback terkonfigurasi yang tidak terkait.
- **Override sesi lama**: entri sesi yang lebih lama mungkin memiliki `modelOverride` tanpa `modelOverrideSource`. OpenClaw memperlakukannya sebagai override pengguna agar pilihan lama yang eksplisit tidak diam-diam dikonversi menjadi perilaku fallback.
- **Model payload Cron**: `payload.model` / `--model` tugas cron adalah primer tugas, bukan override sesi pengguna. Ia menggunakan fallback yang dikonfigurasi kecuali tugas menyediakan `payload.fallbacks`; `payload.fallbacks: []` membuat eksekusi cron menjadi ketat.

## Penyimpanan auth (kunci + OAuth)

OpenClaw menggunakan **profil auth** untuk kunci API dan token OAuth.

- Rahasia berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- Status routing auth runtime berada di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfigurasi `auth.profiles` / `auth.order` adalah **metadata + routing saja** (tanpa rahasia).
- File OAuth lama hanya-impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat penggunaan pertama).

Detail selengkapnya: [OAuth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil berbeda agar beberapa akun dapat berdampingan.

- Default: `provider:default` ketika tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil berada di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Ketika provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

<Steps>
  <Step title="Konfigurasi eksplisit">
    `auth.order[provider]` (jika diatur).
  </Step>
  <Step title="Profil terkonfigurasi">
    `auth.profiles` difilter berdasarkan provider.
  </Step>
  <Step title="Profil tersimpan">
    Entri di `auth-profiles.json` untuk provider.
  </Step>
</Steps>

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round-robin:

- **Kunci primer:** jenis profil (**OAuth sebelum kunci API**).
- **Kunci sekunder:** `usageStats.lastUsed` (terlama lebih dulu, di dalam tiap jenis).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan berdasarkan kedaluwarsa terdekat.

### Kelengketan sesi (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** agar cache provider tetap hangat. Ia **tidak** berotasi pada setiap permintaan. Profil yang disematkan digunakan kembali sampai:

- sesi direset (`/new` / `/reset`)
- Compaction selesai (hitungan compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut dan tidak dirotasi otomatis sampai sesi baru dimulai.

<Note>
Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**: profil tersebut dicoba lebih dulu, tetapi OpenClaw dapat berotasi ke profil lain pada batas laju/timeout. Profil yang disematkan pengguna tetap terkunci ke profil itu; jika gagal dan fallback model dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.
</Note>

### Mengapa OAuth dapat "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil kunci API untuk provider yang sama, round-robin dapat berganti di antara keduanya lintas pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (jika didukung oleh UI/permukaan chat Anda).

## Cooldown

Ketika profil gagal karena error auth/batas laju (atau timeout yang terlihat seperti pembatasan laju), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.

<AccordionGroup>
  <Accordion title="Yang masuk ke bucket batas laju / timeout">
    Bucket batas laju itu lebih luas daripada `429` biasa: ia juga mencakup pesan provider seperti `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti `weekly/monthly limit reached`.

    Error format/permintaan tidak valid (misalnya kegagalan validasi ID panggilan alat Cloud Code Assist) diperlakukan sebagai layak failover dan menggunakan cooldown yang sama. Error alasan berhenti yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`, `stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal timeout/failover.

    Teks server generik juga dapat masuk ke bucket timeout tersebut ketika sumbernya cocok dengan pola sementara yang dikenal. Misalnya, pesan polos pembungkus stream pi-ai `An unknown error occurred` diperlakukan sebagai layak failover untuk setiap provider karena pi-ai memancarkannya ketika stream provider berakhir dengan `stopReason: "aborted"` atau `stopReason: "error"` tanpa detail spesifik. Payload JSON `api_error` dengan teks server sementara seperti `internal server error`, `unknown error, 520`, `upstream error`, atau `backend error` juga diperlakukan sebagai timeout yang layak failover.

    Teks upstream generik khusus OpenRouter seperti `Provider returned error` polos diperlakukan sebagai timeout hanya ketika konteks provider benar-benar OpenRouter. Teks fallback internal generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak memicu failover dengan sendirinya.

  </Accordion>
  <Accordion title="Batas retry-after SDK">
    Beberapa SDK provider mungkin jika tidak demikian akan tidur selama jendela `Retry-After` yang panjang sebelum mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan OpenAI, OpenClaw membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` pada 60 detik secara default dan segera mengekspos respons yang dapat dicoba ulang lebih panjang agar jalur failover ini dapat berjalan. Sesuaikan atau nonaktifkan batas tersebut dengan `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [Perilaku percobaan ulang](/id/concepts/retry).
  </Accordion>
  <Accordion title="Cooldown bercakupan model">
    Cooldown batas laju juga dapat bercakupan model:

    - OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika ID model yang gagal diketahui.
    - Model saudara pada provider yang sama masih dapat dicoba ketika cooldown dibatasi ke model yang berbeda.
    - Jendela penagihan/dinonaktifkan tetap memblokir seluruh profil lintas model.

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

## Penonaktifan penagihan

Kegagalan penagihan/kredit (misalnya "kredit tidak mencukupi" / "saldo kredit terlalu rendah") diperlakukan sebagai layak failover, tetapi biasanya tidak sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff yang lebih panjang) dan berotasi ke profil/provider berikutnya.

<Note>
Tidak setiap respons berbentuk penagihan adalah `402`, dan tidak setiap HTTP `402` masuk ke sini. OpenClaw mempertahankan teks penagihan eksplisit di jalur penagihan bahkan ketika provider mengembalikan `401` atau `403` sebagai gantinya, tetapi pencocok khusus provider tetap dibatasi ke provider yang memilikinya (misalnya OpenRouter `403 Key limit exceeded`).

Sementara itu, error `402` sementara untuk jendela penggunaan dan batas pengeluaran organisasi/ruang kerja diklasifikasikan sebagai `rate_limit` ketika pesannya terlihat dapat dicoba ulang (misalnya `weekly usage limit exhausted`, `daily limit reached, resets tomorrow`, atau `organization spending limit exceeded`). Error tersebut tetap berada di jalur cooldown/failover singkat alih-alih jalur penonaktifan penagihan yang panjang.
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

- Backoff penagihan dimulai pada **5 jam**, berlipat dua per kegagalan penagihan, dan dibatasi pada **24 jam**.
- Penghitung backoff direset jika profil belum gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang kelebihan beban mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Percobaan ulang kelebihan beban menggunakan **backoff 0 md** secara default.

## Fallback model

Jika semua profil untuk sebuah provider gagal, OpenClaw berpindah ke model berikutnya di `agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, batas laju, dan timeout yang menghabiskan rotasi profil (error lain tidak melanjutkan fallback). Error provider yang tidak mengekspos detail yang cukup tetap diberi label secara presisi dalam status fallback: `empty_response` berarti provider tidak mengembalikan pesan atau status yang dapat digunakan, `no_error_details` berarti provider secara eksplisit mengembalikan `Unknown error (no error details in response)`, dan `unclassified` berarti OpenClaw mempertahankan pratinjau mentah tetapi belum ada classifier yang mencocokkannya.

Kesalahan kelebihan beban dan batas laju ditangani lebih agresif daripada jeda penagihan. Secara default, OpenClaw mengizinkan satu percobaan ulang profil autentikasi penyedia yang sama, lalu beralih ke model cadangan terkonfigurasi berikutnya tanpa menunggu. Sinyal penyedia sibuk seperti `ModelNotReadyException` masuk ke kelompok kelebihan beban tersebut. Sesuaikan ini dengan `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs`, dan `auth.cooldowns.rateLimitedProfileRotations`.

Saat sebuah eksekusi dimulai dari primer default terkonfigurasi, primer pekerjaan cron, primer agen dengan cadangan eksplisit, atau penggantian cadangan yang dipilih otomatis, OpenClaw dapat menelusuri rantai cadangan terkonfigurasi yang cocok. Primer agen tanpa cadangan eksplisit dan pilihan pengguna eksplisit (misalnya `/model ollama/qwen3.5:27b`, pemilih model, `sessions.patch`, atau penggantian penyedia/model CLI satu kali) bersifat ketat: jika penyedia/model tersebut tidak dapat dijangkau atau gagal sebelum menghasilkan balasan, OpenClaw melaporkan kegagalan alih-alih menjawab dari cadangan yang tidak terkait.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang sedang diminta ditambah cadangan terkonfigurasi.

<AccordionGroup>
  <Accordion title="Aturan">
    - Model yang diminta selalu berada di urutan pertama.
    - Cadangan terkonfigurasi eksplisit dideduplikasi tetapi tidak difilter oleh daftar izin model. Cadangan tersebut diperlakukan sebagai maksud operator eksplisit.
    - Jika eksekusi saat ini sudah berada pada cadangan terkonfigurasi dalam keluarga penyedia yang sama, OpenClaw tetap menggunakan seluruh rantai terkonfigurasi.
    - Jika eksekusi saat ini berada pada penyedia yang berbeda dari konfigurasi dan model saat ini belum menjadi bagian dari rantai cadangan terkonfigurasi, OpenClaw tidak menambahkan cadangan terkonfigurasi yang tidak terkait dari penyedia lain.
    - Ketika tidak ada penggantian cadangan eksplisit yang diberikan ke penjalan cadangan, primer terkonfigurasi ditambahkan di akhir agar rantai dapat kembali menetap pada default normal setelah kandidat sebelumnya habis.
    - Ketika pemanggil menyediakan `fallbacksOverride`, penjalan menggunakan persis model yang diminta ditambah daftar penggantian tersebut. Daftar kosong menonaktifkan cadangan model dan mencegah primer terkonfigurasi ditambahkan sebagai target percobaan ulang tersembunyi.

  </Accordion>
</AccordionGroup>

### Kesalahan yang memajukan cadangan

<Tabs>
  <Tab title="Berlanjut pada">
    - kegagalan autentikasi
    - batas laju dan habisnya jeda
    - kesalahan kelebihan beban/penyedia sibuk
    - kesalahan alih-gagal berbentuk batas waktu
    - penonaktifan penagihan
    - `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur alih-gagal agar model tersimpan yang usang tidak membuat loop percobaan ulang luar
    - kesalahan lain yang tidak dikenali ketika masih ada kandidat tersisa

  </Tab>
  <Tab title="Tidak berlanjut pada">
    - pembatalan eksplisit yang tidak berbentuk batas waktu/alih-gagal
    - kesalahan luapan konteks yang harus tetap berada di dalam logika Compaction/percobaan ulang (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model`, atau `ollama error: context length exceeded`)
    - kesalahan akhir yang tidak dikenal ketika tidak ada kandidat tersisa

  </Tab>
</Tabs>

### Perilaku lewati jeda vs probe

Ketika setiap profil autentikasi untuk sebuah penyedia sudah berada dalam jeda, OpenClaw tidak otomatis melewati penyedia tersebut selamanya. OpenClaw membuat keputusan per kandidat:

<AccordionGroup>
  <Accordion title="Keputusan per kandidat">
    - Kegagalan autentikasi persisten langsung melewati seluruh penyedia.
    - Penonaktifan penagihan biasanya dilewati, tetapi kandidat primer masih dapat diprobe dengan pembatasan agar pemulihan memungkinkan tanpa memulai ulang.
    - Kandidat primer dapat diprobe mendekati berakhirnya jeda, dengan pembatasan per penyedia.
    - Saudara cadangan penyedia yang sama dapat dicoba meskipun ada jeda ketika kegagalannya tampak sementara (`rate_limit`, `overloaded`, atau tidak diketahui). Ini terutama relevan ketika batas laju berskala model dan model saudara mungkin masih bisa pulih segera.
    - Probe jeda sementara dibatasi satu per penyedia per eksekusi cadangan agar satu penyedia tidak menghambat cadangan lintas penyedia.

  </Accordion>
</AccordionGroup>

## Penggantian sesi dan peralihan model langsung

Perubahan model sesi adalah status bersama. Penjalan aktif, perintah `/model`, pembaruan Compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis bagian dari entri sesi yang sama.

Itu berarti percobaan ulang cadangan harus berkoordinasi dengan peralihan model langsung:

- Hanya perubahan model yang didorong pengguna secara eksplisit yang menandai peralihan langsung tertunda. Ini mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang didorong sistem seperti rotasi cadangan, penggantian Heartbeat, atau Compaction tidak pernah menandai peralihan langsung tertunda sendiri.
- Penggantian model yang didorong pengguna diperlakukan sebagai pilihan persis untuk kebijakan cadangan, sehingga penyedia terpilih yang tidak dapat dijangkau muncul sebagai kegagalan alih-alih disamarkan oleh `agents.defaults.model.fallbacks`.
- Sebelum percobaan ulang cadangan dimulai, penjalan balasan menyimpan kolom penggantian cadangan terpilih ke entri sesi.
- Penggantian cadangan otomatis tetap dipilih pada giliran berikutnya sehingga OpenClaw tidak memprobe primer yang diketahui bermasalah pada setiap pesan. `/new`, `/reset`, dan `sessions.reset` menghapus penggantian yang bersumber otomatis dan mengembalikan sesi ke default terkonfigurasi.
- `/status` menampilkan model terpilih dan, ketika status cadangan berbeda, model cadangan aktif serta alasannya.
- Rekonsiliasi sesi langsung lebih memilih penggantian sesi tersimpan daripada kolom model runtime yang usang.
- Jika kesalahan peralihan langsung menunjuk ke kandidat berikutnya dalam rantai cadangan aktif, OpenClaw langsung melompat ke model terpilih tersebut alih-alih menelusuri kandidat yang tidak terkait terlebih dahulu.
- Jika percobaan cadangan gagal, penjalan hanya membatalkan kolom penggantian yang ditulisnya, dan hanya jika kolom tersebut masih cocok dengan kandidat gagal tersebut.

Ini mencegah race klasik:

<Steps>
  <Step title="Primer gagal">
    Model primer terpilih gagal.
  </Step>
  <Step title="Cadangan dipilih di memori">
    Kandidat cadangan dipilih di memori.
  </Step>
  <Step title="Penyimpanan sesi masih menyatakan primer lama">
    Penyimpanan sesi masih mencerminkan primer lama.
  </Step>
  <Step title="Rekonsiliasi langsung membaca status usang">
    Rekonsiliasi sesi langsung membaca status sesi yang usang.
  </Step>
  <Step title="Percobaan ulang tersentak kembali">
    Percobaan ulang tersentak kembali ke model lama sebelum percobaan cadangan dimulai.
  </Step>
</Steps>

Penggantian cadangan tersimpan menutup celah itu, dan pembatalan sempit menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang mengisi log dan pesan jeda yang ditampilkan kepada pengguna:

- penyedia/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan alasan alih-gagal serupa)
- status/kode opsional
- ringkasan kesalahan yang dapat dibaca manusia

Log `model_fallback_decision` terstruktur juga menyertakan kolom datar `fallbackStep*` ketika kandidat gagal, dilewati, atau cadangan berikutnya berhasil. Kolom-kolom ini membuat transisi yang dicoba menjadi eksplisit (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`) sehingga pengekspor log dan diagnostik dapat merekonstruksi kegagalan primer bahkan ketika cadangan akhir juga gagal.

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Penjalan balasan luar dapat menggunakannya untuk membangun pesan yang lebih spesifik seperti "semua model sementara dibatasi lajunya" dan menyertakan waktu berakhir jeda terdekat ketika diketahui.

Ringkasan jeda tersebut sadar model:

- batas laju berskala model yang tidak terkait diabaikan untuk rantai penyedia/model yang dicoba
- jika blok tersisa adalah batas laju berskala model yang cocok, OpenClaw melaporkan waktu berakhir terakhir yang cocok yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk ikhtisar pemilihan model dan cadangan yang lebih luas.
