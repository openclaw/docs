---
read_when:
    - Anda sedang menghubungkan permukaan penggunaan/kuota provider
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan auth
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-04-24T09:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Apa itu

- Menarik penggunaan/kuota provider langsung dari endpoint penggunaan mereka.
- Tidak ada biaya perkiraan; hanya jendela yang dilaporkan provider.
- Output status yang dapat dibaca manusia dinormalkan menjadi `X% left`, bahkan ketika
  API upstream melaporkan kuota yang telah dipakai, kuota tersisa, atau hanya jumlah mentah.
- `/status` tingkat sesi dan `session_status` dapat kembali ke entri penggunaan
  transkrip terbaru ketika snapshot sesi live jarang. Fallback itu
  mengisi penghitung token/cache yang hilang, dapat memulihkan label model runtime
  aktif, dan lebih memilih total berorientasi prompt yang lebih besar ketika metadata sesi
  hilang atau lebih kecil. Nilai live nonzero yang sudah ada tetap diprioritaskan.

## Tempat kemunculannya

- `/status` di chat: kartu status kaya emoji dengan token sesi + perkiraan biaya (hanya API key). Penggunaan provider ditampilkan untuk **provider model saat ini** ketika tersedia sebagai jendela `X% left` yang dinormalkan.
- `/usage off|tokens|full` di chat: footer penggunaan per respons (OAuth hanya menampilkan token).
- `/usage cost` di chat: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak rincian penuh per provider.
- CLI: `openclaw channels list` mencetak snapshot penggunaan yang sama bersama konfigurasi provider (gunakan `--no-usage` untuk melewati).
- Bilah menu macOS: bagian “Usage” di bawah Context (hanya jika tersedia).

## Provider + kredensial

- **Anthropic (Claude)**: token OAuth di auth profile.
- **GitHub Copilot**: token OAuth di auth profile.
- **Gemini CLI**: token OAuth di auth profile.
  - Penggunaan JSON kembali ke `stats`; `stats.cached` dinormalkan menjadi
    `cacheRead`.
- **OpenAI Codex**: token OAuth di auth profile (`accountId` digunakan saat ada).
- **MiniMax**: API key atau auth profile OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax
  yang sama, lebih memilih OAuth MiniMax yang tersimpan jika ada, dan jika tidak akan kembali
  ke `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Field mentah `usage_percent` / `usagePercent` MiniMax berarti kuota yang **tersisa**,
  jadi OpenClaw membalikkannya sebelum ditampilkan; field berbasis hitungan diprioritaskan saat
  ada.
  - Label jendela coding-plan berasal dari field jam/menit provider saat
    ada, lalu kembali ke rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw lebih memilih
    entri model chat, menurunkan label jendela dari timestamp saat field eksplisit
    `window_hours` / `window_minutes` tidak ada, dan menyertakan nama model
    dalam label plan.
- **Xiaomi MiMo**: API key melalui env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: API key melalui env/config/auth store.

Penggunaan disembunyikan ketika tidak ada auth penggunaan provider yang dapat di-resolve. Provider
dapat menyediakan logika auth penggunaan khusus Plugin; jika tidak, OpenClaw kembali
ke pencocokan kredensial OAuth/API-key dari auth profile, env var,
atau konfigurasi.

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Prompt caching](/id/reference/prompt-caching)
