---
x-i18n:
    generated_at: "2026-07-19T16:22:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 90c6c85a837448f4e5ceccdccf73489db801ad502cbbb2f3eb04d6aff7e902f0
    source_path: plan/swarms.md
    workflow: 16
---

# Swarm — fan-out dan orkestrasi agen dalam mode kode

Status: Telah dirilis — digantikan oleh `docs/tools/swarm.md`. Dokumen ini tetap tersedia sebagai
catatan desain implementasi.

## 1. Apa dan mengapa

Sebuah **swarm** adalah banyak subagen yang diorkestrasi secara deterministik dari skrip
mode kode: fan-out N pembaca, verifikasi temuan secara adversarial, sintesis melalui
pemrioritas berstatus, perulangan pada gerbang keputusan. Alur kontrol (`Promise.all`,
`while`, `if`) _merupakan_ orkestrasi tersebut — sengaja **tidak ada DSL graf,
tidak ada mode baru, tidak ada permukaan alat tingkat atas baru**.

Mode kode OpenClaw (QuickJS-WASI, snapshot/resume, permintaan bridge) adalah
landasannya. Panggilan bridge yang diparkir bertahan melewati snapshot VM, mulai ulang gateway, dan
dilanjutkan tepat di tempat berhenti — lebih kuat daripada desain pemutaran ulang jurnal, tanpa
batasan determinisme pada skrip.

Penamaan: nama produk/dokumentasi adalah **Swarm**. Pengidentifikasi kode tetap literal:
API tamu `agents.*`, konfigurasi `tools.swarm`, kolom grup `swarm`.

## 2. Keputusan (pengelola, 2026-07-17)

- Biaya: batas konfigurasi diberlakukan; anggaran token per swarm bersifat opsional. Tidak ada anggaran wajib.
- Persetujuan: turunan berjalan secara **fail-closed / noninteraktif**. Tindakan yang memerlukan
  persetujuan ditolak; penolakan dilaporkan dalam hasil turunan; skrip yang
  memutuskan. Tidak ada spam permintaan operator dari fan-out.
- v1 hanya berupa skrip ad hoc yang ditulis model. Alur kerja tersimpan/bernama, entri
  CLI/cron: nanti (mode kode headless sudah tersedia untuk cron).
- Identitas turunan: agen pekerja khusus secara default melalui konfigurasi `tools.swarm.defaultAgentId`
  (divalidasi terhadap daftar izin target subagen yang ada); penggantian `agentId`
  per spawn. Core tidak menyediakan id agen bawaan; dokumentasi merekomendasikan
  konfigurasi agen `worker` yang ramping.
- Tidak ada perubahan sumber Codex. Harness Codex menggunakan idiom spawn/wait (§8).

## 3. Ikhtisar arsitektur

```
skrip mode kode (VM QuickJS, gateway)            skrip Codex V8 (proses codex)
  agents.run(...) ── panggilan bridge diparkir      tools.sessions_spawn / tools.agents_wait
        │                                                │ RPC item/alat/panggilan (≤600 dtk masing-masing)
        ▼                                                ▼
             CORE (tidak bergantung pada harness, repo ini)
  sessions_spawn {collect:true, outputSchema, fastMode, groupId}
  agents_wait {ids, timeoutSeconds}
        │
  registri subagen (SQLite): catatan penyelesaian kolektor, id grup swarm
        │
  turunan = sesi subagen biasa (dibatasi lane, persetujuan fail-closed)
        │
  sessions.changed SSE ──► titik Control UI / bilah sisi / pesan status saluran
```

Satu pemilik kanonis semantik spawn/complete/settle (alat core + registri).
Dua transpor await: QuickJS memarkir panggilan bridge tanpa batas waktu (snapshot);
Codex melakukan polling `agents_wait` dalam RPC berbatas.

## 4. Gerbang konfigurasi (v1)

`tools.swarm` baru (global + penggantian per agen, pola penggabungan yang sama seperti
`tools.codeMode`):

```jsonc
"tools": {
  "swarm": {
    "enabled": false,            // gerbang utama, default NONAKTIF
    "maxConcurrent": 8,          // turunan yang berjalan bersamaan (batas lane swarm)
    "maxChildrenPerGroup": 50,   // turunan aktif per grup swarm
    "maxTotalPerGroup": 200,     // jumlah spawn sepanjang masa per grup (penahan proses tak terkendali)
    "waitTimeoutSecondsMax": 600,
    "defaultAgentId": ""         // opsional; id agen turunan ketika spawn menghilangkan agentId
  }
}
```

- Zod: union `boolean | strict object` seperti `CodeModeSchema`
  (`src/config/zod-schema.agent-runtime.ts`); `swarm: true` → `{enabled: true}`.
- Tipe di `src/config/types.tools.ts` (baik per agen maupun `tools` tingkat atas),
  label di `schema.labels.ts`, bantuan di `schema.help.runtime.ts`.
- Pembantu resolusi `resolveSwarmConfig(cfg, agentId)` yang mencerminkan
  `resolveCodeModeConfig` (`src/agents/code-mode.ts:215`), membatasi semua angka.
- Efek gerbang saat dinonaktifkan: alat `agents_wait` tidak ada dalam katalog;
  parameter `collect`/`outputSchema`/`fastMode`/`groupId` pada `sessions_spawn`
  ditolak dengan galat jelas yang menyebutkan kunci konfigurasi. Tidak ada perubahan perilaku lain.
- `defaultAgentId` divalidasi melalui `resolveSubagentAllowedTargetIds`
  (`src/agents/subagent-target-policy.ts`); id tidak dikenal → galat spawn, bukan fallback.

## 5. Core: spawn mode kolektor + `agents_wait` (v1)

### 5.1 Penambahan `sessions_spawn` (semuanya digerbangi oleh swarm yang diaktifkan)

- `collect: boolean` — jika true, proses turunan didaftarkan dengan
  `expectsCompletionMessage: false` dan **catatan penyelesaian kolektor**
  alih-alih pengiriman pengumuman/pengarahan. Alat segera mengembalikan `{ runId, sessionKey }`.
  Tidak ada pengikatan saluran/thread.
- `outputSchema: object` — JSON Schema. Turunan mendapatkan alat sintetis
  `structured_output` yang ditambahkan ke permukaan alatnya; adendum prompt sistem
  menginstruksikannya untuk memanggil alat itu tepat sekali dengan hasil akhirnya. Jika validasi
  gagal, turunan mendapatkan satu percobaan ulang dengan dorongan; setelah itu catatan penyelesaian
  memuat `structured: undefined` beserta teks mentah dan `schemaError`.
- `fastMode: true | "auto" | false` — diteruskan ke patch sesi turunan
  bersama model/thinking melalui `resolveSubagentModelAndThinkingPlan`
  (`src/agents/subagent-spawn-plan.ts`), menggunakan sumbu `FastMode` yang ada
  (`src/shared/fast-mode.ts`). Dihilangkan = mewarisi.
- `groupId: string` — stempel grup swarm. Default ke
  `swarm:<requesterSessionKey>:<runId-of-requesting-run>`. Dipertahankan pada
  catatan registri dan baris sesi turunan. Digunakan untuk batas, pencantuman, pengarsipan
  batch, dan titik.
- `label: string` sudah ada — muncul dalam titik dan `subagents list`.
- Id agen turunan: `params.agentId` → jika tidak, `tools.swarm.defaultAgentId` → jika tidak,
  agen pemohon (perilaku yang ada).

### 5.2 Persetujuan fail-closed

Turunan kolektor berjalan dengan konteks persetujuan noninteraktif: setiap panggilan alat
yang memerlukan persetujuan operator diselesaikan sebagai penolakan terstruktur
(`approval_required`) yang terlihat oleh turunan, yang diharapkan melaporkan
hambatan tersebut dalam hasilnya. Implementasi: gunakan kembali plumbing kebijakan persetujuan
exec/alat yang ada dengan resolver `deny` yang dipaksakan untuk proses turunan mode kolektor.
Tidak ada peristiwa persetujuan yang dipancarkan ke permukaan operator dari turunan kolektor.

### 5.3 Alat `agents_wait` (baru, digerbangi)

```
agents_wait({ ids: string[], timeoutSeconds?: number })
→ {
    completed: [{ runId, status: "done"|"failed"|"killed"|"timeout",
                  result: string, structured?: unknown, schemaError?: string,
                  sessionKey, label?, usage?: {inputTokens, outputTokens} }],
    pending: string[]
  }
```

- Kembali segera setelah **setidaknya satu** id selesai (semantik penyelesaian pertama / race,
  memungkinkan pipeline), atau saat waktu habis dengan `completed: []`.
- `timeoutSeconds` default 30, dibatasi hingga `waitTimeoutSecondsMax`.
- Idempoten: id yang sudah selesai mengembalikan catatannya lagi (catatan
  disimpan hingga pengarsipan grup). Id tidak dikenal → entri galat per id, bukan throw.
- Kepemilikan: hanya sesi yang melakukan spawn suatu proses (atau rantai induknya) yang boleh menunggu
  proses tersebut — aturan kepemilikan yang sama seperti `wait` dalam mode kode (`code-mode.ts:1684`).
- Registri: catatan penyelesaian berada di penyimpanan SQLite registri subagen
  yang ada (`subagent-registry.store.sqlite.ts`) — bidang baru, tanpa penyimpanan baru, tanpa
  kenaikan versi skema (hanya kolom aditif; lihat batasan §9).

### 5.4 Pemberlakuan batas

- `maxConcurrent`: turunan kolektor berjalan pada lane subagen yang ada, tetapi
  dihitung per grup swarm; spawn yang melampaui batas masuk antrean FIFO (sisi host, dalam
  jalur spawn — segera kembalikan runId, proses dimulai ketika slot tersedia).
- `maxChildrenPerGroup` / `maxTotalPerGroup`: spawn ditolak dengan galat bertipe
  setelah terlampaui; teks galat menyebutkan kunci konfigurasi.
- Kedalaman: turunan kolektor mempertahankan semantik `DEFAULT_SUBAGENT_MAX_SPAWN_DEPTH`
  (turunan adalah daun kecuali penyarangan dikonfigurasi secara eksplisit).

## 6. Kontrak pengujian (v1, lane A)

- Unit: resolusi/pembatasan konfigurasi; penolakan gerbang saat dinonaktifkan; default groupId;
  pemberlakuan batas (antrean + penolakan); semantik race wait; idempotensi wait;
  penolakan kepemilikan; validasi keluaran terstruktur + percobaan ulang dengan dorongan +
  jalur schemaError; plumbing fastMode ke patch sesi; validasi defaultAgentId.
- Integrasi (vitest, runtime model tiruan): spawn 3 turunan kolektor, tunggu
  dalam perulangan, tegaskan urutan penyelesaian pertama dan pengurasan akhir; simulasi mulai ulang
  gateway: muat ulang registri → wait diselesaikan dari penyelesaian yang dipertahankan.
- Semua pengujian ditempatkan bersama di `*.test.ts`; tanpa panggilan model langsung.

## 7. Permukaan tamu QuickJS (lane B, setelah core)

- Global tamu dipasang di `CONTROLLER_SOURCE`
  (`src/agents/code-mode.worker.ts:190-374`), nama yang dicadangkan ditambahkan di
  `code-mode-namespaces.ts`:
  - `agents.run(prompt, opts) → Promise<result|structured>` — pemanis:
    spawn kolektor + await yang diparkir pada metode bridge khusus (`agentWait`)
    yang diselesaikan host saat rampung (tanpa polling; aman untuk snapshot).
  - `agents.session(system, opts) → Promise<handle>`;
    `handle.send(input, opts) → Promise<...>`; `handle.close()`. (v1.1 —
    dirilis setelah run(); menggunakan `mode:"session"` + catatan kolektor per giliran.)
  - `phase(title)`, `log(message)` — notifikasi bridge fire-and-forget →
    peristiwa progres swarm.
- Metode bridge ditambahkan ke `CodeModeBridgeMethod` (`code-mode.ts:91`):
  `agentSpawn`, `agentWait`, `swarmNote`. `agentSpawn`/`agentWait`
  aman untuk pemutaran ulang **berdasarkan konstruksi**: kunci idempotensi `(codeModeRunId, bridgeId)`
  disimpan pada catatan registri; mulai ulang menyelesaikan ulang dari penyelesaian yang dipertahankan
  dan tidak pernah melakukan spawn ganda.
- Panggilan bridge `agentWait` yang tertunda memperpanjang TTL snapshot proses (kumpulan
  agen tertunda adalah sinyalnya; tanpa flag).
- Berkas virtual `API.read("agents.d.ts")` mendokumentasikan permukaan bertipe + idiom
  fan-out / gerbang / siklus (`createCodeModeApiVirtualFiles`,
  `code-mode-namespaces.ts:876`).

## 8. Proyeksi harness Codex (lane berikutnya)

- `sessions_spawn` (dengan parameter baru) dan `agents_wait` mengalir melalui
  bridge alat dinamis yang ada; di dalam skrip mode kode Codex, keduanya muncul sebagai
  `tools.*` secara otomatis (terverifikasi: `codex-rs/code-mode/src/runtime/globals.rs:14-65`,
  `codex-rs/core/src/tools/spec_plan.rs:448-507`).
- `agents_wait` mendapatkan kelas waktu habis alat dinamis yang panjang (batas 600 dtk;
  `extensions/codex/src/app-server/dynamic-tool-execution.ts:37-39`) dan
  ditandai aman untuk waktu habis/pemutaran ulang.
- Kunci grup untuk induk Codex: `swarm:<parentSessionKey>:<turnId>`.
- Subagen `spawn_agent` bawaan Codex berdampingan; baris cermin tugasnya memasok
  permukaan progres yang sama.

## 9. Persistensi dan retensi

- Tidak ada penyimpanan baru. Catatan registri memperluas tabel SQLite registri subagen
  yang ada; turunan adalah baris `sessions` biasa. Hanya kolom aditif
  — **setiap perubahan yang memerlukan kenaikan versi skema SQLite harus terlebih dahulu
  mendapatkan persetujuan eksplisit pengelola** (kebijakan repo).
- Id grup swarm pada catatan registri + metadata sesi turunan.
- Retensi: catatan kolektor yang selesai bertahan hingga **pengarsipan grup**:
  saat proses induk selesai (atau TTL kedaluwarsa), turunan grup diarsipkan
  sebagai batch (perluas sweep `DEFAULT_SUBAGENT_ARCHIVE_AFTER_MINUTES`
  yang ada agar beroperasi per grup).

## 10. Permukaan progres ("titik-titik") — lane berikutnya

- Implisit, digerakkan oleh harness. Diturunkan dari SSE `sessions.changed` +
  registri yang ada; catatan `phase`/`log` menambahkan semantik. Tidak ada rendering yang digerakkan agen.
- Control UI: perender `swarm` dalam keluarga widget ruang kerja
  (`ui/src/lib/workspace/widgets/`) — kisi titik yang dikelompokkan menurut fase, baris
  narator, status/label/model per titik; pohon turunan bilah sisi tidak berubah.
- Saluran: satu pesan status yang diedit dan dibatasi lajunya per grup (ikuti
  `docs/concepts/streaming.md`; jangan pernah mengirim pesan per turunan).

## 11. Halaman Labs (UI Kontrol, jalur independen)

Settings → **Labs**: tombol fitur eksperimental, entri pertama **Mode Kode**
dan **Swarm**. Setiap baris: nama, deskripsi satu baris, tautan dokumentasi, tombol yang terhubung
melalui RPC `config.patch` yang sudah ada (merge-patch RFC 7396 — tetapkan
`tools.codeMode.enabled` / `tools.swarm.enabled`), ditambah petunjuk "perlu dimulai ulang"
jika berlaku. Mudah ditemukan, tetapi teksnya memperjelas status
eksperimental. i18n: semua string melalui pipeline `en.ts` + sinkronisasi normal.

## 12. Penempatan (nanti)

- `placement` pilihan saat spawn: `"local"` (default) | `"cloud:<profile>"` melalui
  pengiriman lingkungan worker yang sudah ada (`sessions.dispatch`); penempatan terkelompok
  nanti jika proses turunan sandbox SSH pada shared-box terbukti tidak memadai.
- VM Orchestrator selalu tetap berada di gateway; settle/dots/budget tidak
  bergantung pada penempatan.

## 13. Bukan tujuan

- Tidak ada DSL graf — alur kontrol adalah grafnya (disengaja, terdokumentasi).
- Tidak ada perubahan sumber Codex; tidak ada penggunaan ulang internal Mode Kode Codex.
- Tidak ada alur kerja tersimpan/bernama dalam v1; tidak ada titik masuk CLI.
- Tidak ada penerusan persetujuan operator per proses turunan.
- Tidak ada penyediaan cloud 1:1 pada skala fan-out.
- Tidak ada shim kompatibilitas runtime dalam kondisi stabil; swarm adalah permukaan baru yang dibatasi.

## 14. Fase pembangunan / pembagian PR

1. **Jalur A (inti)**: konfigurasi §4 + spawn/wait/caps/approvals §5 + pengujian §6.
2. **Jalur C (halaman Labs)**: §11 — independen, dapat digabungkan lebih dahulu.
3. **Jalur B (permukaan QuickJS)**: §7 — setelah kontrak A digabungkan.
4. Perender dots (§10), proyeksi Codex (§8), `agents.session` (§7 v1.1),
   penempatan (§12), penulisan ulang dokumentasi pengguna — PR tindak lanjut dalam urutan tersebut.

Setiap PR: Pipeline CI hijau, `$autoreview` bersih, dinonaktifkan secara default, main siap dirilis.
