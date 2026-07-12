---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit Plugin kebijakan
summary: Menambahkan pemeriksaan doctor berbasis kebijakan untuk kesesuaian ruang kerja.
title: Plugin kebijakan
x-i18n:
    generated_at: "2026-07-12T14:32:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin kebijakan

Menambahkan pemeriksaan doctor berbasis kebijakan untuk kesesuaian ruang kerja.

## Distribusi

- Paket: `@openclaw/policy`
- Jalur instalasi: disertakan dalam OpenClaw

## Permukaan

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Perilaku

Plugin Kebijakan menyediakan pemeriksaan kesehatan doctor untuk pengaturan OpenClaw yang dikelola kebijakan dan deklarasi ruang kerja yang diatur. Saat ini, Kebijakan mencakup kesesuaian kanal, metadata alat yang diatur, postur server MCP, postur penyedia model, postur akses jaringan privat, postur eksposur Gateway, postur ruang kerja/alat agen, postur alat global/per agen yang dikonfigurasi, postur runtime sandbox yang dikonfigurasi, postur akses masuk/kanal, postur penanganan data, serta postur penyedia rahasia/profil autentikasi konfigurasi OpenClaw.

Kebijakan menyimpan persyaratan yang ditetapkan dalam `policy.jsonc`, mengamati pengaturan OpenClaw dan deklarasi ruang kerja yang ada sebagai bukti, serta melaporkan penyimpangan melalui `openclaw policy check` dan `openclaw doctor --lint`. Pemeriksaan kebijakan yang bersih menghasilkan hash kebijakan, bukti, temuan, dan atestasi yang dapat dicatat operator untuk audit.

`openclaw policy compare --baseline <file>` membandingkan satu berkas kebijakan dengan berkas kebijakan lainnya. Perintah ini hanya memeriksa kesesuaian pada tingkat konfigurasi: perintah tersebut menggunakan metadata aturan kebijakan untuk memastikan bahwa kebijakan yang diperiksa tidak kehilangan ketentuan atau lebih lemah daripada garis dasar yang ditetapkan, dan tidak memeriksa status runtime, kredensial, maupun nilai rahasia.

Aturan postur alat dapat mewajibkan profil yang disetujui, alat sistem berkas khusus ruang kerja, pengaturan keamanan/permintaan/host eksekusi yang dibatasi, mode dengan hak istimewa yang dinonaktifkan, entri `alsoAllow` yang tepat, serta entri penolakan alat yang diwajibkan. Bukti mencatat entri `alsoAllow` tambahan karena entri tersebut dapat memperluas postur alat yang efektif. Pemeriksaan ini hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak membaca status persetujuan runtime atau menambahkan penegakan runtime.

Aturan postur sandbox dapat mewajibkan mode/backend sandbox yang disetujui, melarang jaringan kontainer host, melarang penggabungan namespace kontainer, mewajibkan pemasangan kontainer hanya-baca, melarang pemasangan soket runtime kontainer dan profil kontainer tanpa pembatasan, serta mewajibkan rentang sumber CDP peramban sandbox.
Pemeriksaan ini hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak membaca status persetujuan runtime, memeriksa kontainer aktif, atau menambahkan penegakan runtime.

Aturan penanganan data dapat mewajibkan penyuntingan informasi sensitif dalam pencatatan log, melarang pengambilan konten telemetri, mewajibkan pemeliharaan retensi sesi, serta melarang pengindeksan memori transkrip sesi. Pemeriksaan ini hanya mengamati kesesuaian konfigurasi; pemeriksaan ini tidak memeriksa log mentah, ekspor telemetri, transkrip, berkas memori, rahasia, maupun data pribadi.

Cakupan kebijakan bernama di bawah `scopes.<scopeName>` dapat menambahkan bagian kebijakan normal yang lebih ketat untuk pemilih yang dicantumkannya. `agentIds` mendukung `tools`, `agents.workspace`, `sandbox`, dan `dataHandling.memory`; `channelIds` mendukung `ingress.channels`.
ID agen runtime yang tidak dicantumkan secara eksplisit dalam `agents.list[]` diperiksa berdasarkan postur global/bawaan yang diwarisi, alih-alih secara diam-diam dinyatakan lolos tanpa bukti. Setiap cakupan yang terdapat dalam `policy.jsonc` harus valid dan dapat ditegakkan untuk pemilihnya. Aturan lapisan tambahan merupakan klaim tambahan, sehingga tidak memperlemah kebijakan tingkat teratas dan dapat menghasilkan temuannya sendiri ketika konfigurasi yang diamati melanggar kedua cakupan.

<!-- openclaw-plugin-reference:manual-end -->

## Dokumentasi terkait

- [kebijakan](/id/cli/policy)
