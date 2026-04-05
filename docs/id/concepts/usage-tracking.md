---
read_when:
    - Anda sedang menghubungkan permukaan penggunaan/kuota provider
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan auth
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan Penggunaan
x-i18n:
    generated_at: "2026-04-05T13:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Pelacakan penggunaan

## Apa itu

- Mengambil penggunaan/kuota provider langsung dari endpoint penggunaan mereka.
- Tidak ada estimasi biaya; hanya jendela yang dilaporkan provider.
- Output status yang dapat dibaca manusia dinormalisasi menjadi `X% left`, bahkan saat
  API upstream melaporkan kuota terpakai, kuota tersisa, atau hanya hitungan mentah.
- `/status` tingkat sesi dan `session_status` dapat kembali menggunakan entri penggunaan
  transkrip terbaru saat snapshot sesi langsung jarang terisi. Fallback
  tersebut mengisi penghitung token/cache yang hilang, dapat memulihkan label
  model runtime aktif, dan lebih memilih total yang lebih besar dan berorientasi prompt saat metadata sesi
  hilang atau lebih kecil. Nilai live nonzero yang sudah ada tetap diutamakan.

## Tempat ini muncul

- `/status` dalam chat: kartu status kaya emoji dengan token sesi + estimasi biaya (hanya API key). Penggunaan provider ditampilkan untuk **provider model saat ini** bila tersedia sebagai jendela `X% left` yang dinormalisasi.
- `/usage off|tokens|full` dalam chat: footer penggunaan per respons (OAuth hanya menampilkan token).
- `/usage cost` dalam chat: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak rincian lengkap per provider.
- CLI: `openclaw channels list` mencetak snapshot penggunaan yang sama di samping config provider (gunakan `--no-usage` untuk melewati).
- Bilah menu macOS: bagian “Usage” di bawah Context (hanya jika tersedia).

## Provider + kredensial

- **Anthropic (Claude)**: token OAuth dalam profil auth.
- **GitHub Copilot**: token OAuth dalam profil auth.
- **Gemini CLI**: token OAuth dalam profil auth.
  - Penggunaan JSON kembali ke `stats`; `stats.cached` dinormalisasi menjadi
    `cacheRead`.
- **OpenAI Codex**: token OAuth dalam profil auth (`accountId` digunakan saat tersedia).
- **MiniMax**: API key atau profil auth OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota
  MiniMax yang sama, lebih memilih OAuth MiniMax tersimpan saat tersedia, dan jika tidak akan kembali ke
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Field mentah `usage_percent` / `usagePercent` milik MiniMax berarti kuota
  **tersisa**, jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diutamakan saat
  tersedia.
  - Label jendela coding-plan berasal dari field jam/menit provider saat
    tersedia, lalu kembali ke rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw lebih memilih
    entri chat-model, menurunkan label jendela dari stempel waktu saat field eksplisit
    `window_hours` / `window_minutes` tidak ada, dan menyertakan nama model
    dalam label rencana.
- **Xiaomi MiMo**: API key melalui env/config/penyimpanan auth (`XIAOMI_API_KEY`).
- **z.ai**: API key melalui env/config/penyimpanan auth.

Penggunaan disembunyikan saat tidak ada auth penggunaan provider yang dapat digunakan dan dapat diresolusikan. Provider
dapat menyediakan logika auth penggunaan khusus plugin; jika tidak, OpenClaw akan kembali
ke pencocokan kredensial OAuth/API key dari profil auth, environment variable,
atau config.
