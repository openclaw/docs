---
read_when:
    - Debugging peristiwa penyelesaian exec node yang berulang
    - Mengerjakan deduplikasi Heartbeat/peristiwa sistem
summary: Catatan investigasi untuk injeksi penyelesaian eksekusi async duplikat
title: Investigasi duplikat penyelesaian eksekusi async
x-i18n:
    generated_at: "2026-04-24T09:25:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Cakupan

- Sesi: `agent:main:telegram:group:-1003774691294:topic:1`
- Gejala: penyelesaian exec async yang sama untuk sesi/run `keen-nexus` tercatat dua kali di LCM sebagai giliran pengguna.
- Tujuan: mengidentifikasi apakah ini kemungkinan besar adalah injeksi sesi duplikat atau sekadar retry pengiriman keluar biasa.

## Kesimpulan

Kemungkinan besar ini adalah **injeksi sesi duplikat**, bukan retry pengiriman keluar murni.

Celah terkuat di sisi Gateway ada pada **jalur penyelesaian exec node**:

1. Penyelesaian exec di sisi node mengirim `exec.finished` dengan `runId` lengkap.
2. Gateway `server-node-events` mengubahnya menjadi peristiwa sistem dan meminta Heartbeat.
3. Run Heartbeat menyuntikkan blok peristiwa sistem yang sudah dikuras ke prompt agen.
4. Runner tertanam menyimpan prompt tersebut sebagai giliran pengguna baru di transkrip sesi.

Jika `exec.finished` yang sama mencapai Gateway dua kali untuk `runId` yang sama karena alasan apa pun (replay, duplikat reconnect, resend upstream, producer terduplikasi), OpenClaw saat ini **tidak memiliki pemeriksaan idempotensi yang dikunci oleh `runId`/`contextKey`** pada jalur ini. Salinan kedua akan menjadi pesan pengguna kedua dengan konten yang sama.

## Jalur Kode yang Tepat

### 1. Producer: peristiwa penyelesaian exec node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` mengirim `node.event` dengan peristiwa `exec.finished`.
  - Payload mencakup `sessionKey` dan `runId` lengkap.

### 2. Ingesti peristiwa Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Menangani `exec.finished`.
  - Membangun teks:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Mengantrikannya melalui:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Segera meminta wake:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Kelemahan deduplikasi peristiwa sistem

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` hanya menekan **teks duplikat yang berurutan**:
    - `if (entry.lastText === cleaned) return false`
  - Fungsi ini menyimpan `contextKey`, tetapi **tidak** menggunakan `contextKey` untuk idempotensi.
  - Setelah drain, penekanan duplikat di-reset.

Ini berarti `exec.finished` yang direplay dengan `runId` yang sama dapat diterima lagi nanti, meskipun kode tersebut sudah memiliki kandidat idempotensi yang stabil (`exec:<runId>`).

### 4. Penanganan wake bukan pengganda utama

- `src/infra/heartbeat-wake.ts:79-117`
  - Wake digabungkan berdasarkan `(agentId, sessionKey)`.
  - Permintaan wake duplikat untuk target yang sama diciutkan menjadi satu entri wake tertunda.

Ini membuat **penanganan wake duplikat saja** menjadi penjelasan yang lebih lemah dibandingkan ingesti peristiwa duplikat.

### 5. Heartbeat mengonsumsi peristiwa dan mengubahnya menjadi input prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight mengintip peristiwa sistem yang tertunda dan mengklasifikasikan run exec-event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` menguras antrean untuk sesi.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Blok peristiwa sistem yang sudah dikuras ditambahkan di awal isi prompt agen.

### 6. Titik injeksi transkrip

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` mengirim prompt lengkap ke sesi PI tertanam.
  - Itulah titik ketika prompt yang berasal dari penyelesaian menjadi giliran pengguna yang disimpan.

Jadi begitu peristiwa sistem yang sama dibangun ulang ke prompt dua kali, pesan pengguna LCM duplikat memang diharapkan.

## Mengapa retry pengiriman keluar biasa kurang mungkin

Ada jalur kegagalan keluar yang nyata di runner Heartbeat:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Respons dihasilkan terlebih dahulu.
  - Pengiriman keluar terjadi kemudian melalui `deliverOutboundPayloads(...)`.
  - Kegagalan di sana mengembalikan `{ status: "failed" }`.

Namun, untuk entri antrean peristiwa sistem yang sama, ini saja **tidak cukup** untuk menjelaskan giliran pengguna duplikat:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Antrean peristiwa sistem sudah dikuras sebelum pengiriman keluar.

Jadi retry pengiriman channel dengan sendirinya tidak akan membuat ulang peristiwa yang sama persis di antrean. Ini bisa menjelaskan pengiriman eksternal yang hilang/gagal, tetapi tidak dengan sendirinya menjelaskan pesan pengguna sesi identik kedua.

## Kemungkinan sekunder dengan keyakinan lebih rendah

Ada loop retry run penuh di runner agen:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Kegagalan sementara tertentu dapat me-retry seluruh run dan mengirim ulang `commandBody` yang sama.

Ini dapat menduplikasi prompt pengguna yang disimpan **dalam eksekusi balasan yang sama** jika prompt sudah ditambahkan sebelum kondisi retry terpicu.

Saya menempatkannya di bawah ingesti `exec.finished` duplikat karena:

- jarak yang diamati sekitar 51 detik, yang lebih terlihat seperti wake/giliran kedua daripada retry dalam proses;
- laporan tersebut sudah menyebutkan kegagalan pengiriman pesan berulang, yang lebih mengarah ke giliran terpisah yang terjadi kemudian daripada retry model/runtime langsung.

## Hipotesis Penyebab Akar

Hipotesis dengan keyakinan tertinggi:

- Penyelesaian `keen-nexus` masuk melalui **jalur peristiwa exec node**.
- `exec.finished` yang sama dikirim ke `server-node-events` dua kali.
- Gateway menerima keduanya karena `enqueueSystemEvent(...)` tidak melakukan deduplikasi berdasarkan `contextKey` / `runId`.
- Setiap peristiwa yang diterima memicu Heartbeat dan disuntikkan sebagai giliran pengguna ke transkrip PI.

## Usulan Perbaikan Kecil yang Presisi

Jika perbaikan diinginkan, perubahan bernilai tinggi terkecil adalah:

- membuat idempotensi exec/peristiwa sistem menghormati `contextKey` untuk jangka waktu singkat, setidaknya untuk pengulangan `(sessionKey, contextKey, text)` yang identik;
- atau menambahkan deduplikasi khusus di `server-node-events` untuk `exec.finished` yang dikunci oleh `(sessionKey, runId, jenis peristiwa)`.

Itu akan langsung memblokir duplikat `exec.finished` yang direplay sebelum berubah menjadi giliran sesi.

## Terkait

- [Alat exec](/id/tools/exec)
- [Manajemen sesi](/id/concepts/session)
