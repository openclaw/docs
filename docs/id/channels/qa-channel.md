---
read_when:
    - Anda sedang menghubungkan transport QA sintetis ke dalam pengujian lokal atau CI
    - Anda memerlukan permukaan konfigurasi qa-channel bawaan
    - Anda sedang mengiterasi otomatisasi QA end-to-end
summary: Plugin kanal kelas Slack sintetis untuk skenario QA OpenClaw yang deterministik
title: Kanal QA
x-i18n:
    generated_at: "2026-04-24T08:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` adalah transport pesan sintetis bawaan untuk QA OpenClaw otomatis.

Ini bukan kanal produksi. Kanal ini ada untuk menguji batas Plugin kanal yang sama
yang digunakan oleh transport nyata sambil menjaga state tetap deterministik dan
sepenuhnya dapat diperiksa.

## Apa yang dilakukan saat ini

- Tata bahasa target kelas Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintetis berbasis HTTP untuk:
  - injeksi pesan masuk
  - penangkapan transkrip keluar
  - pembuatan thread
  - reaksi
  - edit
  - hapus
  - tindakan pencarian dan baca
- Runner self-check sisi host bawaan yang menulis laporan Markdown

## Konfigurasi

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Kunci akun yang didukung:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Irisan vertikal saat ini:

```bash
pnpm qa:e2e
```

Ini sekarang dirutekan melalui ekstensi `qa-lab` bawaan. Ini memulai
bus QA di dalam repo, mem-boot irisan runtime `qa-channel` bawaan, menjalankan
self-check yang deterministik, dan menulis laporan Markdown di bawah `.artifacts/qa-e2e/`.

UI debugger privat:

```bash
pnpm qa:lab:up
```

Satu perintah itu membangun situs QA, memulai stack gateway + QA Lab
berbasis Docker, dan mencetak URL QA Lab. Dari situs tersebut Anda dapat memilih
skenario, memilih lane model, meluncurkan eksekusi individual, dan memantau hasil secara langsung.

Suite QA lengkap berbasis repo:

```bash
pnpm openclaw qa suite
```

Itu meluncurkan debugger QA privat di URL lokal, terpisah dari
bundle UI Control yang dikirimkan.

## Cakupan

Cakupan saat ini sengaja sempit:

- bus + transport Plugin
- tata bahasa perutean ber-thread
- tindakan pesan yang dimiliki kanal
- pelaporan Markdown
- situs QA berbasis Docker dengan kontrol eksekusi

Pekerjaan lanjutan akan menambahkan:

- eksekusi matriks provider/model
- penemuan skenario yang lebih kaya
- orkestrasi native OpenClaw di tahap berikutnya

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Ikhtisar kanal](/id/channels)
