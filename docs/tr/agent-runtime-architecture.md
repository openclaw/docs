---
summary: 'OpenClaw''un yerleşik ajan çalışma zamanını nasıl yapılandırdığı: kod düzeni, sınırlar, kaynak manifestleri ve çalışma zamanı seçimi.'
title: Ajan çalışma zamanı mimarisi
x-i18n:
    generated_at: "2026-07-16T16:36:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw, yerleşik ajan çalışma zamanının sahibidir. Çalışma zamanı kodu `src/agents/` altında, model/sağlayıcı aktarımı `src/llm/` altında bulunur ve plugin'lere yönelik sözleşmeler `openclaw/plugin-sdk/*` barrel'ları üzerinden sunulur.

## Çalışma Zamanı Düzeni

| Yol                                 | Sorumluluk                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Yerleşik deneme döngüsü (`run.ts`, `run/`), model seçimi ve sağlayıcı normalleştirmesi (`model*.ts`), sağlayıcı başına istek parametreleri (`extra-params.*`), Compaction, transkript ve oturum bağlantıları.                            |
| `src/agents/sessions/`              | Oturum kalıcılığı (`session-manager.ts`), kaynak keşfi (`package-manager.ts`, `resource-loader.ts`), oturum içi `extensions` yükleme, istem şablonları, Skills, temalar ve TUI destekli araç işleyicileri (`tools/`). |
| `packages/agent-core/`              | Yeniden kullanılabilir ajan çekirdeği (`@openclaw/agent-core`): ajan döngüsü, harness türleri, mesajlar, Compaction yardımcıları, istem şablonları, Skills ve oturum depolama sözleşmeleri.                                                           |
| `src/agents/runtime/`               | `@openclaw/agent-core` öğesini plugin SDK LLM çalışma zamanına bağlayan ve yerel proxy yardımcı programlarıyla birlikte yeniden dışa aktaran OpenClaw cephesi.                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw'a ait araç tanımları, parametre şemaları, araç politikası, araç çağrısı öncesi/sonrası adaptörleri ve ana makine/sandbox düzenleme araçları.                                                                                            |
| `src/agents/agent-hooks/`           | Yerleşik çalışma zamanı kancaları: Compaction koruması, Compaction talimatları, bağlam budama.                                                                                                                                   |
| `src/agents/harness/`               | Yerleşik ve plugin tarafından kaydedilen harness'lar için harness kayıt defteri, seçim politikası ve yaşam döngüsü.                                                                                                                       |
| `src/llm/`                          | Model/sağlayıcı kayıt defteri, aktarım yardımcıları ve sağlayıcıya özgü akış uygulamaları (`src/llm/providers/`).                                                                                                          |

## Sınırlar

Çekirdek, yerleşik çalışma zamanını OpenClaw modülleri ve SDK barrel'ları üzerinden çağırır; artık harici ajan çatısı paketleri bulunmaz. Plugin'ler belgelenmiş `openclaw/plugin-sdk/*` giriş noktalarını kullanır ve `src/**` iç bileşenlerini içe aktarmaz.

`@earendil-works/pi-tui` bir üçüncü taraf bağımlılığı olarak kalır: yerel TUI ve oturum aracı işleyicileri tarafından kullanılan bir terminal bileşen araç takımıdır. Bunu içselleştirmek ayrı bir kaynak kodu bünyeye alma çalışması gerektirir.

## Manifestler

Kaynak paketleri, OpenClaw kaynaklarını `package.json` meta verilerinde bildirir. Girdiler, paket köküne göreli dosya yolları veya glob kalıplarıdır:

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

Bir manifestte listelenmeyen kaynak türleri için geleneksel `extensions/`, `skills/`, `prompts/` ve `themes/` dizinlerinin keşfine geri dönülür.

## Çalışma Zamanı Seçimi

- Yerleşik çalışma zamanı kimliği `openclaw` şeklindedir. Eski `pi` diğer adı `openclaw` olarak; `codex-app-server` ise `codex` olarak normalleştirilir.
- Plugin harness'ları ek çalışma zamanı kimlikleri kaydeder (örneğin `codex`).
- Çalışma zamanı politikası, model/sağlayıcı kapsamındaki `agentRuntime.id` yapılandırmasıdır (model girdisi sağlayıcı girdisine üstün gelir). Ayarlanmamış değer veya `default`, `auto` olarak çözümlenir.
- `auto`, etkin sağlayıcı rotasını destekleyen kayıtlı bir plugin harness'ını; böyle bir harness yoksa yerleşik OpenClaw çalışma zamanını seçer. Sağlayıcı veya model öneki tek başına hiçbir zaman harness seçmez.
- OpenAI, yalnızca yazılmış bir istek geçersiz kılması bulunmayan ve resmi HTTPS Platform Responses veya ChatGPT Responses rotasıyla tam olarak eşleşen durumlarda `codex` öğesini örtük biçimde seçebilir. Completions adaptörleri, özel uç noktalar ve yazılmış istek davranışı içeren rotalar `openclaw` üzerinde kalır; düz metin kullanan resmi HTTP uç noktaları reddedilir. Bkz. [OpenAI örtük ajan çalışma zamanı](/tr/providers/openai#implicit-agent-runtime).

## İlgili

- [OpenClaw ajan çalışma zamanı iş akışı](/tr/openclaw-agent-runtime)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
