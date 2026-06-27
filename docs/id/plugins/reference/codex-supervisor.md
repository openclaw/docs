---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit plugin codex-supervisor
summary: Awasi sesi app-server Codex dari OpenClaw.
title: Plugin Codex Supervisor
x-i18n:
    generated_at: "2026-06-27T17:52:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Plugin Codex Supervisor

Awasi sesi app-server Codex dari OpenClaw.

## Distribusi

- Paket: `@openclaw/codex-supervisor`
- Rute instalasi: disertakan dalam OpenClaw

## Permukaan

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## Daftar Sesi

`codex_sessions_list` secara default hanya menampilkan sesi Codex yang dimuat. Atur `include_stored` untuk menyertakan riwayat tersimpan; Plugin menggunakan jalur daftar khusus state-DB dari app-server Codex dan membatasi hasil tersimpan hingga 200 secara default. Berikan `max_stored_sessions` untuk menurunkan atau menaikkan batas tersebut, hingga 1000.

<!-- openclaw-plugin-reference:manual-end -->
