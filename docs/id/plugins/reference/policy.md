---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit plugin kebijakan
summary: Menambahkan pemeriksaan doctor berbasis kebijakan untuk kesesuaian workspace.
title: Plugin kebijakan
x-i18n:
    generated_at: "2026-06-27T17:56:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin kebijakan

Menambahkan pemeriksaan doctor berbasis kebijakan untuk kesesuaian workspace.

## Distribusi

- Paket: `@openclaw/policy`
- Rute instalasi: disertakan dalam OpenClaw

## Permukaan

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Perilaku

Plugin Kebijakan menyumbangkan pemeriksaan kesehatan doctor untuk pengaturan OpenClaw
yang dikelola kebijakan dan deklarasi workspace yang diatur. Saat ini kebijakan mencakup kesesuaian channel,
metadata tool yang diatur, postur server MCP, postur penyedia model,
postur akses jaringan privat, postur paparan Gateway, postur workspace/tool agen,
postur tool global/per-agen yang dikonfigurasi, postur runtime sandbox yang dikonfigurasi,
postur akses ingress/channel, postur penanganan data, dan postur penyedia rahasia/profil autentikasi
konfigurasi OpenClaw.

Kebijakan menyimpan persyaratan yang ditulis dalam `policy.jsonc`, mengamati
pengaturan OpenClaw dan deklarasi workspace yang ada sebagai bukti, dan melaporkan drift
melalui `openclaw policy check` dan `openclaw doctor --lint`. Pemeriksaan kebijakan yang bersih
mengeluarkan hash kebijakan, bukti, temuan, dan pengesahan yang dapat dicatat operator
untuk audit.

`openclaw policy compare --baseline <file>` membandingkan satu berkas kebijakan dengan berkas
kebijakan lain. Ini hanya kesesuaian tingkat konfigurasi: perintah ini menggunakan metadata aturan kebijakan
untuk memverifikasi bahwa kebijakan yang diperiksa tidak hilang atau lebih lemah daripada baseline
yang ditulis, dan tidak memeriksa status runtime, kredensial, atau nilai rahasia.

Aturan postur tool dapat mewajibkan profil yang disetujui, tool sistem berkas khusus workspace,
pengaturan keamanan/permintaan/host exec yang dibatasi, mode elevated yang dinonaktifkan, entri
`alsoAllow` yang persis, dan entri penolakan tool yang diwajibkan. Bukti mencatat
entri `alsoAllow` tambahan karena entri tersebut dapat memperluas postur tool efektif.
Pemeriksaan ini hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak membaca status persetujuan runtime
atau menambahkan penegakan runtime.

Aturan postur sandbox dapat mewajibkan mode/backend sandbox yang disetujui, menolak jaringan kontainer
host, menolak penggabungan namespace kontainer, mewajibkan mount kontainer hanya-baca,
menolak mount soket runtime kontainer dan profil kontainer tanpa pembatasan,
serta mewajibkan rentang sumber CDP browser sandbox.
Pemeriksaan ini hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak membaca status persetujuan runtime,
memeriksa kontainer langsung, atau menambahkan penegakan runtime.

Aturan penanganan data dapat mewajibkan redaksi logging sensitif, menolak penangkapan konten telemetri,
mewajibkan pemeliharaan retensi sesi, dan menolak pengindeksan memori transkrip sesi. Pemeriksaan ini
hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak memeriksa log mentah, ekspor telemetri,
transkrip, berkas memori, rahasia, atau data pribadi.

Cakupan kebijakan bernama di bawah `scopes.<scopeName>` dapat menambahkan bagian kebijakan normal yang lebih ketat
untuk selector yang dicantumkannya. `agentIds` mendukung `tools`,
`agents.workspace`, `sandbox`, dan `dataHandling.memory`; `channelIds` mendukung
`ingress.channels`.
ID agen runtime yang tidak secara eksplisit dicantumkan dalam `agents.list[]` diperiksa
terhadap postur global/default yang diwarisi, bukan dibiarkan lolos diam-diam tanpa
bukti. Setiap cakupan yang ada dalam `policy.jsonc` harus valid dan dapat ditegakkan
untuk selector-nya. Aturan overlay adalah klaim tambahan, sehingga tidak melemahkan
kebijakan tingkat atas dan dapat menghasilkan temuannya sendiri ketika konfigurasi yang sama
yang diamati melanggar kedua cakupan.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumen terkait

- [kebijakan](/id/cli/policy)
