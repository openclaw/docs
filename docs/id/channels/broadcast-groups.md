---
read_when:
    - Mengonfigurasi broadcast groups
    - Men-debug balasan multi-agent di WhatsApp
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agent
title: Broadcast Groups
x-i18n:
    generated_at: "2026-04-05T13:42:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# Broadcast Groups

**Status:** Eksperimental  
**Versi:** Ditambahkan pada 2026.1.9

## Ikhtisar

Broadcast Groups memungkinkan beberapa agent memproses dan merespons pesan yang sama secara bersamaan. Ini memungkinkan Anda membuat tim agent khusus yang bekerja bersama dalam satu grup atau DM WhatsApp — semuanya menggunakan satu nomor telepon.

Cakupan saat ini: **WhatsApp saja** (channel web).

Broadcast groups dievaluasi setelah allowlist channel dan aturan aktivasi grup. Di grup WhatsApp, ini berarti siaran terjadi saat OpenClaw biasanya akan membalas (misalnya: saat disebut, tergantung pada pengaturan grup Anda).

## Kasus Penggunaan

### 1. Tim Agent Khusus

Terapkan beberapa agent dengan tanggung jawab atomik dan terfokus:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Setiap agent memproses pesan yang sama dan memberikan perspektif khususnya.

### 2. Dukungan Multi-Bahasa

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

Tambahkan bagian `broadcast` tingkat atas (di samping `bindings`). Kuncinya adalah ID peer WhatsApp:

- obrolan grup: JID grup (misalnya `120363403215116621@g.us`)
- DM: nomor telepon E.164 (misalnya `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** Saat OpenClaw akan membalas di obrolan ini, OpenClaw akan menjalankan ketiga agent tersebut.

### Strategi Pemrosesan

Kontrol bagaimana agent memproses pesan:

#### Paralel (Default)

Semua agent memproses secara bersamaan:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Berurutan

Agent memproses secara berurutan (satu menunggu yang sebelumnya selesai):

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
2. **Pemeriksaan broadcast**: Sistem memeriksa apakah ID peer ada di `broadcast`
3. **Jika ada dalam daftar broadcast**:
   - Semua agent yang tercantum memproses pesan
   - Setiap agent memiliki kunci sesi sendiri dan konteks yang terisolasi
   - Agent memproses secara paralel (default) atau berurutan
4. **Jika tidak ada dalam daftar broadcast**:
   - Routing normal berlaku (binding pertama yang cocok)

Catatan: broadcast groups tidak mem-bypass allowlist channel atau aturan aktivasi grup (mention/perintah/dll). Fitur ini hanya mengubah _agent mana yang dijalankan_ saat sebuah pesan memenuhi syarat untuk diproses.

### Isolasi Sesi

Setiap agent dalam broadcast group mempertahankan hal-hal berikut secara sepenuhnya terpisah:

- **Kunci sesi** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agent tidak melihat pesan agent lain)
- **Workspace** (sandbox terpisah jika dikonfigurasi)
- **Akses tool** (daftar allow/deny yang berbeda)
- **Memori/konteks** (`IDENTITY.md`, `SOUL.md`, dll. yang terpisah)
- **Buffer konteks grup** (pesan grup terbaru yang digunakan untuk konteks) dibagikan per peer, jadi semua agent broadcast melihat konteks yang sama saat dipicu

Ini memungkinkan setiap agent memiliki:

- Kepribadian yang berbeda
- Akses tool yang berbeda (misalnya, read-only vs. read-write)
- Model yang berbeda (misalnya, opus vs. sonnet)
- Skills berbeda yang terinstal

### Contoh: Sesi Terisolasi

Di grup `120363403215116621@g.us` dengan agent `["alfred", "baerbel"]`:

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

### 1. Pertahankan Agent Tetap Terfokus

Rancang setiap agent dengan satu tanggung jawab yang jelas:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Baik:** Setiap agent memiliki satu tugas  
❌ **Buruk:** Satu agent "dev-helper" generik

### 2. Gunakan Nama yang Deskriptif

Buat jelas apa yang dilakukan setiap agent:

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

Berikan agent hanya tool yang mereka perlukan:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
    }
  }
}
```

### 4. Pantau Performa

Dengan banyak agent, pertimbangkan:

- Menggunakan `"strategy": "parallel"` (default) untuk kecepatan
- Membatasi broadcast groups menjadi 5-10 agent
- Menggunakan model yang lebih cepat untuk agent yang lebih sederhana

### 5. Tangani Kegagalan dengan Baik

Agent gagal secara independen. Kesalahan pada satu agent tidak memblokir yang lain:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Kompatibilitas

### Provider

Broadcast groups saat ini berfungsi dengan:

- ✅ WhatsApp (sudah diimplementasikan)
- 🚧 Telegram (direncanakan)
- 🚧 Discord (direncanakan)
- 🚧 Slack (direncanakan)

### Routing

Broadcast groups berfungsi bersama routing yang sudah ada:

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
- `GROUP_B`: agent1 DAN agent2 merespons (broadcast)

**Prioritas:** `broadcast` memiliki prioritas lebih tinggi daripada `bindings`.

## Pemecahan Masalah

### Agent Tidak Merespons

**Periksa:**

1. ID agent ada di `agents.list`
2. Format ID peer benar (misalnya, `120363403215116621@g.us`)
3. Agent tidak ada dalam deny list

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Hanya Satu Agent yang Merespons

**Penyebab:** ID peer mungkin ada di `bindings` tetapi tidak ada di `broadcast`.

**Perbaikan:** Tambahkan ke konfigurasi broadcast atau hapus dari bindings.

### Masalah Performa

**Jika lambat dengan banyak agent:**

- Kurangi jumlah agent per grup
- Gunakan model yang lebih ringan (sonnet alih-alih opus)
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

**Pengguna mengirim:** Potongan kode  
**Respons:**

- code-formatter: "Memperbaiki indentasi dan menambahkan type hint"
- security-scanner: "⚠️ Kerentanan SQL injection pada baris 12"
- test-coverage: "Cakupan 45%, tes untuk kasus kesalahan masih kurang"
- docs-checker: "Docstring untuk fungsi `process_data` tidak ada"

### Contoh 2: Dukungan Multi-Bahasa

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

- `strategy` (opsional): Cara memproses agent
  - `"parallel"` (default): Semua agent memproses secara bersamaan
  - `"sequential"`: Agent memproses sesuai urutan array
- `[peerId]`: JID grup WhatsApp, nomor E.164, atau ID peer lainnya
  - Nilai: Array ID agent yang harus memproses pesan

## Keterbatasan

1. **Maks agent:** Tidak ada batas keras, tetapi 10+ agent mungkin lambat
2. **Konteks bersama:** Agent tidak melihat respons satu sama lain (sesuai desain)
3. **Urutan pesan:** Respons paralel dapat tiba dalam urutan apa pun
4. **Batas laju:** Semua agent dihitung terhadap batas laju WhatsApp

## Peningkatan di Masa Depan

Fitur yang direncanakan:

- [ ] Mode konteks bersama (agent melihat respons satu sama lain)
- [ ] Koordinasi agent (agent dapat saling memberi sinyal)
- [ ] Pemilihan agent dinamis (pilih agent berdasarkan isi pesan)
- [ ] Prioritas agent (beberapa agent merespons sebelum yang lain)

## Lihat Juga

- [Konfigurasi Multi-Agent](/tools/multi-agent-sandbox-tools)
- [Konfigurasi Routing](/channels/channel-routing)
- [Manajemen Sesi](/concepts/session)
