---
read_when:
    - Anda ingin mengedit persetujuan exec dari CLI
    - Anda perlu mengelola allowlist pada host gateway atau node
summary: Referensi CLI untuk `openclaw approvals` (persetujuan exec untuk gateway atau host node)
title: approvals
x-i18n:
    generated_at: "2026-04-05T13:45:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Kelola persetujuan exec untuk **host lokal**, **host gateway**, atau **host node**.
Secara default, perintah menargetkan file persetujuan lokal di disk. Gunakan `--gateway` untuk menargetkan gateway, atau `--node` untuk menargetkan node tertentu.

Alias: `openclaw exec-approvals`

Terkait:

- Persetujuan exec: [Exec approvals](/tools/exec-approvals)
- Node: [Nodes](/nodes)

## Perintah umum

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` sekarang menampilkan kebijakan exec efektif untuk target lokal, gateway, dan node:

- kebijakan `tools.exec` yang diminta
- kebijakan file persetujuan host
- hasil efektif setelah aturan prioritas diterapkan

Prioritas ini disengaja:

- file persetujuan host adalah sumber kebenaran yang dapat diberlakukan
- kebijakan `tools.exec` yang diminta dapat mempersempit atau memperluas maksud, tetapi hasil efektif tetap diturunkan dari aturan host
- `--node` menggabungkan file persetujuan host node dengan kebijakan gateway `tools.exec`, karena keduanya tetap berlaku saat runtime
- jika config gateway tidak tersedia, CLI akan fallback ke snapshot persetujuan node dan mencatat bahwa kebijakan runtime akhir tidak dapat dihitung

## Ganti persetujuan dari file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` menerima JSON5, bukan hanya JSON ketat. Gunakan `--file` atau `--stdin`, jangan keduanya.

## Contoh "Never prompt" / YOLO

Untuk host yang seharusnya tidak pernah berhenti pada persetujuan exec, setel default persetujuan host ke `full` + `off`:

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

Varian node:

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

Ini hanya mengubah **file persetujuan host**. Untuk menjaga kebijakan OpenClaw yang diminta tetap selaras, setel juga:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Mengapa `tools.exec.host=gateway` pada contoh ini:

- `host=auto` tetap berarti "sandbox jika tersedia, jika tidak gateway".
- YOLO berkaitan dengan persetujuan, bukan routing.
- Jika Anda menginginkan exec host bahkan ketika sandbox dikonfigurasi, buat pilihan host menjadi eksplisit dengan `gateway` atau `/exec host=gateway`.

Ini sesuai dengan perilaku default host YOLO saat ini. Perketat jika Anda menginginkan persetujuan.

## Helper allowlist

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
- opsi RPC node bersama: `--url`, `--token`, `--timeout`, `--json`

Catatan penargetan:

- tanpa flag target berarti file persetujuan lokal di disk
- `--gateway` menargetkan file persetujuan host gateway
- `--node` menargetkan satu host node setelah menyelesaikan id, nama, IP, atau prefiks id

`allowlist add|remove` juga mendukung:

- `--agent <id>` (default ke `*`)

## Catatan

- `--node` menggunakan resolver yang sama seperti `openclaw nodes` (id, nama, ip, atau prefiks id).
- `--agent` default ke `"*"`, yang berlaku untuk semua agen.
- Host node harus mengiklankan `system.execApprovals.get/set` (aplikasi macOS atau host node headless).
- File persetujuan disimpan per host di `~/.openclaw/exec-approvals.json`.
