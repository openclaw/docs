---
read_when:
    - Anda ingin mengedit persetujuan eksekusi dari CLI
    - Anda perlu mengelola daftar izin pada host Gateway atau Node
    - Anda perlu mencantumkan atau menyelesaikan persetujuan yang tertunda tanpa antarmuka chat
summary: Referensi CLI untuk `openclaw approvals` dan `openclaw exec-policy`
title: Persetujuan
x-i18n:
    generated_at: "2026-07-19T16:20:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Kelola persetujuan eksekusi untuk **host lokal**, **host Gateway**, atau **host node**. Tanpa flag target, perintah membaca/menulis file persetujuan lokal pada disk. Gunakan `--gateway` untuk menargetkan Gateway, atau `--node <id|name|ip>` untuk menargetkan node tertentu.

Alias: `openclaw exec-approvals`

Terkait: [Persetujuan eksekusi](/id/tools/exec-approvals), [Node](/id/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` adalah perintah praktis **khusus lokal** yang menyinkronkan konfigurasi `tools.exec.*` yang diminta dan file persetujuan host lokal dalam satu langkah:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Preset (`yolo`, `cautious`, `deny-all`) menerapkan `host`, `security`, `ask`, dan `askFallback` secara bersamaan. `set` hanya menerapkan flag yang Anda berikan; setiap nilai yang diterima akan divalidasi (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Cakupan:

- Memperbarui file konfigurasi lokal dan file persetujuan lokal secara bersamaan; tidak mengirim kebijakan ke Gateway atau host node.
- `--host node` ditolak: persetujuan eksekusi node diambil dari node saat runtime, sehingga `exec-policy` lokal tidak dapat menyinkronkannya. Gunakan `openclaw approvals set --node <id|name|ip>` sebagai gantinya.
- `exec-policy show` menandai cakupan `host=node` sebagai dikelola oleh node saat runtime, alih-alih memperoleh kebijakan efektif dari file persetujuan lokal.

Untuk persetujuan host jarak jauh, gunakan `openclaw approvals set --gateway` atau `openclaw approvals set --node <id|name|ip>` secara langsung.

## Perintah umum

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` menampilkan kebijakan eksekusi efektif untuk target: kebijakan `tools.exec` yang diminta, kebijakan file persetujuan host, dan hasil efektif yang digabungkan. Node dengan kebijakan asli host, seperti pendamping Windows, menampilkan kebijakan tersebut secara langsung, alih-alih menerapkan perhitungan kebijakan file persetujuan OpenClaw.

Untuk node berbasis file, tampilan gabungan memerlukan snapshot kebijakan yang diselesaikan oleh host. Node lama menampilkan kebijakan efektif sebagai tidak tersedia, alih-alih mengasumsikan bahwa kebijakan yang diminta Gateway juga berlaku pada host.

<Note>
Override `/exec` per sesi tidak disertakan. Jalankan `/exec` dalam sesi terkait untuk memeriksa nilai default saat ini.
</Note>

Prioritas:

- File persetujuan host adalah sumber kebenaran yang dapat diberlakukan.
- Kebijakan `tools.exec` yang diminta dapat mempersempit atau memperluas maksud, tetapi hasil efektif diperoleh dari aturan host.
- `--node` menggabungkan file persetujuan host node dengan kebijakan `tools.exec` Gateway (keduanya berlaku saat runtime).
- Jika konfigurasi Gateway tidak tersedia, CLI kembali menggunakan snapshot persetujuan node dan mencatat bahwa kebijakan runtime akhir tidak dapat dihitung.

## Persetujuan tertunda

Cantumkan persetujuan eksekusi, plugin, dan agen sistem OpenClaw yang tertunda dari Gateway:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

Enumerasi lengkap dan alur `resolve` yang sesuai untuk seluruh operator menggunakan `operator.admin` karena catatan persetujuan tanpa itu tetap menerapkan pemfilteran pemohon/peninjau. Penyelesaian juga meminta cakupan khusus `operator.approvals`. Pemberian akses operator CLI standar mencakup kedua cakupan; klien pihak ketiga dengan akses terbatas tidak boleh meminta akses admin hanya untuk meniru perintah ini.

Output yang dapat dibaca manusia menampilkan jenis persetujuan, atribusi agen/sesi, usia permintaan, waktu hingga kedaluwarsa, perintah atau ringkasan yang dipersingkat, serta token ID `id64_<base64url>` yang netral terhadap shell. Blok `Full request text` selalu mengikuti tabel ringkas dengan setiap token lengkap dan permintaan yang di-escape tanpa kehilangan informasi, sehingga pemendekan karena lebar terminal tidak dapat menyembunyikan sufiks atau token yang diperlukan untuk penyelesaian. Salin token lengkap ke `resolve`. Karakter terminal yang tidak aman dalam bidang lain ditampilkan sebagai escape Unicode yang terlihat. Output JSON mengembalikan entri yang dinormalisasi di bawah `approvals`, dengan mempertahankan `id`, `summary`, `createdAtMs`, dan `expiresAtMs` mentah asli untuk skrip; ID mentah tetap diterima oleh `resolve` kecuali menggunakan prefiks token tampilan `id64_` yang dicadangkan.

Jika nilai `id64_` yang diberikan cocok dengan ID mentah literal sekaligus token tampilan yang didekodekan untuk persetujuan lain, CLI menolaknya sebagai ambigu agar tidak berisiko menyelesaikan permintaan yang salah.

Selesaikan satu persetujuan berdasarkan ID lengkapnya:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Tidak diharapkan selama pemeliharaan"
```

CLI membaca catatan persetujuan terpadu untuk memilih jenisnya, memeriksa keputusan yang diminta terhadap keputusan yang diizinkan oleh catatan tersebut, lalu memanggil penyelesai terpadu. Keputusan pertama yang berhasil keluar dengan `0`. Mengulangi keputusan yang tercatat juga keluar dengan `0` dan melaporkan `already resolved (same decision)`. Keputusan yang bertentangan, persetujuan yang tidak ditemukan, persetujuan yang kedaluwarsa, atau keputusan yang tidak tersedia untuk jenis persetujuan tersebut akan menampilkan kesalahan yang jelas dan keluar dengan status bukan nol.

`--reason` menambahkan catatan lokal ke konfirmasi CLI. Catatan persetujuan Gateway saat ini tidak memiliki bidang alasan penyelesaian berupa teks bebas, sehingga catatan ini tidak disimpan atau dikirim ke permukaan persetujuan lainnya.

## Mengganti persetujuan dari file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` menerima JSON5, bukan hanya JSON ketat. Gunakan `--file` atau `--stdin`, jangan keduanya.

Node Windows asli host menggunakan bentuk kebijakannya sendiri:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI terlebih dahulu membaca hash node saat ini dan mengirimkannya bersama pembaruan, sehingga pengeditan lokal yang terjadi bersamaan akan ditolak, bukan ditimpa. `rules` diperlukan karena operasi ini mengganti seluruh daftar aturan node; `defaultAction` bersifat opsional. Node yang melaporkan bahwa kebijakan aslinya dinonaktifkan tidak dapat dikonfigurasi dari jarak jauh; aktifkan atau konfigurasikan kebijakan pada host tersebut terlebih dahulu. Kebijakan asli host tidak mendukung pembantu `allowlist add|remove`.

## Contoh "Jangan pernah meminta konfirmasi" / YOLO

Atur nilai default persetujuan host ke `full` + `off` untuk host yang tidak boleh berhenti karena persetujuan eksekusi:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Untuk node yang mengekspos file persetujuan OpenClaw, gunakan isi yang sama dengan `openclaw approvals set --node <id|name|ip> --stdin`. Node asli host memerlukan bentuk khusus pemiliknya seperti yang ditampilkan di atas.

Ini hanya mengubah **file persetujuan host**. Agar kebijakan OpenClaw yang diminta tetap selaras, atur juga:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` dinyatakan secara eksplisit di sini karena `host=auto` masih berarti "gunakan sandbox jika tersedia, jika tidak gunakan Gateway": YOLO berkaitan dengan persetujuan, bukan perutean. Gunakan `gateway` (atau `/exec host=gateway`) jika Anda menginginkan eksekusi host meskipun sandbox dikonfigurasi.

`askFallback` yang dihilangkan secara default bernilai `deny`. Atur `askFallback: "full"` secara eksplisit saat meningkatkan versi host tanpa UI yang harus mempertahankan perilaku tanpa konfirmasi.

Pintasan lokal untuk maksud yang sama, hanya pada mesin lokal:

```bash
openclaw exec-policy preset yolo
```

## Pembantu daftar izin

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opsi umum

`get`, `set`, dan `allowlist add|remove` semuanya mendukung:

- `--node <id|name|ip>` (menyelesaikan ID, nama, IP, atau prefiks ID; penyelesai yang sama dengan `openclaw nodes`)
- `--gateway`
- opsi RPC node bersama: `--url`, `--token`, `--timeout`, `--json`

Tanpa flag target berarti file persetujuan lokal pada disk.

`allowlist add|remove` juga mendukung `--agent <id>` (secara default bernilai `"*"`, berlaku untuk semua agen).

`pending` dan `resolve` selalu menggunakan Gateway karena permintaan tertunda merupakan status Gateway langsung. Keduanya mendukung opsi koneksi Gateway bersama `--url`, `--token`, dan `--timeout`; `pending` juga mendukung `--json`.

## Catatan

- Host node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS, host node headless, atau pendamping Windows).
- File persetujuan disimpan per host dalam direktori status OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau `~/.openclaw/exec-approvals.json` saat variabel tidak ditetapkan.

## Terkait

- [Referensi CLI](/id/cli)
- [Persetujuan eksekusi](/id/tools/exec-approvals)
