---
read_when:
    - Anda ingin memahami apa arti “konteks” di OpenClaw
    - Anda sedang men-debug mengapa model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (`/context`, `/status`, `/compact`)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-04-05T13:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Konteks

“Konteks” adalah **semua yang OpenClaw kirim ke model untuk sebuah run**. Konteks dibatasi oleh **jendela konteks** model (batas token).

Model mental untuk pemula:

- **Prompt sistem** (dibangun oleh OpenClaw): aturan, alat, daftar Skills, waktu/runtime, dan file workspace yang disuntikkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Pemanggilan/hasil alat + lampiran**: output perintah, pembacaan file, gambar/audio, dan sebagainya.

Konteks _tidak sama_ dengan “memori”: memori dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat “seberapa penuh jendela saya?” + pengaturan sesi.
- `/context list` → apa yang disuntikkan + ukuran kasar (per file + total).
- `/context detail` → rincian lebih mendalam: ukuran per file, per skema alat, per entri skill, dan ukuran prompt sistem.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → rangkum riwayat lama menjadi entri ringkas untuk membebaskan ruang jendela.

Lihat juga: [Perintah slash](/tools/slash-commands), [Penggunaan token & biaya](/reference/token-use), [Kompaksi](/concepts/compaction).

## Contoh output

Nilai bervariasi menurut model, provider, kebijakan alat, dan apa yang ada di workspace Anda.

### `/context list`

```
🧠 Rincian konteks
Workspace: <workspaceDir>
Bootstrap maks/file: 20,000 karakter
Sandbox: mode=non-main sandboxed=false
Prompt sistem (run): 38,412 karakter (~9,603 tok) (Project Context 23,901 karakter (~5,976 tok))

File workspace yang disuntikkan:
- AGENTS.md: OK | mentah 1,742 karakter (~436 tok) | disuntikkan 1,742 karakter (~436 tok)
- SOUL.md: OK | mentah 912 karakter (~228 tok) | disuntikkan 912 karakter (~228 tok)
- TOOLS.md: TERPOTONG | mentah 54,210 karakter (~13,553 tok) | disuntikkan 20,962 karakter (~5,241 tok)
- IDENTITY.md: OK | mentah 211 karakter (~53 tok) | disuntikkan 211 karakter (~53 tok)
- USER.md: OK | mentah 388 karakter (~97 tok) | disuntikkan 388 karakter (~97 tok)
- HEARTBEAT.md: HILANG | mentah 0 | disuntikkan 0
- BOOTSTRAP.md: OK | mentah 0 karakter (~0 tok) | disuntikkan 0 karakter (~0 tok)

Daftar Skills (teks prompt sistem): 2,184 karakter (~546 tok) (12 skill)
Alat: read, edit, write, exec, process, browser, message, sessions_send, …
Daftar alat (teks prompt sistem): 1,032 karakter (~258 tok)
Skema alat (JSON): 31,988 karakter (~7,997 tok) (dihitung ke konteks; tidak ditampilkan sebagai teks)
Alat: (sama seperti di atas)

Token sesi (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Rincian konteks (detail)
…
Skill teratas (ukuran entri prompt):
- frontend-design: 412 karakter (~103 tok)
- oracle: 401 karakter (~101 tok)
… (+10 skill lainnya)

Alat teratas (ukuran skema):
- browser: 9,812 karakter (~2,453 tok)
- exec: 6,240 karakter (~1,560 tok)
… (+N lainnya)
```

## Apa yang dihitung terhadap jendela konteks

Semua yang diterima model akan dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Pemanggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan kompaksi dan artefak pruning.
- “Wrapper” provider atau header tersembunyi (tidak terlihat, tetapi tetap dihitung).

## Cara OpenClaw membangun prompt sistem

Prompt sistem adalah milik **OpenClaw** dan dibangun ulang pada setiap run. Isinya meliputi:

- Daftar alat + deskripsi singkat.
- Daftar Skills (metadata saja; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang sudah dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang disuntikkan di bawah **Project Context**.

Rincian lengkap: [Prompt Sistem](/concepts/system-prompt).

## File workspace yang disuntikkan (Project Context)

Secara default, OpenClaw menyuntikkan sekumpulan file workspace tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya saat pertama dijalankan)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `20000` karakter). OpenClaw juga menerapkan batas total suntikan bootstrap di semua file dengan `agents.defaults.bootstrapTotalMaxChars` (default `150000` karakter). `/context` menampilkan ukuran **mentah vs disuntikkan** dan apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menyuntikkan blok peringatan di dalam prompt di bawah Project Context. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: disuntikkan vs dimuat sesuai kebutuhan

Prompt sistem menyertakan **daftar Skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan melakukan `read` pada `SKILL.md` milik skill **hanya bila diperlukan**.

## Alat: ada dua biaya

Alat memengaruhi konteks dengan dua cara:

1. **Teks daftar alat** di prompt sistem (yang Anda lihat sebagai “Tooling”).
2. **Skema alat** (JSON). Ini dikirim ke model agar model dapat memanggil alat. Semuanya dihitung ke konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` merinci skema alat terbesar sehingga Anda dapat melihat apa yang paling dominan.

## Perintah, directive, dan "shortcut inline"

Perintah slash ditangani oleh Gateway. Ada beberapa perilaku berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Directive**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi directive akan mempertahankan pengaturan sesi.
  - Directive inline di dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Shortcut inline** (hanya pengirim yang diizinkan): token `/...` tertentu di dalam pesan normal dapat langsung dijalankan (contoh: “hey /status”), dan dihapus sebelum model melihat sisa teks.

Detail: [Perintah slash](/tools/slash-commands).

## Sesi, kompaksi, dan pruning (apa yang dipertahankan)

Apa yang dipertahankan di seluruh pesan bergantung pada mekanismenya:

- **Riwayat normal** dipertahankan dalam transkrip sesi sampai dikompaksi/dipruning oleh kebijakan.
- **Kompaksi** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pruning** menghapus hasil alat lama dari prompt _dalam memori_ untuk sebuah run, tetapi tidak menulis ulang transkrip.

Dokumentasi: [Sesi](/concepts/session), [Kompaksi](/concepts/compaction), [Pruning sesi](/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks bawaan `legacy` untuk perakitan dan
kompaksi. Jika Anda memasang plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw akan mendelegasikan perakitan konteks,
`/compact`, dan hook siklus hidup konteks subagen terkait ke
mesin tersebut. `ownsCompaction: false` tidak otomatis kembali ke mesin `legacy`;
mesin aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Mesin Konteks](/concepts/context-engine) untuk antarmuka pluggable lengkap,
hook siklus hidup, dan konfigurasi.

## Apa yang sebenarnya dilaporkan oleh `/context`

`/context` lebih memilih laporan prompt sistem **yang dibangun saat run** terbaru jika tersedia:

- `System prompt (run)` = diambil dari run embedded terakhir (mampu memakai alat) dan disimpan di session store.
- `System prompt (estimate)` = dihitung saat itu juga ketika belum ada laporan run (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan).

Bagaimanapun juga, perintah ini melaporkan ukuran dan kontributor teratas; perintah ini **tidak** membuang prompt sistem lengkap atau skema alat lengkap.

## Terkait

- [Mesin Konteks](/concepts/context-engine) — injeksi konteks kustom melalui plugin
- [Kompaksi](/concepts/compaction) — merangkum percakapan panjang
- [Prompt Sistem](/concepts/system-prompt) — cara prompt sistem dibangun
- [Loop Agen](/concepts/agent-loop) — siklus eksekusi agen lengkap
