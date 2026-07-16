---
read_when:
    - OpenClaw ajan çalışma zamanı kodu veya testleri üzerinde çalışma
    - Ajan çalışma zamanı lint, tür denetimi ve canlı test akışlarını çalıştırma
summary: 'OpenClaw ajan çalışma zamanı için geliştirici iş akışı: derleme, test ve canlı doğrulama'
title: OpenClaw ajan çalışma zamanı iş akışı
x-i18n:
    generated_at: "2026-07-16T17:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw deposundaki agent çalışma zamanı (`src/agents/`) için geliştirici iş akışı.

## Tür denetimi ve lint işlemi

- Varsayılan yerel geçit: `pnpm check` (tür denetimi, lint, politika korumaları)
- Derleme geçidi: Değişiklik derleme çıktısını, paketlemeyi veya geç yükleme/modül sınırlarını etkileyebiliyorsa `pnpm build`
- Gönderim öncesi tam geçit: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## Agent Çalışma Zamanı Testlerini Çalıştırma

Agent çalışma zamanı birim test paketlerini çalıştırın:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

İlk glob, `agent-tools*`, `agent-settings` ve
`agent-tool-definition-adapter*` test paketlerini de kapsar.

Canlı testler birim yapılandırmasının dışında tutulur; bunları canlı test
sarmalayıcısı üzerinden çalıştırın (`OPENCLAW_LIVE_TEST=1` değerini ayarlar ve sağlayıcı kimlik bilgilerini gerektirir):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## Manuel test

- Gateway'i geliştirme modunda çalıştırın (`OPENCLAW_SKIP_CHANNELS=1` aracılığıyla kanal bağlantılarını atlar): `pnpm gateway:dev`
- Gateway üzerinden tek bir agent turunu tetikleyin: `pnpm openclaw agent --message "Hello" --thinking low`
- Etkileşimli hata ayıklama için TUI'yi kullanın: `pnpm tui`

Araç çağrısı davranışını test etmek için, araç akışını ve yük işleme sürecini
izleyebilmek üzere bir `read` veya `exec` eylemi isteyin.

## Temiz durum sıfırlaması

Durum, OpenClaw durum dizininde bulunur: varsayılan olarak `~/.openclaw`,
ayarlandığında ise `$OPENCLAW_STATE_DIR`. Bu dizine göre yollar:

| Yol                                            | İçerik                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                             | Yapılandırma                                                       |
| `state/openclaw.sqlite`                             | Paylaşılan çalışma zamanı durum veritabanı                         |
| `agents/<agentId>/agent/openclaw-agent.sqlite`                             | Agent başına model kimlik doğrulama profilleri (API anahtarları + OAuth) ve çalışma zamanı durumu |
| `credentials/`                             | Kimlik doğrulama profili deposunun dışındaki sağlayıcı/kanal kimlik bilgileri |
| `agents/<agentId>/sessions/`                             | Transkript geçmişi ve eski oturum geçişi kaynakları                |
| `sessions/`                             | Eski tek agent'lı oturum deposu (yalnızca eski kurulumlar)         |
| `workspace/`                             | Varsayılan agent çalışma alanı (ek agent'lar `workspace-<agentId>` kullanır) |

Tam sıfırlama için bu yolları silin. Daha dar kapsamlı sıfırlamalar:

- Yalnızca oturumlar: `agents/<agentId>/agent/openclaw-agent.sqlite` öğesini silmeyin; oturum satırları, agent başına diğer durum verileriyle birlikte burada bulunur. Bir sohbet için yeni bir oturum başlatmak üzere `/new` veya `/reset`, oturum bakımı için ise `openclaw sessions cleanup` kullanın.
- Kimlik doğrulamayı koruyun: `agents/<agentId>/agent/openclaw-agent.sqlite` ve `credentials/` öğelerini yerinde bırakın.

Eski `auth-profiles.json` dosyaları artık çalışma zamanında okunmaz;
`openclaw doctor --fix` bunları SQLite deposuna aktarır.

## Başvurular

- [Test](/tr/help/testing)
- [Başlarken](/tr/start/getting-started)

## İlgili

- [OpenClaw agent çalışma zamanı mimarisi](/tr/agent-runtime-architecture)
