---
read_when:
    - Anda ingin memahami arti "konteks" dalam OpenClaw
    - Anda sedang men-debug alasan model “mengetahui” sesuatu (atau melupakannya)
    - Anda ingin mengurangi beban konteks (/context, /status, /compact)
summary: 'Konteks: apa yang dilihat model, cara konteks tersebut dibangun, dan cara memeriksanya'
title: Konteks
x-i18n:
    generated_at: "2026-07-12T14:08:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

"Konteks" adalah **segala sesuatu yang dikirim OpenClaw ke model untuk satu proses**. Konteks dibatasi oleh **jendela konteks** model (batas token).

Model mental untuk pemula:

- **Prompt sistem** (dibuat OpenClaw): aturan, alat, daftar Skills, waktu/runtime, dan berkas ruang kerja yang disisipkan.
- **Riwayat percakapan**: pesan Anda + pesan asisten untuk sesi ini.
- **Pemanggilan/hasil alat + lampiran**: keluaran perintah, pembacaan berkas, gambar/audio, dan sebagainya.

Konteks _tidak sama_ dengan "memori": memori dapat disimpan di disk dan dimuat kembali nanti; konteks adalah segala sesuatu di dalam jendela model saat ini.

## Mulai cepat (periksa konteks)

- `/status` → tampilan cepat "seberapa penuh jendela saya?" + pengaturan sesi.
- `/context list` → apa yang disisipkan + perkiraan ukuran (per berkas + total).
- `/context detail` → perincian lebih mendalam: ukuran per berkas, per skema alat, per entri Skills, ukuran prompt sistem, dan jumlah pesan transkrip yang dapat dipadatkan.
- `/context map` → gambar peta pohon bergaya WinDirStat dari kontributor konteks yang dilacak dalam sesi saat ini.
- `/usage tokens` → tambahkan catatan kaki penggunaan per balasan ke balasan normal.
- `/compact` → rangkum riwayat lama menjadi entri ringkas untuk mengosongkan ruang jendela.

Lihat juga: [Perintah garis miring](/id/tools/slash-commands), [Penggunaan & biaya token](/id/reference/token-use), [Compaction](/id/concepts/compaction).

## Contoh keluaran

Nilai bervariasi menurut model, penyedia, kebijakan alat, dan isi ruang kerja Anda.

### `/context list`

```text
🧠 Perincian konteks
Ruang kerja: <workspaceDir>
Maksimum bootstrap/berkas: 12.000 karakter
Sandbox: mode=non-main sandboxed=false
Prompt sistem (proses): 38.412 karakter (~9.603 token) (Konteks Proyek 23.901 karakter (~5.976 token))

Berkas ruang kerja yang disisipkan:
- AGENTS.md: OK | mentah 1.742 karakter (~436 token) | disisipkan 1.742 karakter (~436 token)
- SOUL.md: OK | mentah 912 karakter (~228 token) | disisipkan 912 karakter (~228 token)
- TOOLS.md: DIPOTONG | mentah 54.210 karakter (~13.553 token) | disisipkan 20.962 karakter (~5.241 token)
- IDENTITY.md: OK | mentah 211 karakter (~53 token) | disisipkan 211 karakter (~53 token)
- USER.md: OK | mentah 388 karakter (~97 token) | disisipkan 388 karakter (~97 token)
- HEARTBEAT.md: TIDAK ADA | mentah 0 | disisipkan 0
- BOOTSTRAP.md: OK | mentah 0 karakter (~0 token) | disisipkan 0 karakter (~0 token)

Daftar Skills (teks prompt sistem): 2.184 karakter (~546 token) (12 skill)
Alat: read, edit, write, exec, process, browser, message, sessions_send, …
Daftar alat (teks prompt sistem): 1.032 karakter (~258 token)
Skema alat (JSON): 31.988 karakter (~7.997 token) (dihitung dalam konteks; tidak ditampilkan sebagai teks)
Alat: (sama seperti di atas)

Token sesi (di-cache): total 14.250 / ctx=32.000
```

### `/context detail`

```text
🧠 Perincian konteks (mendetail)
…
Skill teratas (ukuran entri prompt):
- frontend-design: 412 karakter (~103 token)
- oracle: 401 karakter (~101 token)
… (+10 skill lainnya)

Alat teratas (ukuran skema):
- browser: 9.812 karakter (~2.453 token)
- exec: 6.240 karakter (~1.560 token)
… (+N alat lainnya)
```

### `/context map`

Mengirim gambar yang dibuat dari laporan proses terbaru dalam cache beserta transkrip sesi. Sebelum pesan normal menghasilkan laporan proses dalam sesi, `/context map` mengembalikan pesan tidak tersedia alih-alih merender perkiraan. Luas persegi panjang sebanding dengan karakter prompt yang dilacak:

- transkrip percakapan (pesan pengguna, balasan asisten, hasil alat, ringkasan Compaction), ditambah konteks runtime per giliran dan tambahan prompt hook yang hanya mencapai model
- berkas ruang kerja yang disisipkan
- teks prompt sistem dasar
- entri prompt Skills
- skema JSON alat

Grup percakapan bertambah seiring berlangsungnya sesi, sehingga peta berubah dari satu giliran ke giliran berikutnya; setelah Compaction, grup tersebut menyusut menjadi petak ringkasan.

`/context list`, `/context detail`, dan `/context json` tetap dapat memeriksa perkiraan sesuai permintaan saat tidak ada laporan proses dalam cache.

## Apa yang dihitung dalam jendela konteks

Segala sesuatu yang diterima model dihitung, termasuk:

- Prompt sistem (semua bagian).
- Riwayat percakapan.
- Pemanggilan alat + hasil alat.
- Lampiran/transkrip (gambar/audio/berkas).
- Ringkasan Compaction dan artefak pemangkasan.
- "Pembungkus" penyedia atau header tersembunyi (tidak terlihat, tetapi tetap dihitung).

## Cara OpenClaw membuat prompt sistem

Prompt sistem **dimiliki OpenClaw** dan dibuat ulang pada setiap proses. Prompt tersebut mencakup:

- Daftar alat + deskripsi singkat.
- Daftar Skills (hanya metadata; lihat di bawah).
- Lokasi ruang kerja.
- Waktu (UTC + waktu pengguna yang dikonversi jika dikonfigurasi).
- Metadata runtime (host/OS/model/penalaran).
- Berkas bootstrap ruang kerja yang disisipkan di bawah **Konteks Proyek**.

Perincian lengkap: [Prompt Sistem](/id/concepts/system-prompt).

## Berkas ruang kerja yang disisipkan (Konteks Proyek)

Secara default, OpenClaw menyisipkan sekumpulan tetap berkas ruang kerja (jika ada):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (hanya proses pertama)

Berkas besar dipotong per berkas menggunakan `agents.defaults.bootstrapMaxChars` (nilai default `20000` karakter). OpenClaw juga memberlakukan batas total penyisipan bootstrap pada semua berkas dengan `agents.defaults.bootstrapTotalMaxChars` (nilai default `60000` karakter). `/context` menampilkan ukuran **mentah dibandingkan dengan yang disisipkan** dan apakah pemotongan terjadi.

Saat pemotongan terjadi, runtime dapat menyisipkan blok peringatan di dalam prompt di bawah Konteks Proyek. Konfigurasikan ini dengan `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; nilai default `always`).

## Skills: disisipkan dibandingkan dengan dimuat sesuai kebutuhan

Prompt sistem menyertakan **daftar Skills** yang ringkas (nama + deskripsi + lokasi). Daftar ini menimbulkan beban nyata.

Instruksi skill _tidak_ disertakan secara default. Model diharapkan menggunakan `read` pada `SKILL.md` milik skill tersebut **hanya saat diperlukan**.

## Alat: ada dua biaya

Alat memengaruhi konteks dalam dua cara:

1. **Teks daftar alat** dalam prompt sistem (yang Anda lihat sebagai "Peralatan").
2. **Skema alat** (JSON). Skema ini dikirim ke model agar model dapat memanggil alat. Skema tersebut dihitung dalam konteks meskipun tidak terlihat sebagai teks biasa.

`/context detail` memerinci skema alat terbesar agar Anda dapat melihat apa yang paling mendominasi.

## Perintah, direktif, dan "pintasan sebaris"

Perintah garis miring ditangani oleh Gateway. Ada beberapa perilaku yang berbeda:

- **Perintah mandiri**: pesan yang hanya berisi `/...` dijalankan sebagai perintah.
- **Direktif**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` dihapus sebelum model melihat pesan.
  - Pesan yang hanya berisi direktif mempertahankan pengaturan sesi.
  - Direktif sebaris dalam pesan normal berfungsi sebagai petunjuk per pesan.
- **Pintasan sebaris** (hanya pengirim yang tercantum dalam daftar izin): token `/...` tertentu di dalam pesan normal dapat langsung dijalankan (contoh: "hai /status"), lalu dihapus sebelum model melihat teks yang tersisa.

Detail: [Perintah garis miring](/id/tools/slash-commands).

## Sesi, Compaction, dan pemangkasan (apa yang dipertahankan)

Apa yang dipertahankan di antara pesan bergantung pada mekanismenya:

- **Riwayat normal** dipertahankan dalam transkrip sesi hingga dipadatkan/dipangkas oleh kebijakan.
- **Compaction** menyimpan ringkasan ke dalam transkrip dan mempertahankan pesan terbaru tetap utuh.
- **Pemangkasan** menghapus hasil alat lama dari prompt _dalam memori_ untuk mengosongkan ruang jendela konteks, tetapi tidak menulis ulang transkrip sesi—riwayat lengkap tetap dapat diperiksa di disk.

Dokumentasi: [Sesi](/id/concepts/session), [Compaction](/id/concepts/compaction), [Pemangkasan sesi](/id/concepts/session-pruning).

Secara default, OpenClaw menggunakan mesin konteks bawaan `legacy` untuk penyusunan dan
Compaction. Jika Anda memasang plugin yang menyediakan `kind: "context-engine"` dan
memilihnya dengan `plugins.slots.contextEngine`, OpenClaw mendelegasikan penyusunan
konteks, `/compact`, dan hook siklus hidup konteks subagen terkait kepada mesin
tersebut. `ownsCompaction: false` tidak secara otomatis kembali ke mesin
`legacy`; mesin aktif tetap harus mengimplementasikan `compact()` dengan benar. Lihat
[Mesin Konteks](/id/concepts/context-engine) untuk antarmuka lengkap yang
dapat dipasangkan, hook siklus hidup, dan konfigurasi.

## Apa yang sebenarnya dilaporkan `/context`

`/context` mengutamakan laporan prompt sistem terbaru yang **dibuat oleh proses** jika tersedia:

- `Prompt sistem (proses)` = diambil dari proses tertanam (berkemampuan alat) terakhir dan disimpan dalam penyimpanan sesi.
- `Prompt sistem (perkiraan)` = dihitung saat itu juga ketika tidak ada laporan proses (atau saat dijalankan melalui backend CLI yang tidak menghasilkan laporan tersebut).

Dalam kedua kasus, perintah tersebut melaporkan ukuran dan kontributor terbesar; perintah itu **tidak** menampilkan seluruh prompt sistem atau skema alat. Dalam mode mendetail, perintah itu juga membandingkan transkrip sesi dengan predikat pesan percakapan nyata yang sama seperti yang digunakan oleh Compaction, sehingga penggunaan prompt/cache yang tinggi lebih mudah dibedakan dari riwayat percakapan yang dapat dipadatkan.

## Terkait

<CardGroup cols={2}>
  <Card title="Mesin konteks" href="/id/concepts/context-engine" icon="puzzle-piece">
    Penyisipan konteks khusus melalui plugin.
  </Card>
  <Card title="Compaction" href="/id/concepts/compaction" icon="compress">
    Merangkum percakapan panjang agar tetap berada di dalam jendela model.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Cara prompt sistem dibuat dan apa yang disisipkannya pada setiap giliran.
  </Card>
  <Card title="Perulangan agen" href="/id/concepts/agent-loop" icon="arrows-rotate">
    Siklus eksekusi agen lengkap dari pesan masuk hingga balasan akhir.
  </Card>
</CardGroup>
