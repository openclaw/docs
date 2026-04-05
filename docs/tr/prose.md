---
read_when:
    - '`.prose` iş akışlarını çalıştırmak veya yazmak istiyorsunuz'
    - OpenProse eklentisini etkinleştirmek istiyorsunuz
    - Durum depolamayı anlamanız gerekiyor
summary: 'OpenProse: OpenClaw içinde `.prose` iş akışları, slash komutları ve durum'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T14:03:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse, AI oturumlarını orkestre etmek için taşınabilir, önce markdown yaklaşımını benimseyen bir iş akışı biçimidir. OpenClaw içinde, OpenProse skill paketini ve `/prose` slash komutunu kuran bir eklenti olarak gelir. Programlar `.prose` dosyalarında bulunur ve açık denetim akışıyla birden fazla alt ajan başlatabilir.

Resmi site: [https://www.prose.md](https://www.prose.md)

## Neler yapabilir

- Açık paralellik ile çok ajanlı araştırma + sentez.
- Tekrarlanabilir, onay açısından güvenli iş akışları (kod inceleme, olay triyajı, içerik süreçleri).
- Desteklenen ajan çalışma zamanları arasında çalıştırabileceğiniz yeniden kullanılabilir `.prose` programları.

## Kurulum + etkinleştirme

Paketle gelen eklentiler varsayılan olarak devre dışıdır. OpenProse'u etkinleştirin:

```bash
openclaw plugins enable open-prose
```

Eklentiyi etkinleştirdikten sonra Gateway'i yeniden başlatın.

Geliştirme/yerel checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

İlgili belgeler: [Plugins](/tools/plugin), [Plugin manifestosu](/plugins/manifest), [Skills](/tools/skills).

## Slash komutu

OpenProse, kullanıcı tarafından çağrılabilen bir skill komutu olarak `/prose` kaydeder. OpenProse VM yönergelerine yönlenir ve arka planda OpenClaw araçlarını kullanır.

Yaygın komutlar:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Örnek: basit bir `.prose` dosyası

```prose
# Paralel çalışan iki ajanla araştırma + sentez.

input topic: "Neyi araştırmalıyız?"

agent researcher:
  model: sonnet
  prompt: "Kapsamlı araştır ve kaynak göster."

agent writer:
  model: opus
  prompt: "Kısa ve öz bir özet yaz."

parallel:
  findings = session: researcher
    prompt: "{topic} konusunu araştır."
  draft = session: writer
    prompt: "{topic} konusunu özetle."

session "Bulguları + taslağı son yanıtta birleştir."
context: { findings, draft }
```

## Dosya konumları

OpenProse, çalışma alanınızda `.prose/` altında durum tutar:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Kullanıcı düzeyinde kalıcı ajanlar şurada bulunur:

```
~/.prose/agents/
```

## Durum modları

OpenProse birden çok durum arka ucunu destekler:

- **filesystem** (varsayılan): `.prose/runs/...`
- **in-context**: küçük programlar için geçici
- **sqlite** (deneysel): `sqlite3` ikili dosyası gerektirir
- **postgres** (deneysel): `psql` ve bir bağlantı dizesi gerektirir

Notlar:

- sqlite/postgres isteğe bağlıdır ve deneyseldir.
- postgres kimlik bilgileri alt ajan günlüklerine akar; özel, en az ayrıcalıklı bir veritabanı kullanın.

## Uzak programlar

`/prose run <handle/slug>`, `https://p.prose.md/<handle>/<slug>` adresine çözümlenir.
Doğrudan URL'ler olduğu gibi getirilir. Bu işlem `web_fetch` aracıyla (veya POST için `exec` ile) yapılır.

## OpenClaw çalışma zamanı eşlemesi

OpenProse programları OpenClaw ilkel bileşenlerine eşlenir:

| OpenProse kavramı         | OpenClaw aracı |
| ------------------------- | -------------- |
| Oturum başlatma / Task aracı | `sessions_spawn` |
| Dosya okuma/yazma         | `read` / `write` |
| Web getirme               | `web_fetch`    |

Araç allowlist'iniz bu araçları engelliyorsa, OpenProse programları başarısız olur. Bkz. [Skills config](/tools/skills-config).

## Güvenlik + onaylar

`.prose` dosyalarını kod gibi değerlendirin. Çalıştırmadan önce gözden geçirin. Yan etkileri denetlemek için OpenClaw araç allowlist'lerini ve onay geçitlerini kullanın.

Deterministik, onay geçitli iş akışları için [Lobster](/tools/lobster) ile karşılaştırın.
