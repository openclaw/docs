---
read_when:
    - Anda sedang membangun aplikasi eksternal, skrip, dasbor, pekerjaan CI, atau ekstensi IDE yang berkomunikasi dengan OpenClaw
    - Anda sedang memilih antara RPC Gateway dan SDK Plugin
    - Anda sedang mengintegrasikan dengan proses agen Gateway, sesi, peristiwa, persetujuan, model, atau alat
sidebarTitle: External apps
summary: Jalur integrasi saat ini untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
title: Integrasi Gateway untuk aplikasi eksternal
x-i18n:
    generated_at: "2026-06-27T17:29:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplikasi eksternal sebaiknya berkomunikasi dengan OpenClaw melalui protokol Gateway saat ini. Gunakan
WebSocket Gateway dan metode RPC saat skrip, dasbor, pekerjaan CI, ekstensi IDE,
atau proses lain ingin memulai eksekusi agen, mengalirkan peristiwa, menunggu
hasil, membatalkan pekerjaan, atau memeriksa sumber daya Gateway.

<Warning>
  Belum ada paket klien npm publik. Jangan tambahkan nama paket klien OpenClaw
  sebagai dependensi aplikasi sampai catatan rilis mengumumkan paket yang telah
  dipublikasikan dan halaman ini menyertakan instruksi instalasi.
</Warning>

<Note>
  Halaman ini ditujukan untuk kode di luar proses OpenClaw. Kode Plugin yang berjalan
  di dalam OpenClaw sebaiknya menggunakan subpath `openclaw/plugin-sdk/*` yang terdokumentasi.
</Note>

## Yang tersedia saat ini

| Permukaan                              | Status | Gunakan untuk                                                                                 |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Protokol Gateway](/id/gateway/protocol)  | Siap   | Transport WebSocket, handshake koneksi, cakupan auth, versioning protokol, dan peristiwa.     |
| [Referensi RPC Gateway](/id/reference/rpc) | Siap  | Metode Gateway saat ini untuk agen, sesi, tugas, model, alat, artefak, dan persetujuan.       |
| [`openclaw agent`](/id/cli/agent)         | Siap   | Integrasi skrip sekali jalan saat menjalankan CLI dari shell sudah cukup.                     |
| [`openclaw message`](/id/cli/message)     | Siap   | Mengirim pesan atau tindakan kanal dari skrip.                                                |

Pohon sumber berisi pekerjaan paket internal untuk pustaka klien mendatang, tetapi
itu bukan permukaan instalasi publik. Perlakukan sebagai detail implementasi pratinjau
sampai paket tersebut dipublikasikan dan diberi versi.

## Jalur yang direkomendasikan

1. Jalankan atau temukan Gateway.
2. Hubungkan melalui [protokol Gateway](/id/gateway/protocol).
3. Panggil metode RPC terdokumentasi dari [referensi RPC Gateway](/id/reference/rpc).
4. Sematkan versi OpenClaw yang Anda uji.
5. Periksa ulang referensi RPC saat memutakhirkan OpenClaw.

Untuk eksekusi agen, mulai dengan RPC `agent` dan pasangkan dengan `agent.wait` saat
Anda memerlukan hasil terminal. Untuk status percakapan yang tahan lama, gunakan metode
`sessions.*`. Untuk integrasi UI, berlangganan peristiwa Gateway dan render hanya
keluarga peristiwa yang dipahami aplikasi Anda.

## Kode aplikasi vs kode Plugin

Gunakan RPC Gateway saat kode berada di luar OpenClaw:

- skrip Node yang memulai atau mengamati eksekusi agen
- pekerjaan CI yang memanggil Gateway
- dasbor dan panel admin
- ekstensi IDE
- bridge eksternal yang tidak perlu menjadi Plugin kanal
- pengujian integrasi dengan transport Gateway palsu atau nyata

Gunakan SDK Plugin saat kode berjalan di dalam OpenClaw:

- Plugin penyedia
- Plugin kanal
- hook alat atau siklus hidup
- Plugin harness agen
- helper runtime tepercaya

Aplikasi eksternal sebaiknya tidak mengimpor `openclaw/plugin-sdk/*`; subpath tersebut ditujukan untuk
Plugin yang dimuat oleh OpenClaw.

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Referensi RPC Gateway](/id/reference/rpc)
- [Perintah CLI agent](/id/cli/agent)
- [Perintah CLI message](/id/cli/message)
- [Loop agen](/id/concepts/agent-loop)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Sesi](/id/concepts/session)
- [Tugas latar belakang](/id/automation/tasks)
- [Agen ACP](/id/tools/acp-agents)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
