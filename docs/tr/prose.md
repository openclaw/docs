---
read_when:
    - '`.prose` iş akışlarını çalıştırmak veya yazmak istiyorsunuz'
    - OpenProse Plugin’ini etkinleştirmek istiyorsunuz
    - Durum depolamayı anlamanız gerekiyor
summary: 'OpenProse: OpenClaw içinde `.prose` iş akışları, eğik çizgi komutları ve durum'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T09:24:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse, AI oturumlarını orkestre etmek için taşınabilir, Markdown öncelikli bir iş akışı biçimidir. OpenClaw içinde, bir OpenProse Skill paketi ve `/prose` eğik çizgi komutu kuran bir Plugin olarak gelir. Programlar `.prose` dosyalarında yaşar ve açık denetim akışıyla birden fazla alt aracı başlatabilir.

Resmi site: [https://www.prose.md](https://www.prose.md)

## Neler yapabilir

- Açık paralellik ile çok aracılı araştırma + sentez.
- Tekrarlanabilir, onay açısından güvenli iş akışları (kod inceleme, olay sınıflandırması, içerik işlem hatları).
- Desteklenen aracı çalışma zamanları arasında çalıştırabileceğiniz yeniden kullanılabilir `.prose` programları.

## Kurma + etkinleştirme

Paketlenmiş Plugin’ler varsayılan olarak devre dışıdır. OpenProse’u etkinleştirin:

```bash
openclaw plugins enable open-prose
```

Plugin’i etkinleştirdikten sonra Gateway’i yeniden başlatın.

Geliştirme/yerel checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

İlgili belgeler: [Plugins](/tr/tools/plugin), [Plugin manifest](/tr/plugins/manifest), [Skills](/tr/tools/skills).

## Eğik çizgi komutu

OpenProse, kullanıcı tarafından çağrılabilen bir Skill komutu olarak `/prose` kaydeder. OpenProse VM talimatlarına yönlenir ve arka planda OpenClaw araçlarını kullanır.

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
# İki aracının paralel çalıştığı araştırma + sentez.

input topic: "Neyi araştırmalıyız?"

agent researcher:
  model: sonnet
  prompt: "Ayrıntılı araştırma yapar ve kaynak gösterirsin."

agent writer:
  model: opus
  prompt: "Kısa ve öz bir özet yazarsın."

parallel:
  findings = session: researcher
    prompt: "{topic} konusunu araştır."
  draft = session: writer
    prompt: "{topic} konusunu özetle."

session "Bulgular + taslağı birleştirerek nihai bir yanıt oluştur."
context: { findings, draft }
```

## Dosya konumları

OpenProse, durumu çalışma alanınızda `.prose/` altında tutar:

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

Kullanıcı düzeyindeki kalıcı aracılar şurada bulunur:

```
~/.prose/agents/
```

## Durum kipleri

OpenProse birden çok durum arka ucunu destekler:

- **filesystem** (varsayılan): `.prose/runs/...`
- **in-context**: küçük programlar için geçici
- **sqlite** (deneysel): `sqlite3` ikili dosyasını gerektirir
- **postgres** (deneysel): `psql` ve bir bağlantı dizesi gerektirir

Notlar:

- sqlite/postgres isteğe bağlıdır ve deneyseldir.
- postgres kimlik bilgileri alt aracı günlüklerine akar; ayrılmış, en az ayrıcalıklı bir DB kullanın.

## Uzak programlar

`/prose run <handle/slug>`, `https://p.prose.md/<handle>/<slug>` adresine çözülür.
Doğrudan URL’ler olduğu gibi getirilir. Bu, `web_fetch` aracını (veya POST için `exec`) kullanır.

## OpenClaw çalışma zamanı eşlemesi

OpenProse programları OpenClaw ilkel yapılarına eşlenir:

| OpenProse kavramı         | OpenClaw aracı |
| ------------------------- | -------------- |
| Oturum başlat / Task aracı | `sessions_spawn` |
| Dosya okuma/yazma         | `read` / `write` |
| Web getirme               | `web_fetch`    |

Araç izin listeniz bu araçları engelliyorsa, OpenProse programları başarısız olur. Bkz. [Skills config](/tr/tools/skills-config).

## Güvenlik + onaylar

`.prose` dosyalarına kod gibi davranın. Çalıştırmadan önce inceleyin. Yan etkileri denetlemek için OpenClaw araç izin listelerini ve onay geçitlerini kullanın.

Belirlenimci, onay geçitli iş akışları için [Lobster](/tr/tools/lobster) ile karşılaştırın.

## İlgili

- [Text-to-speech](/tr/tools/tts)
- [Markdown formatting](/tr/concepts/markdown-formatting)
