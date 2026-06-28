---
read_when:
    - codex-supervisor Plugin’ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Codex app-server oturumlarını OpenClaw'dan denetleyin.
title: Codex Supervisor Plugin
x-i18n:
    generated_at: "2026-06-28T00:58:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor Plugin

OpenClaw'dan Codex app-server oturumlarını denetleyin.

## Dağıtım

- Paket: `@openclaw/codex-supervisor`
- Kurulum yolu: OpenClaw'a dahil

## Yüzey

sözleşmeler: araçlar

<!-- openclaw-plugin-reference:manual-start -->

## Oturum Listeleme

`codex_sessions_list` varsayılan olarak yalnızca yüklenmiş Codex oturumlarını listeler. Saklanan geçmişi dahil etmek için `include_stored` değerini ayarlayın; Plugin, Codex app-server'ın yalnızca durum DB'si listeleme yolunu kullanır ve saklanan sonuçları varsayılan olarak 200 ile sınırlar. Bu sınırı 1000'e kadar düşürmek veya yükseltmek için `max_stored_sessions` iletin.

<!-- openclaw-plugin-reference:manual-end -->
