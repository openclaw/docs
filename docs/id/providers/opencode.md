---
read_when:
    - Anda ingin akses model yang di-host oleh OpenCode
    - Anda ingin memilih antara katalog Zen dan Go
summary: Gunakan katalog OpenCode Zen dan Go dengan OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T14:03:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode mengekspos dua katalog yang di-host di OpenClaw:

- `opencode/...` untuk katalog **Zen**
- `opencode-go/...` untuk katalog **Go**

Kedua katalog menggunakan API key OpenCode yang sama. OpenClaw memisahkan id provider runtime
agar perutean per model di hulu tetap benar, tetapi onboarding dan dokumentasi memperlakukannya
sebagai satu setup OpenCode.

## Setup CLI

### Katalog Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Katalog Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Cuplikan konfigurasi

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Katalog

### Zen

- Provider runtime: `opencode`
- Contoh model: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Paling cocok saat Anda menginginkan proxy multi-model OpenCode yang telah dikurasi

### Go

- Provider runtime: `opencode-go`
- Contoh model: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Paling cocok saat Anda menginginkan jajaran Kimi/GLM/MiniMax yang di-host OpenCode

## Catatan

- `OPENCODE_ZEN_API_KEY` juga didukung.
- Memasukkan satu key OpenCode selama setup menyimpan kredensial untuk kedua provider runtime.
- Anda login ke OpenCode, menambahkan detail penagihan, lalu menyalin API key Anda.
- Penagihan dan ketersediaan katalog dikelola dari dashboard OpenCode.
- Ref OpenCode berbasis Gemini tetap berada di jalur proxy-Gemini, sehingga OpenClaw mempertahankan
  sanitasi thought-signature Gemini di sana tanpa mengaktifkan validasi replay Gemini native
  atau penulisan ulang bootstrap.
- Ref OpenCode non-Gemini mempertahankan kebijakan replay minimal yang kompatibel dengan OpenAI.
