---
read_when:
    - Anda ingin memahami apa arti “konteks” di OpenClaw
    - Anda sedang men-debug mengapa model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi overhead konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, bagaimana konteks itu dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-04-24T09:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

“Konteks” adalah **semua yang OpenClaw kirim ke model untuk satu run**. Ini dibatasi oleh **jendela konteks** model (batas token).

Model mental untuk pemula:

- **Prompt sistem** (dibangun OpenClaw): aturan, tool, daftar Skills, waktu/runtime, dan file workspace yang disuntikkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Pemanggilan/hasil tool + lampiran**: output perintah, pembacaan file, gambar/audio, dan sebagainya.

Konteks _tidak sama_ dengan “memory”: memory dapat disimpan di disk dan dimuat ulang nanti; konteks adalah apa yang ada di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat “seberapa penuh jendela saya?” + pengaturan sesi.
- `/context list` → apa yang disuntikkan + ukuran kasar (per file + total).
- `/context detail` → rincian lebih dalam: ukuran per file, ukuran skema per-tool, ukuran entri per-Skills, dan ukuran prompt sistem.
- `/usage tokens` → tambahkan footer penggunaan per balasan ke balasan normal.
- `/compact` → rangkum riwayat lama menjadi entri ringkas untuk mengosongkan ruang jendela.

Lihat juga: [Slash commands](/id/tools/slash-commands), [Penggunaan token & biaya](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh output

Nilai bervariasi menurut model, provider, kebijakan tool, dan isi workspace Anda.

### `/context list`

```
🧠 Rincian konteks
Workspace: <workspaceDir>
Maks bootstrap/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
Prompt sistem (run): 38,412 chars (~9,603 tok) (Konteks Proyek 23,901 chars (~5,976 tok))

File workspace yang disuntikkan:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Daftar Skills (teks prompt sistem): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Daftar tool (teks prompt sistem): 1,032 chars (~258 tok)
Skema tool (JSON): 31,988 chars (~7,997 tok) (dihitung dalam konteks; tidak ditampilkan sebagai teks)
Tools: (same as above)

Token sesi (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Rincian konteks (terperinci)
…
Skills teratas (ukuran entri prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 skills lainnya)

Tools teratas (ukuran skema):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N tools lainnya)
```

## Apa yang dihitung terhadap jendela konteks

Semua yang diterima model dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Pemanggilan tool + hasil tool.
- Lampiran/transkrip (gambar/audio/file).
- Ringkasan Compaction dan artefak pruning.
- “Wrapper” provider atau header tersembunyi (tidak terlihat, tetapi tetap dihitung).

## Cara OpenClaw membangun prompt sistem

Prompt sistem **dimiliki OpenClaw** dan dibangun ulang pada setiap run. Isinya mencakup:

- Daftar tool + deskripsi singkat.
- Daftar Skills (hanya metadata; lihat di bawah).
- Lokasi workspace.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/thinking).
- File bootstrap workspace yang disuntikkan di bawah **Konteks Proyek**.

Rincian lengkap: [System Prompt](/id/concepts/system-prompt).

## File workspace yang disuntikkan (Konteks Proyek)

Secara default, OpenClaw menyuntikkan sekumpulan file workspace tetap (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya run pertama)

File besar dipotong per file menggunakan `agents.defaults.bootstrapMaxChars` (default `12000` chars). OpenClaw juga menerapkan batas total injeksi bootstrap di seluruh file dengan `agents.defaults.bootstrapTotalMaxChars` (default `60000` chars). `/context` menampilkan ukuran **raw vs injected** dan apakah terjadi pemotongan.

Saat pemotongan terjadi, runtime dapat menyuntikkan blok peringatan dalam prompt di bawah Konteks Proyek. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; default `once`).

## Skills: disuntikkan vs dimuat sesuai permintaan

Prompt sistem mencakup **daftar Skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini memiliki overhead nyata.

Instruksi Skills _tidak_ disertakan secara default. Model diharapkan untuk `read` `SKILL.md` milik skill **hanya saat diperlukan**.

## Tools: ada dua biaya

Tools memengaruhi konteks dalam dua cara:

1. **Teks daftar tool** dalam prompt sistem (yang Anda lihat sebagai “Tooling”).
2. **Skema tool** (JSON). Ini dikirim ke model agar model dapat memanggil tool. Ini dihitung terhadap konteks meskipun Anda tidak melihatnya sebagai teks biasa.

`/context detail` menguraikan skema tool terbesar sehingga Anda dapat melihat apa yang paling dominan.

## Perintah, directive, dan "shortcut inline"

Slash command ditangani oleh Gateway. Ada beberapa perilaku berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Directive**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi directive akan menyimpan pengaturan sesi.
  - Directive inline dalam pesan normal bertindak sebagai petunjuk per pesan.
- **Shortcut inline** (hanya pengirim yang ada di allowlist): token `/...` tertentu di dalam pesan normal dapat langsung dijalankan (contoh: “hey /status”), lalu dihapus sebelum model melihat sisa teks.

Detail: [Slash commands](/id/tools/slash-commands).

## Sesi, Compaction, dan pruning (apa yang dipertahankan)

Apa yang dipertahankan antar pesan bergantung pada mekanismenya:

- **Riwayat normal** dipertahankan dalam transkrip sesi sampai di-compact/di-prune oleh kebijakan.
- **Compaction** mempertahankan ringkasan ke dalam transkrip dan menjaga pesan terbaru tetap utuh.
- **Pruning** menghapus hasil tool lama dari prompt _dalam memori_ untuk membebaskan ruang jendela konteks, tetapi tidak menulis ulang transkrip sesi — riwayat lengkapnya masih dapat diperiksa di disk.

Dokumentasi: [Session](/id/concepts/session), [Compaction](/id/concepts/compaction), [Session pruning](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks bawaan `legacy` untuk perakitan dan
Compaction. Jika Anda memasang Plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan
perakitan konteks, `/compact`, dan hook siklus hidup konteks subagen terkait ke
mesin tersebut. `ownsCompaction: false` tidak otomatis fallback ke mesin
legacy; mesin aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Context Engine](/id/concepts/context-engine) untuk antarmuka pluggable lengkap,
hook siklus hidup, dan konfigurasi.

## Apa yang sebenarnya dilaporkan `/context`

`/context` lebih memilih laporan prompt sistem **yang dibangun saat run** terbaru jika tersedia:

- `System prompt (run)` = diambil dari run embedded (mampu menggunakan tool) terakhir dan disimpan di session store.
- `System prompt (estimate)` = dihitung saat itu juga ketika tidak ada laporan run (atau saat berjalan melalui backend CLI yang tidak menghasilkan laporan).

Dalam kedua kasus, ini melaporkan ukuran dan kontributor terbesar; ini **tidak** menampilkan prompt sistem lengkap atau skema tool lengkap.

## Terkait

- [Context Engine](/id/concepts/context-engine) — injeksi konteks kustom melalui Plugin
- [Compaction](/id/concepts/compaction) — merangkum percakapan panjang
- [System Prompt](/id/concepts/system-prompt) — cara prompt sistem dibangun
- [Agent Loop](/id/concepts/agent-loop) — siklus eksekusi agen lengkap
