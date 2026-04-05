---
read_when:
    - Anda memerlukan panduan langkah demi langkah yang tepat tentang loop agen atau peristiwa siklus hidup
summary: Siklus hidup loop agen, stream, dan semantik wait
title: Loop Agen
x-i18n:
    generated_at: "2026-04-05T13:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop Agen (OpenClaw)

Loop agentik adalah eksekusi “nyata” penuh dari sebuah agen: intake → perakitan konteks → inferensi model →
eksekusi tool → balasan streaming → persistensi. Ini adalah jalur otoritatif yang mengubah sebuah pesan
menjadi tindakan dan balasan akhir, sambil menjaga status sesi tetap konsisten.

Di OpenClaw, sebuah loop adalah satu eksekusi terserialisasi per sesi yang memancarkan peristiwa siklus hidup dan stream
saat model berpikir, memanggil tool, dan melakukan streaming output. Dokumen ini menjelaskan bagaimana loop autentik tersebut
dirangkai dari ujung ke ujung.

## Titik masuk

- Gateway RPC: `agent` dan `agent.wait`.
- CLI: perintah `agent`.

## Cara kerjanya (tingkat tinggi)

1. RPC `agent` memvalidasi parameter, menyelesaikan sesi (sessionKey/sessionId), menyimpan metadata sesi, dan langsung mengembalikan `{ runId, acceptedAt }`.
2. `agentCommand` menjalankan agen:
   - menyelesaikan default model + thinking/verbose
   - memuat snapshot Skills
   - memanggil `runEmbeddedPiAgent` (runtime pi-agent-core)
   - memancarkan **lifecycle end/error** jika loop tersemat tidak memancarkan salah satunya
3. `runEmbeddedPiAgent`:
   - menserialisasi eksekusi melalui antrean per sesi + global
   - menyelesaikan model + profil auth dan membangun sesi pi
   - berlangganan ke peristiwa pi dan melakukan streaming delta assistant/tool
   - menerapkan timeout -> membatalkan eksekusi jika terlampaui
   - mengembalikan payload + metadata penggunaan
4. `subscribeEmbeddedPiSession` menjembatani peristiwa pi-agent-core ke stream `agent` OpenClaw:
   - peristiwa tool => `stream: "tool"`
   - delta assistant => `stream: "assistant"`
   - peristiwa lifecycle => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` menggunakan `waitForAgentRun`:
   - menunggu **lifecycle end/error** untuk `runId`
   - mengembalikan `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Antrean + konkurensi

- Eksekusi diserialisasi per kunci sesi (jalur sesi) dan secara opsional melalui jalur global.
- Ini mencegah race tool/sesi dan menjaga riwayat sesi tetap konsisten.
- Kanal pesan dapat memilih mode antrean (collect/steer/followup) yang masuk ke sistem jalur ini.
  Lihat [Antrean Perintah](/concepts/queue).

## Persiapan sesi + workspace

- Workspace diselesaikan dan dibuat; eksekusi tersandbox dapat mengalihkan ke root workspace sandbox.
- Skills dimuat (atau digunakan kembali dari snapshot) dan disuntikkan ke env dan prompt.
- File bootstrap/konteks diselesaikan dan disuntikkan ke laporan system prompt.
- Lock tulis sesi diperoleh; `SessionManager` dibuka dan disiapkan sebelum streaming.

## Perakitan prompt + system prompt

- System prompt dibangun dari prompt dasar OpenClaw, prompt Skills, konteks bootstrap, dan override per eksekusi.
- Batas khusus model dan token cadangan compaction diterapkan.
- Lihat [System prompt](/concepts/system-prompt) untuk mengetahui apa yang dilihat model.

## Titik hook (tempat Anda dapat mencegat)

OpenClaw memiliki dua sistem hook:

- **Internal hooks** (Gateway hooks): skrip berbasis peristiwa untuk perintah dan peristiwa siklus hidup.
- **Plugin hooks**: titik ekstensi di dalam siklus hidup agen/tool dan pipeline gateway.

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: berjalan saat membangun file bootstrap sebelum system prompt difinalkan.
  Gunakan ini untuk menambahkan/menghapus file konteks bootstrap.
- **Command hooks**: `/new`, `/reset`, `/stop`, dan peristiwa perintah lainnya (lihat dokumen Hooks).

Lihat [Hooks](/id/automation/hooks) untuk penyiapan dan contoh.

### Plugin hooks (siklus hidup agen + gateway)

Hook ini berjalan di dalam loop agen atau pipeline gateway:

- **`before_model_resolve`**: berjalan sebelum sesi (tanpa `messages`) untuk meng-override provider/model secara deterministik sebelum penyelesaian model.
- **`before_prompt_build`**: berjalan setelah sesi dimuat (dengan `messages`) untuk menyuntikkan `prependContext`, `systemPrompt`, `prependSystemContext`, atau `appendSystemContext` sebelum prompt dikirim. Gunakan `prependContext` untuk teks dinamis per giliran dan field system-context untuk panduan stabil yang seharusnya berada di ruang system prompt.
- **`before_agent_start`**: hook kompatibilitas lama yang dapat berjalan di salah satu fase; pilih hook eksplisit di atas.
- **`before_agent_reply`**: berjalan setelah tindakan inline dan sebelum panggilan LLM, memungkinkan plugin mengklaim giliran dan mengembalikan balasan sintetis atau membisukan giliran sepenuhnya.
- **`agent_end`**: memeriksa daftar pesan akhir dan metadata eksekusi setelah selesai.
- **`before_compaction` / `after_compaction`**: mengamati atau memberi anotasi pada siklus compaction.
- **`before_tool_call` / `after_tool_call`**: mencegat parameter/hasil tool.
- **`before_install`**: memeriksa temuan pemindaian bawaan dan secara opsional memblokir instalasi skill atau plugin.
- **`tool_result_persist`**: secara sinkron mentransformasi hasil tool sebelum ditulis ke transkrip sesi.
- **`message_received` / `message_sending` / `message_sent`**: hook pesan masuk + keluar.
- **`session_start` / `session_end`**: batas siklus hidup sesi.
- **`gateway_start` / `gateway_stop`**: peristiwa siklus hidup gateway.

Aturan keputusan hook untuk pengaman keluar/tool:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `before_install`: `{ block: false }` adalah no-op dan tidak menghapus blok sebelumnya.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler dengan prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` adalah no-op dan tidak menghapus cancel sebelumnya.

Lihat [Plugin hooks](/plugins/architecture#provider-runtime-hooks) untuk API hook dan detail pendaftaran.

## Streaming + balasan parsial

- Delta assistant di-stream dari pi-agent-core dan dipancarkan sebagai peristiwa `assistant`.
- Block streaming dapat memancarkan balasan parsial baik pada `text_end` maupun `message_end`.
- Streaming reasoning dapat dipancarkan sebagai stream terpisah atau sebagai balasan blok.
- Lihat [Streaming](/concepts/streaming) untuk perilaku chunking dan balasan blok.

## Eksekusi tool + tool pesan

- Peristiwa mulai/pembaruan/akhir tool dipancarkan pada stream `tool`.
- Hasil tool disanitasi untuk ukuran dan payload gambar sebelum dicatat/dipancarkan.
- Pengiriman tool pesan dilacak untuk menekan konfirmasi assistant duplikat.

## Pembentukan balasan + penekanan

- Payload akhir dirakit dari:
  - teks assistant (dan reasoning opsional)
  - ringkasan tool inline (saat verbose + diizinkan)
  - teks error assistant saat model mengalami error
- Token senyap persis `NO_REPLY` / `no_reply` difilter dari
  payload keluar.
- Duplikat tool pesan dihapus dari daftar payload akhir.
- Jika tidak ada payload yang dapat dirender tersisa dan sebuah tool mengalami error, balasan error tool fallback dipancarkan
  (kecuali tool pesan sudah mengirim balasan yang terlihat oleh pengguna).

## Compaction + percobaan ulang

- Auto-compaction memancarkan peristiwa stream `compaction` dan dapat memicu percobaan ulang.
- Saat percobaan ulang, buffer dalam memori dan ringkasan tool direset untuk menghindari output duplikat.
- Lihat [Compaction](/concepts/compaction) untuk pipeline compaction.

## Stream peristiwa (saat ini)

- `lifecycle`: dipancarkan oleh `subscribeEmbeddedPiSession` (dan sebagai fallback oleh `agentCommand`)
- `assistant`: delta streaming dari pi-agent-core
- `tool`: peristiwa tool streaming dari pi-agent-core

## Penanganan kanal chat

- Delta assistant dibuffer menjadi pesan chat `delta`.
- Chat `final` dipancarkan pada **lifecycle end/error**.

## Timeout

- Default `agent.wait`: 30 dtk (hanya wait). Parameter `timeoutMs` menimpa.
- Runtime agen: default `agents.defaults.timeoutSeconds` adalah 172800 dtk (48 jam); diterapkan di timer abort `runEmbeddedPiAgent`.

## Tempat proses dapat berakhir lebih awal

- Timeout agen (abort)
- AbortSignal (cancel)
- Gateway terputus atau timeout RPC
- Timeout `agent.wait` (hanya wait, tidak menghentikan agen)

## Terkait

- [Tools](/tools) — tool agen yang tersedia
- [Hooks](/id/automation/hooks) — skrip berbasis peristiwa yang dipicu oleh peristiwa siklus hidup agen
- [Compaction](/concepts/compaction) — bagaimana percakapan panjang diringkas
- [Exec Approvals](/tools/exec-approvals) — gerbang persetujuan untuk perintah shell
- [Thinking](/tools/thinking) — konfigurasi tingkat thinking/reasoning
