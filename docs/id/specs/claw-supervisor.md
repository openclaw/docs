---
read_when:
    - Merancang pengawasan armada Codex
    - Membangun alat OpenClaw yang membaca, mengarahkan, atau memulai sesi Codex
    - Memilih antara deployment lokal, Cloudflare, dan VPS untuk Codex yang diawasi
summary: Rencana supervisi armada untuk sesi app-server Codex yang dikendalikan oleh OpenClaw.
title: Pengawas Claw
x-i18n:
    generated_at: "2026-06-27T18:13:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Supervisor

## Tujuan

Claw Supervisor memungkinkan satu instans OpenClaw yang selalu aktif memantau dan menggerakkan armada sesi Codex tanpa mengubah pengalaman pengguna Codex yang normal. Pengguna dapat SSH ke host, memulai Codex, bekerja di TUI, dan tetap membuat supervisor membaca sesi, mengarahkannya, menginterupsinya, membuat sesi terkait, dan menerima handoff. Sesi Codex juga dapat memanggil balik ke OpenClaw melalui MCP.

## Model Produk

Codex tetap menjadi permukaan kerja utama. OpenClaw mengawasi Codex alih-alih menyembunyikan Codex di dalam subagent OpenClaw yang buram.

Plugin OpenClaw bernama `codex-supervisor`. `crabfleet` tetap menjadi profil deployment
dan armada host untuk mesin CRAB, bukan nama plugin yang dapat digunakan ulang.

Model ini memiliki tiga peran:

- Codex yang terpasang ke manusia: TUI Codex interaktif normal yang diluncurkan melalui app-server bersama.
- Codex otonom: thread app-server Codex yang dibuat oleh supervisor dan nantinya dapat ditempeli manusia.
- Supervisor Claw: agen OpenClaw yang selalu aktif dengan alat untuk status armada, pembacaan transkrip, pengarahan, interupsi, pembuatan sesi, dan handoff.

OpenClaw dapat menggunakan mekanisme subagent yang sudah ada secara internal, tetapi kontrak eksternalnya adalah sesi Codex yang dapat ditempeli dengan id thread Codex.

## Arsitektur

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Setiap host yang mampu menjalankan Codex menjalankan:

- Daemon app-server Codex.
- Peluncur yang selalu memulai Codex interaktif dengan `--remote`.
- Konektor yang mendaftarkan endpoint app-server dan thread aktif ke supervisor.

Supervisor menjalankan:

- Registry endpoint.
- Registry sesi.
- Pool klien JSON-RPC app-server Codex.
- Server MCP untuk panggilan Codex-ke-Claw.
- Alat OpenClaw untuk kontrol Claw-ke-Codex.
- Mesin kebijakan untuk tindakan otonom, persetujuan, dan pencegahan loop.

## Kontrak App-Server Codex

Gunakan API app-server Codex sebagai control plane kanonis:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Codex interaktif harus diluncurkan dengan `codex --remote <endpoint>` agar TUI dan supervisor terhubung ke app-server yang sama. `codex exec` mandiri saat ini bukan sesi live-shared; gunakan API app-server untuk pekerjaan otonom hingga Codex mendukung `exec --remote`.

## Registry Sesi

Supervisor menyimpan satu catatan per thread Codex yang diamati:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

Implementasi lokal dapat menurunkan sebagian besar field dari metadata thread Codex. Deployment armada harus memperkaya catatan dengan identitas host, status keterikatan pengguna, status git, dan kesehatan sidecar.

## Permukaan MCP Untuk Codex

Setiap Codex yang diawasi mendapatkan server MCP bernama `openclaw-codex-supervisor`.

Alat:

- `codex_sessions_list`: mencantumkan sesi Codex yang terlihat.
- `codex_session_read`: membaca satu transkrip.
- `codex_session_send`: mengirim pesan ke thread idle atau mengarahkan thread aktif.
- `codex_session_interrupt`: menginterupsi giliran aktif.
- `codex_endpoint_probe`: memverifikasi konektivitas endpoint.
- `claw_report_progress`: menerbitkan status tugas saat ini ke supervisor.
- `claw_ask`: meminta bantuan atau delegasi dari supervisor.
- `codex_spawn`: membuat sesi Codex otonom baru.
- `codex_handoff`: meminta pengambilalihan oleh manusia atau peer.

Resource:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Permukaan Kontrol Claw

Claw yang selalu aktif mendapatkan primitif yang sama sebagai alat internal:

- mencantumkan sesi dan endpoint
- membaca transkrip
- mengirim/mengarahkan teks
- menginterupsi pekerjaan aktif
- membuat sesi baru
- meringkas dan menetapkan sesi
- menyiarkan instruksi ke grup yang difilter
- menandai sesi sebagai terblokir, selesai, atau ditinggalkan

Perilaku alat:

- Jika thread target idle, `codex_session_send` dipetakan ke `turn/start`.
- Jika thread target aktif dan id giliran yang sedang berjalan terlihat, ini dipetakan ke `turn/steer`.
- Jika giliran aktif tidak dapat diidentifikasi, alat gagal secara tertutup alih-alih membuat giliran yang tidak terkait.
- Kontrol tulis MCP yang diekspos ke Codex tetap dinonaktifkan kecuali kebijakan khusus supervisor tepercaya mengaktifkannya.
- Pembacaan transkrip mentah tetap dinonaktifkan kecuali kebijakan khusus supervisor tepercaya mengaktifkannya.
- Persetujuan otonom secara default menolak persetujuan alat/file kecuali kebijakan eksplisit menyatakan sebaliknya.

## Alur Peluncuran

Login host interaktif:

1. Pengguna melakukan SSH ke host CRAB.
2. Layanan SSH memulai atau memverifikasi `codex app-server daemon start`.
3. Wrapper login meluncurkan `codex --remote unix:// --cd <workspace>`.
4. Konektor host mendaftarkan endpoint dan thread yang dimuat.
5. Supervisor memancarkan event armada prioritas tinggi: sesi Codex baru, workspace, status terikat manusia, pratinjau tugas saat ini.
6. Supervisor Claw dapat langsung membaca dan mengarahkan.

Pembuatan otonom:

1. Supervisor memilih host dan workspace.
2. Konektor host membuka atau melanjutkan thread app-server Codex.
3. Supervisor memulai giliran pertama dengan teks tugas dan konfigurasi MCP.
4. Registry sesi menandainya sebagai otonom dan dapat ditempeli.
5. Manusia nantinya dapat menempel dengan `codex --remote <endpoint> resume <threadId>` setelah Codex mendukung UX tepat tersebut, atau melalui alur resume saat ini pada app-server yang sama.

## Deployment

Control plane yang disarankan:

- Konektor host mempertahankan koneksi WebSocket keluar ke supervisor.
- Status supervisor berada di penyimpanan OpenClaw Gateway.
- App-server Codex tetap lokal untuk setiap host; jangan pernah mengekspos app-server mentah yang tidak terautentikasi ke internet publik.

Kelayakan Cloudflare:

- Baik untuk registry, durable object, fan-in WebSocket, routing event ringan, dan endpoint MCP/Gateway publik.
- Tidak cukup sendiri untuk kontrol host privat langsung karena Workers tidak dapat melakukan dial ke soket Unix privat arbitrer atau app-server local loopback.
- Gunakan Cloudflare ketika setiap konektor host menghubungi pusat melalui WebSocket keluar.

Fallback VPS:

- Gunakan layanan Hetzner ketika diperlukan kontrol proses jangka panjang, tunnel SSH, routing jaringan privat, atau akses sistem file lokal.
- Pertahankan protokol yang sama: konektor host keluar, registry supervisor terpusat, app-server Codex lokal.

## Keamanan

- Bind default adalah soket Unix lokal.
- App-server jarak jauh menggunakan token atau auth bearer bertanda tangan.
- Konektor host mengautentikasi ke supervisor dengan token host berskup.
- Alat supervisor menegakkan kebijakan per sesi: baca, arahkan, interupsi, buat sesi, persetujuan.
- Pesan lintas agen menyertakan `originSessionId`; echo diri sendiri dibuang.
- Siaran memerlukan filter eksplisit dan jumlah target terbatas.
- Pembacaan transkrip meredaksi rahasia di batas OpenClaw.
- Permintaan persetujuan secara default ditolak untuk giliran yang berasal dari supervisor kecuali kebijakan mengizinkannya.

## Rencana Implementasi

Fase 1: MVP supervisor lokal

- Tambahkan klien JSON-RPC app-server Codex untuk proxy stdio dan endpoint WebSocket.
- Tambahkan registry endpoint/sesi supervisor.
- Tambahkan alat MCP: daftar, baca, kirim, interupsi, probe.
- Tambahkan konfigurasi env lokal untuk endpoint.
- Tambahkan pengujian app-server palsu dan satu smoke app-server lokal langsung.

Fase 2: Integrasi OpenClaw

- Daftarkan alat supervisor di plugin `codex-supervisor`.
- Suntikkan MCP supervisor ke konfigurasi thread Codex.
- Tambahkan ringkasan sesi ke konteks agen.
- Tambahkan notifikasi event ketika thread Codex baru muncul.
- Tambahkan konfigurasi kebijakan untuk kirim/interupsi/buat sesi otonom.

Fase 3: Konektor armada

- Sidecar host mendaftarkan endpoint app-server, metadata host, metadata git/workspace, dan status keterikatan manusia.
- Tambahkan konektor WebSocket keluar untuk control plane Cloudflare atau VPS.
- Tambahkan penyambungan ulang, Heartbeat, dan pembersihan sesi stale.
- Tambahkan wrapper peluncur SSH CRAB.

Fase 4: Operasi otonom

- Tambahkan alur spawn/resume/takeover.
- Tambahkan siaran dan delegasi.
- Tambahkan laporan progres dan ringkasan status tugas.
- Tambahkan pencegahan loop dan batas laju.
- Tambahkan tampilan dashboard.

Fase 5: Multi-Claw

- Shard sesi berdasarkan grup.
- Tambahkan leadership/lease untuk setiap sesi.
- Tambahkan log audit dan replay.
- Tambahkan eskalasi antargrup Claw.

## Uji Penerimaan

- Manusia meluncurkan TUI Codex melalui app-server bersama.
- Supervisor mencantumkan thread aktif melalui `thread/loaded/list`.
- Supervisor membaca transkrip melalui `thread/read`.
- Supervisor mengirim teks ke thread idle melalui `turn/start`.
- Supervisor mengarahkan thread aktif melalui `turn/steer`.
- Interupsi supervisor menghentikan giliran aktif melalui `turn/interrupt`.
- Codex memanggil MCP supervisor dan mencantumkan sesi peer.
- Codex otonom dibuat dan nantinya ditempeli manusia.
- Konektor host yang hilang menandai sesi sebagai stale tanpa menghapus riwayat.

## Pertanyaan Terbuka

- UX tempel TUI Codex yang tepat untuk thread app-server yang dibuat tanpa TUI.
- Apakah Codex harus menambahkan `exec --remote` untuk run headless live-shared.
- Pemilik status tahan lama: DB OpenClaw Gateway, Cloudflare Durable Object, atau database VPS.
- Granularitas kebijakan persetujuan untuk giliran yang berasal dari supervisor.
- Seberapa banyak ringkasan transkrip harus disuntikkan ke konteks Claw yang selalu aktif dibandingkan disimpan sebagai alat/resource.
