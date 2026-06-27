---
read_when:
    - Anda ingin mengedit persetujuan exec dari CLI
    - Anda perlu mengelola daftar izin pada host Gateway atau Node
summary: Referensi CLI untuk `openclaw approvals` dan `openclaw exec-policy`
title: Persetujuan
x-i18n:
    generated_at: "2026-06-27T17:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Kelola persetujuan exec untuk **host lokal**, **host Gateway**, atau **host Node**.
Secara default, perintah menargetkan file persetujuan lokal di disk. Gunakan `--gateway` untuk menargetkan Gateway, atau `--node` untuk menargetkan Node tertentu.

Alias: `openclaw exec-approvals`

Terkait:

- Persetujuan exec: [Persetujuan exec](/id/tools/exec-approvals)
- Node: [Node](/id/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` adalah perintah kemudahan lokal untuk menjaga konfigurasi
`tools.exec.*` yang diminta dan file persetujuan host lokal tetap selaras dalam satu langkah.

Gunakan saat Anda ingin:

- memeriksa kebijakan lokal yang diminta, file persetujuan host, dan penggabungan efektif
- menerapkan preset lokal seperti YOLO atau tolak-semua
- menyinkronkan `tools.exec.*` lokal dan file persetujuan host lokal

Contoh:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Mode output:

- tanpa `--json`: mencetak tampilan tabel yang dapat dibaca manusia
- `--json`: mencetak output terstruktur yang dapat dibaca mesin

Cakupan saat ini:

- `exec-policy` **hanya lokal**
- perintah ini memperbarui file konfigurasi lokal dan file persetujuan lokal secara bersamaan
- perintah ini **tidak** mendorong kebijakan ke host Gateway atau host Node
- `--host node` ditolak dalam perintah ini karena persetujuan exec Node diambil dari Node saat runtime dan harus dikelola melalui perintah persetujuan yang menargetkan Node
- `openclaw exec-policy show` menandai cakupan `host=node` sebagai dikelola Node saat runtime, bukan menurunkan kebijakan efektif dari file persetujuan lokal

Jika Anda perlu mengedit persetujuan host jarak jauh secara langsung, tetap gunakan `openclaw approvals set --gateway`
atau `openclaw approvals set --node <id|name|ip>`.

## Perintah umum

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` kini menampilkan kebijakan exec efektif untuk target lokal, Gateway, dan Node:

- kebijakan `tools.exec` yang diminta
- kebijakan file persetujuan host
- hasil efektif setelah aturan presedensi diterapkan

Presedensi ini disengaja:

- file persetujuan host adalah sumber kebenaran yang dapat ditegakkan
- kebijakan `tools.exec` yang diminta dapat mempersempit atau memperluas maksud, tetapi hasil efektif tetap diturunkan dari aturan host
- `--node` menggabungkan file persetujuan host Node dengan kebijakan `tools.exec` Gateway, karena keduanya tetap berlaku saat runtime
- jika konfigurasi Gateway tidak tersedia, CLI kembali ke snapshot persetujuan Node dan mencatat bahwa kebijakan runtime akhir tidak dapat dihitung

## Ganti persetujuan dari file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` menerima JSON5, bukan hanya JSON ketat. Gunakan salah satu dari `--file` atau `--stdin`, bukan keduanya.

## Contoh "Jangan pernah minta konfirmasi" / YOLO

Untuk host yang tidak boleh pernah berhenti pada persetujuan exec, atur default persetujuan host ke `full` + `off`:

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

Varian Node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
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

Ini hanya mengubah **file persetujuan host**. Untuk menjaga kebijakan OpenClaw yang diminta tetap selaras, atur juga:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Mengapa `tools.exec.host=gateway` dalam contoh ini:

- `host=auto` tetap berarti "sandbox jika tersedia, jika tidak Gateway".
- YOLO berkaitan dengan persetujuan, bukan perutean.
- Jika Anda menginginkan exec host bahkan ketika sandbox dikonfigurasi, buat pilihan host eksplisit dengan `gateway` atau `/exec host=gateway`.

`askFallback` yang dihilangkan default-nya adalah `deny`. Atur `askFallback: "full"`
secara eksplisit saat memutakhirkan host tanpa UI yang harus mempertahankan perilaku tanpa permintaan konfirmasi.

Pintasan lokal:

```bash
openclaw exec-policy preset yolo
```

Pintasan lokal itu memperbarui konfigurasi `tools.exec.*` lokal yang diminta dan default
persetujuan lokal secara bersamaan. Maksudnya setara dengan penyiapan manual dua langkah
di atas, tetapi hanya untuk mesin lokal.

## Pembantu daftar izinkan

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opsi umum

`get`, `set`, dan `allowlist add|remove` semuanya mendukung:

- `--node <id|name|ip>`
- `--gateway`
- opsi RPC Node bersama: `--url`, `--token`, `--timeout`, `--json`

Catatan penargetan:

- tanpa flag target berarti file persetujuan lokal di disk
- `--gateway` menargetkan file persetujuan host Gateway
- `--node` menargetkan satu host Node setelah menyelesaikan id, nama, IP, atau prefiks id

`allowlist add|remove` juga mendukung:

- `--agent <id>` (default ke `*`)

## Catatan

- `--node` menggunakan resolver yang sama dengan `openclaw nodes` (id, nama, ip, atau prefiks id).
- `--agent` default ke `"*"`, yang berlaku untuk semua agent.
- Host Node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host Node headless).
- File persetujuan disimpan per host di direktori state OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, atau
  `~/.openclaw/exec-approvals.json` saat variabel tidak disetel).

## Terkait

- [Referensi CLI](/id/cli)
- [Persetujuan exec](/id/tools/exec-approvals)
