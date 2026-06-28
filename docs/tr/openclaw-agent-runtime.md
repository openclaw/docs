---
read_when:
    - OpenClaw agent çalışma zamanı kodu veya testleri üzerinde çalışma
    - agent-runtime lint, typecheck ve canlı test akışlarını çalıştırma
summary: 'OpenClaw ajan çalışma zamanı için geliştirici iş akışı: derleme, test etme ve canlı doğrulama'
title: OpenClaw ajan çalışma zamanı iş akışı
x-i18n:
    generated_at: "2026-06-28T00:47:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw içinde OpenClaw ajan çalışma zamanı üzerinde çalışmak için makul bir iş akışı.

## Tür denetimi ve linting

- Varsayılan yerel gate: `pnpm check`
- Derleme gate'i: Değişiklik derleme çıktısını, paketlemeyi veya lazy-loading/modül sınırlarını etkileyebildiğinde `pnpm build`
- Ajan çalışma zamanı değişiklikleri için tam landing gate'i: `pnpm check && pnpm test`

## Ajan Çalışma Zamanı Testlerini Çalıştırma

Ajan çalışma zamanı test kümesini doğrudan Vitest ile çalıştırın:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

Canlı sağlayıcı alıştırmasını dahil etmek için:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

Bu, ana ajan çalışma zamanı birim test paketlerini kapsar:

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## Manuel test

Önerilen akış:

- Gateway'i geliştirme modunda çalıştırın:
  - `pnpm gateway:dev`
- Ajanı doğrudan tetikleyin:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Etkileşimli hata ayıklama için TUI'yi kullanın:
  - `pnpm tui`

Araç çağrısı davranışı için, araç akışını ve yük işleme sürecini görebilmek üzere bir `read` veya `exec` eylemi isteyin.

## Temiz başlangıç sıfırlaması

Durum, OpenClaw durum dizini altında bulunur. Varsayılan değer `~/.openclaw` şeklindedir. `OPENCLAW_STATE_DIR` ayarlanmışsa bunun yerine o dizini kullanın.

Her şeyi sıfırlamak için:

- Yapılandırma için `openclaw.json`
- Model kimlik doğrulama profilleri için `agents/<agentId>/agent/auth-profiles.json` (API anahtarları + OAuth)
- Hâlâ kimlik doğrulama profili deposunun dışında bulunan sağlayıcı/kanal durumu için `credentials/`
- Ajan oturum geçmişi için `agents/<agentId>/sessions/`
- Oturum dizini için `agents/<agentId>/sessions/sessions.json`
- Eski yollar varsa `sessions/`
- Boş bir çalışma alanı istiyorsanız `workspace/`

Yalnızca oturumları sıfırlamak istiyorsanız, o ajan için `agents/<agentId>/sessions/` dizinini silin. Kimlik doğrulamayı korumak istiyorsanız, `agents/<agentId>/agent/auth-profiles.json` dosyasını ve `credentials/` altındaki tüm sağlayıcı durumunu yerinde bırakın.

## Başvurular

- [Test Etme](/tr/help/testing)
- [Başlarken](/tr/start/getting-started)

## İlgili

- [OpenClaw ajan çalışma zamanı mimarisi](/tr/agent-runtime-architecture)
