---
read_when:
    - Anda ingin mengedit persetujuan eksekusi dari CLI
    - Anda perlu mengelola daftar izin pada host Gateway atau Node
summary: Referensi CLI untuk `openclaw approvals` dan `openclaw exec-policy`
title: Persetujuan
x-i18n:
    generated_at: "2026-07-12T14:00:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Kelola persetujuan eksekusi untuk **host lokal**, **host Gateway**, atau **host Node**. Tanpa flag target, perintah membaca/menulis berkas persetujuan lokal pada disk. Gunakan `--gateway` untuk menargetkan Gateway, atau `--node <id|name|ip>` untuk menargetkan Node tertentu.

Alias: `openclaw exec-approvals`

Terkait: [Persetujuan eksekusi](/id/tools/exec-approvals), [Node](/id/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` adalah perintah praktis **khusus lokal** yang menyinkronkan konfigurasi `tools.exec.*` yang diminta dan berkas persetujuan host lokal dalam satu langkah:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Preset (`yolo`, `cautious`, `deny-all`) menerapkan `host`, `security`, `ask`, dan `askFallback` secara bersamaan. `set` hanya menerapkan flag yang Anda berikan; setiap nilai yang diterima divalidasi (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Cakupan:

- Memperbarui berkas konfigurasi lokal dan berkas persetujuan lokal secara bersamaan; tidak mengirim kebijakan ke Gateway atau host Node.
- `--host node` ditolak: persetujuan eksekusi Node diambil dari Node saat runtime, sehingga `exec-policy` lokal tidak dapat menyinkronkannya. Gunakan `openclaw approvals set --node <id|name|ip>` sebagai gantinya.
- `exec-policy show` menandai cakupan `host=node` sebagai dikelola Node saat runtime, alih-alih menurunkan kebijakan efektif dari berkas persetujuan lokal.

Untuk persetujuan host jarak jauh, gunakan langsung `openclaw approvals set --gateway` atau `openclaw approvals set --node <id|name|ip>`.

## Perintah umum

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` menampilkan kebijakan eksekusi efektif untuk target: kebijakan `tools.exec` yang diminta, kebijakan berkas persetujuan host, dan hasil efektif gabungan. Node dengan kebijakan bawaan host, seperti aplikasi pendamping Windows, menampilkan kebijakan tersebut secara langsung, alih-alih menerapkan perhitungan kebijakan berkas persetujuan OpenClaw.

Untuk Node berbasis berkas, tampilan gabungan memerlukan snapshot kebijakan yang diselesaikan oleh host. Node versi lama menampilkan kebijakan efektif sebagai tidak tersedia, alih-alih menganggap kebijakan yang diminta oleh Gateway juga berlaku pada host.

<Note>
Penimpaan `/exec` per sesi tidak disertakan. Jalankan `/exec` dalam sesi terkait untuk memeriksa defaultnya saat ini.
</Note>

Urutan prioritas:

- Berkas persetujuan host adalah sumber kebenaran yang dapat diberlakukan.
- Kebijakan `tools.exec` yang diminta dapat mempersempit atau memperluas maksud, tetapi hasil efektif diturunkan dari aturan host.
- `--node` menggabungkan berkas persetujuan host Node dengan kebijakan `tools.exec` Gateway (keduanya berlaku saat runtime).
- Jika konfigurasi Gateway tidak tersedia, CLI menggunakan snapshot persetujuan Node sebagai cadangan dan mencatat bahwa kebijakan runtime akhir tidak dapat dihitung.

## Mengganti persetujuan dari berkas

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` menerima JSON5, bukan hanya JSON ketat. Gunakan salah satu dari `--file` atau `--stdin`, bukan keduanya.

Node Windows dengan kebijakan bawaan host menggunakan bentuk kebijakannya sendiri:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI membaca hash Node saat ini terlebih dahulu dan mengirimkannya bersama pembaruan, sehingga perubahan lokal yang terjadi bersamaan ditolak, bukan ditimpa. `rules` wajib karena operasi ini mengganti seluruh daftar aturan Node; `defaultAction` bersifat opsional. Node yang melaporkan bahwa kebijakan bawaannya dinonaktifkan tidak dapat dikonfigurasi dari jarak jauh; aktifkan atau konfigurasikan kebijakan pada host tersebut terlebih dahulu. Kebijakan bawaan host tidak mendukung pembantu `allowlist add|remove`.

## Contoh "Jangan pernah meminta konfirmasi" / YOLO

Atur default persetujuan host menjadi `full` + `off` untuk host yang tidak boleh berhenti karena persetujuan eksekusi:

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

Untuk Node yang menyediakan berkas persetujuan OpenClaw, gunakan isi yang sama dengan `openclaw approvals set --node <id|name|ip> --stdin`. Node dengan kebijakan bawaan host memerlukan bentuk khusus pemiliknya seperti yang ditampilkan di atas.

Ini hanya mengubah **berkas persetujuan host**. Agar kebijakan OpenClaw yang diminta tetap selaras, atur juga:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` dinyatakan secara eksplisit di sini karena `host=auto` tetap berarti "sandbox jika tersedia, jika tidak Gateway": YOLO berkaitan dengan persetujuan, bukan perutean. Gunakan `gateway` (atau `/exec host=gateway`) jika Anda menginginkan eksekusi host meskipun sandbox telah dikonfigurasi.

`askFallback` yang dihilangkan menggunakan default `deny`. Atur `askFallback: "full"` secara eksplisit saat memutakhirkan host tanpa antarmuka pengguna yang harus mempertahankan perilaku tanpa permintaan konfirmasi.

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

- `--node <id|name|ip>` (menyelesaikan ID, nama, IP, atau prefiks ID; menggunakan penyelesai yang sama dengan `openclaw nodes`)
- `--gateway`
- opsi RPC Node bersama: `--url`, `--token`, `--timeout`, `--json`

Tanpa flag target berarti menggunakan berkas persetujuan lokal pada disk.

`allowlist add|remove` juga mendukung `--agent <id>` (defaultnya `"*"`, berlaku untuk semua agen).

## Catatan

- Host Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS, host Node tanpa antarmuka, atau aplikasi pendamping Windows).
- Berkas persetujuan disimpan per host dalam direktori status OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, atau `~/.openclaw/exec-approvals.json` jika variabel tidak ditetapkan.

## Terkait

- [Referensi CLI](/id/cli)
- [Persetujuan eksekusi](/id/tools/exec-approvals)
