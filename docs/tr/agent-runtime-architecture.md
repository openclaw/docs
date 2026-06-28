---
summary: OpenClaw'ın yerleşik ajan çalışma zamanını, sağlayıcıları, oturumları, araçları ve uzantıları nasıl çalıştırdığı.
title: Ajan çalışma zamanı mimarisi
x-i18n:
    generated_at: "2026-06-28T00:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw, yerleşik agent çalışma zamanını doğrudan sahiplenir. Çalışma zamanı kodu `src/agents/` altında, model/sağlayıcı yardımcıları `src/llm/` altında bulunur ve Plugin’e dönük sözleşmeler `openclaw/plugin-sdk/*` barrel’ları üzerinden sunulur.

## Çalışma Zamanı Yerleşimi

- `src/agents/embedded-agent-runner/`: yerleşik agent deneme döngüsü, sağlayıcı akış bağdaştırıcıları, compaction, model seçimi ve oturum bağlantıları.
- `src/agents/sessions/`: oturum kalıcılığı, uzantı yükleme, kaynak keşfi, skills, istemler, temalar ve TUI destekli araç işleyicileri.
- `packages/agent-core/`: yeniden kullanılabilir agent çekirdeği, alt düzey harness türleri, iletiler, compaction yardımcıları, istem şablonları ve araç/oturum sözleşmeleri.
- `src/agents/runtime/`: `@openclaw/agent-core` için OpenClaw facade’ı ve yerel proxy yardımcı programları.
- `src/agents/agent-tools*.ts`: OpenClaw’ın sahip olduğu araç tanımları, şemalar, ilke, öncesi/sonrası hook bağdaştırıcıları ve ana makine düzenleme desteği.
- `src/agents/agent-hooks/`: compaction korumaları ve bağlam budama gibi yerleşik çalışma zamanı hook’ları.
- `src/llm/`: model/sağlayıcı kayıt defteri, taşıma yardımcıları ve sağlayıcıya özgü akış uygulamaları.

## Sınırlar

Çekirdek kod, yerleşik çalışma zamanını eski harici agent paketleri üzerinden değil, OpenClaw modülleri ve SDK barrel’ları üzerinden çağırır. Plugin’ler belgelenmiş `openclaw/plugin-sdk/*` giriş noktalarını kullanır ve `src/**` iç bileşenlerini içe aktarmaz.

`@earendil-works/pi-tui`, üçüncü taraf bir TUI bağımlılığı olarak kalır. Yerel TUI ve oturum işleyicileri tarafından bir terminal bileşen araç takımı olarak kullanılır; bunu içselleştirmek ayrı bir vendoring çalışması olurdu.

## Manifestler

Kaynak paketleri, paket meta verilerinde OpenClaw kaynaklarını bildirir:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Paket yöneticisi ayrıca geleneksel `extensions/`, `skills/`, `prompts/` ve `themes/` dizinlerini de keşfeder.

## Çalışma Zamanı Seçimi

Varsayılan yerleşik çalışma zamanı kimliği `openclaw`’dır. Plugin harness’ları ek çalışma zamanı kimlikleri kaydedebilir. `auto`, varsa destekleyen bir Plugin harness’ını seçer; aksi halde yerleşik OpenClaw çalışma zamanını kullanır.

## İlgili

- [OpenClaw agent çalışma zamanı iş akışı](/tr/openclaw-agent-runtime)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
