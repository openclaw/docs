---
read_when:
    - Mengonfigurasi grup siaran
    - Men-debug balasan multi-agen di WhatsApp
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agen
title: Grup siaran
x-i18n:
    generated_at: "2026-04-24T08:57:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Status:** Eksperimental  
**Version:** Ditambahkan pada 2026.1.9

## Ikhtisar

Grup Siaran memungkinkan beberapa agen memproses dan merespons pesan yang sama secara bersamaan. Ini memungkinkan Anda membuat tim agen khusus yang bekerja bersama dalam satu grup WhatsApp atau DM — semuanya menggunakan satu nomor telepon.

Cakupan saat ini: **WhatsApp saja** (kanal web).

Grup siaran dievaluasi setelah allowlist kanal dan aturan aktivasi grup. Dalam grup WhatsApp, ini berarti siaran terjadi ketika OpenClaw biasanya akan merespons (misalnya: saat disebut, tergantung pada pengaturan grup Anda).

## Kasus Penggunaan

### 1. Tim Agen Khusus

Terapkan beberapa agen dengan tanggung jawab atomik dan terfokus:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Setiap agen memproses pesan yang sama dan memberikan perspektif khususnya masing-masing.

### 2. Dukungan Multibahasa

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Alur Kerja Jaminan Kualitas

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Otomatisasi Tugas

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Konfigurasi

### Pengaturan Dasar

Tambahkan bagian `broadcast` tingkat atas (di samping `bindings`). Key adalah id peer WhatsApp:

- obrolan grup: JID grup (mis. `120363403215116621@g.us`)
- DM: nomor telepon E.164 (mis. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** Saat OpenClaw akan merespons di obrolan ini, OpenClaw akan menjalankan ketiga agen tersebut.

### Strategi Pemrosesan

Kendalikan cara agen memproses pesan:

#### Paralel (Default)

Semua agen memproses secara bersamaan:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Berurutan

Agen memproses secara berurutan (satu agen menunggu agen sebelumnya selesai):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Contoh Lengkap

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Cara Kerjanya

### Alur Pesan

1. **Pesan masuk** tiba di grup WhatsApp
2. **Pemeriksaan siaran**: Sistem memeriksa apakah ID peer ada di `broadcast`
3. **Jika ada dalam daftar siaran**:
   - Semua agen yang tercantum memproses pesan
   - Setiap agen memiliki kunci sesi sendiri dan konteks yang terisolasi
   - Agen memproses secara paralel (default) atau berurutan
4. **Jika tidak ada dalam daftar siaran**:
   - Routing normal berlaku (binding pertama yang cocok)

Catatan: grup siaran tidak melewati allowlist kanal atau aturan aktivasi grup (penyebutan/perintah/dll.). Grup siaran hanya mengubah _agen mana yang berjalan_ ketika suatu pesan memenuhi syarat untuk diproses.

### Isolasi Sesi

Setiap agen dalam grup siaran mempertahankan hal-hal berikut secara sepenuhnya terpisah:

- **Kunci sesi** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agen tidak melihat pesan agen lain)
- **Workspace** (sandbox terpisah jika dikonfigurasi)
- **Akses tool** (daftar izin/larangan yang berbeda)
- **Memori/konteks** (IDENTITY.md, SOUL.md, dll. yang terpisah)
- **Buffer konteks grup** (pesan grup terbaru yang digunakan untuk konteks) dibagikan per peer, jadi semua agen siaran melihat konteks yang sama saat dipicu

Ini memungkinkan setiap agen memiliki:

- Kepribadian yang berbeda
- Akses tool yang berbeda (mis., hanya-baca vs. baca-tulis)
- Model yang berbeda (mis., opus vs. sonnet)
- Skills yang berbeda terpasang

### Contoh: Sesi Terisolasi

Di grup `120363403215116621@g.us` dengan agen `["alfred", "baerbel"]`:

**Konteks Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Konteks Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Praktik Terbaik

### 1. Buat Agen Tetap Terfokus

Rancang setiap agen dengan satu tanggung jawab yang jelas:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Baik:** Setiap agen memiliki satu tugas  
❌ **Buruk:** Satu agen generik "dev-helper"

### 2. Gunakan Nama yang Deskriptif

Buat jelas apa yang dilakukan setiap agen:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Konfigurasikan Akses Tool yang Berbeda

Berikan agen hanya tool yang mereka butuhkan:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Hanya-baca
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Baca-tulis
    }
  }
}
```

### 4. Pantau Performa

Dengan banyak agen, pertimbangkan:

- Menggunakan `"strategy": "parallel"` (default) untuk kecepatan
- Membatasi grup siaran hingga 5-10 agen
- Menggunakan model yang lebih cepat untuk agen yang lebih sederhana

### 5. Tangani Kegagalan dengan Baik

Agen gagal secara independen. Error pada satu agen tidak memblokir agen lain:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Kompatibilitas

### Provider

Grup siaran saat ini berfungsi dengan:

- ✅ WhatsApp (sudah diimplementasikan)
- 🚧 Telegram (direncanakan)
- 🚧 Discord (direncanakan)
- 🚧 Slack (direncanakan)

### Routing

Grup siaran bekerja berdampingan dengan routing yang sudah ada:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Hanya alfred yang merespons (routing normal)
- `GROUP_B`: agent1 DAN agent2 merespons (siaran)

**Prioritas:** `broadcast` memiliki prioritas lebih tinggi daripada `bindings`.

## Pemecahan Masalah

### Agen Tidak Merespons

**Periksa:**

1. ID agen ada di `agents.list`
2. Format ID peer benar (mis., `120363403215116621@g.us`)
3. Agen tidak ada dalam daftar larangan

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Hanya Satu Agen yang Merespons

**Penyebab:** ID peer mungkin ada di `bindings` tetapi tidak ada di `broadcast`.

**Perbaikan:** Tambahkan ke konfigurasi broadcast atau hapus dari bindings.

### Masalah Performa

**Jika lambat dengan banyak agen:**

- Kurangi jumlah agen per grup
- Gunakan model yang lebih ringan (`sonnet` alih-alih `opus`)
- Periksa waktu startup sandbox

## Contoh

### Contoh 1: Tim Review Kode

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Pengguna mengirim:** Cuplikan kode  
**Respons:**

- code-formatter: "Memperbaiki indentasi dan menambahkan type hint"
- security-scanner: "⚠️ Kerentanan SQL injection di baris 12"
- test-coverage: "Cakupan 45%, belum ada pengujian untuk kasus error"
- docs-checker: "Docstring untuk fungsi `process_data` belum ada"

### Contoh 2: Dukungan Multibahasa

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Referensi API

### Skema Konfigurasi

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Field

- `strategy` (opsional): Cara memproses agen
  - `"parallel"` (default): Semua agen memproses secara bersamaan
  - `"sequential"`: Agen memproses sesuai urutan dalam array
- `[peerId]`: JID grup WhatsApp, nomor E.164, atau ID peer lainnya
  - Nilai: Array ID agen yang harus memproses pesan

## Batasan

1. **Maks agen:** Tidak ada batas keras, tetapi 10+ agen mungkin lambat
2. **Konteks bersama:** Agen tidak melihat respons satu sama lain (sesuai desain)
3. **Urutan pesan:** Respons paralel dapat tiba dalam urutan apa pun
4. **Batas laju:** Semua agen dihitung terhadap batas laju WhatsApp

## Peningkatan Mendatang

Fitur yang direncanakan:

- [ ] Mode konteks bersama (agen melihat respons satu sama lain)
- [ ] Koordinasi agen (agen dapat saling memberi sinyal)
- [ ] Pemilihan agen dinamis (memilih agen berdasarkan isi pesan)
- [ ] Prioritas agen (beberapa agen merespons sebelum agen lain)

## Terkait

- [Grup](/id/channels/groups)
- [Routing kanal](/id/channels/channel-routing)
- [Pairing](/id/channels/pairing)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Manajemen sesi](/id/concepts/session)
