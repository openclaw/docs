---
read_when:
    - Hata ayıklama için OpenClaw taşıma trafiğini yerel olarak yakalamanız gerekiyor
    - Hata ayıklama proxy oturumlarını, blob'ları veya yerleşik sorgu önayarlarını incelemek istiyorsunuz
summary: Yerel hata ayıklama proxy'si ve yakalama denetleyicisi olan `openclaw proxy` için CLI başvurusu
title: Proxy
x-i18n:
    generated_at: "2026-04-24T09:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Yerel açık hata ayıklama proxy'sini çalıştırın ve yakalanan trafiği inceleyin.

Bu, taşıma düzeyi inceleme için bir hata ayıklama komutudur. Yerel bir
proxy başlatabilir, yakalama etkinleştirilmiş bir alt komut çalıştırabilir, yakalama oturumlarını listeleyebilir,
yaygın trafik desenlerini sorgulayabilir, yakalanan blob'ları okuyabilir ve yerel yakalama
verilerini temizleyebilir.

## Komutlar

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Sorgu önayarları

`openclaw proxy query --preset <name>` şu değerleri kabul eder:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notlar

- `start`, `--host` ayarlanmadıkça varsayılan olarak `127.0.0.1` kullanır.
- `run`, yerel bir hata ayıklama proxy'si başlatır ve ardından `--` sonrasındaki komutu çalıştırır.
- Yakalamalar yerel hata ayıklama verileridir; işiniz bittiğinde `openclaw proxy purge` kullanın.

## İlgili

- [CLI reference](/tr/cli)
- [Trusted proxy auth](/tr/gateway/trusted-proxy-auth)
