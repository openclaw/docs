---
read_when:
    - Pi entegrasyon kodu veya testleri üzerinde çalışma
    - Pi'ye özgü lint, tür denetimi ve canlı test akışlarını çalıştırma
summary: 'Pi entegrasyonu için geliştirici iş akışı: derleme, test ve canlı doğrulama'
title: Pi geliştirme iş akışı
x-i18n:
    generated_at: "2026-04-30T09:31:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

OpenClaw içinde Pi entegrasyonu üzerinde çalışmak için sağlıklı bir iş akışı.

## Tür denetimi ve linting

- Varsayılan yerel doğrulama kapısı: `pnpm check`
- Derleme kapısı: Değişiklik derleme çıktısını, paketlemeyi veya lazy-loading/modül sınırlarını etkileyebiliyorsa `pnpm build`
- Pi ağırlıklı değişiklikler için tam landing kapısı: `pnpm check && pnpm test`

## Pi testlerini çalıştırma

Pi odaklı test kümesini doğrudan Vitest ile çalıştırın:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Canlı sağlayıcı denemesini dahil etmek için:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Bu, ana Pi birim test paketlerini kapsar:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Manuel test

Önerilen akış:

- Gateway'i geliştirme modunda çalıştırın:
  - `pnpm gateway:dev`
- Ajanı doğrudan tetikleyin:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Etkileşimli hata ayıklama için TUI'yi kullanın:
  - `pnpm tui`

Araç çağrısı davranışı için, araç akışını ve yük işlemeyi görebilmek üzere bir `read` veya `exec` eylemi isteyin.

## Temiz başlangıç sıfırlaması

Durum, OpenClaw durum dizini altında bulunur. Varsayılan değer `~/.openclaw` dizinidir. `OPENCLAW_STATE_DIR` ayarlanmışsa bunun yerine o dizini kullanın.

Her şeyi sıfırlamak için:

- Yapılandırma için `openclaw.json`
- Model kimlik doğrulama profilleri (API anahtarları + OAuth) için `agents/<agentId>/agent/auth-profiles.json`
- Kimlik doğrulama profili deposunun dışında yaşamaya devam eden sağlayıcı/kanal durumu için `credentials/`
- Ajan oturum geçmişi için `agents/<agentId>/sessions/`
- Oturum dizini için `agents/<agentId>/sessions/sessions.json`
- Eski yollar mevcutsa `sessions/`
- Boş bir çalışma alanı istiyorsanız `workspace/`

Yalnızca oturumları sıfırlamak istiyorsanız, ilgili ajan için `agents/<agentId>/sessions/` dizinini silin. Kimlik doğrulamayı korumak istiyorsanız `agents/<agentId>/agent/auth-profiles.json` dosyasını ve `credentials/` altındaki sağlayıcı durumlarını yerinde bırakın.

## Başvurular

- [Test Etme](/tr/help/testing)
- [Başlarken](/tr/start/getting-started)

## İlgili

- [Pi entegrasyonu mimarisi](/tr/pi)
