---
read_when:
    - Pi entegrasyon kodu veya testleri üzerinde çalışma
    - Pi'ye özgü lint, typecheck ve live test akışlarını çalıştırma
summary: 'Pi entegrasyonu için geliştirici iş akışı: build, test ve live doğrulama'
title: Pi Geliştirme İş Akışı
x-i18n:
    generated_at: "2026-04-05T13:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Pi Geliştirme İş Akışı

Bu kılavuz, OpenClaw içindeki pi entegrasyonu üzerinde çalışmak için mantıklı bir iş akışını özetler.

## Type Checking ve Linting

- Varsayılan yerel gate: `pnpm check`
- Değişiklik build çıktısını, paketlemeyi veya lazy-loading/module sınırlarını etkileyebiliyorsa build gate: `pnpm build`
- Pi ağırlıklı değişiklikler için tam landing gate: `pnpm check && pnpm test`

## Pi Testlerini Çalıştırma

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

Live sağlayıcı çalıştırmasını da dahil etmek için:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Bu, ana Pi unit suitelerini kapsar:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## El ile test etme

Önerilen akış:

- Gateway'i geliştirme modunda çalıştırın:
  - `pnpm gateway:dev`
- Ajanı doğrudan tetikleyin:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Etkileşimli hata ayıklama için TUI kullanın:
  - `pnpm tui`

Araç çağrısı davranışı için, araç akışını ve payload işlemeyi görebilmeniz amacıyla bir `read` veya `exec` eylemi isteyin.

## Temiz başlangıç sıfırlaması

Durum, OpenClaw durum dizini altında bulunur. Varsayılan `~/.openclaw` dizinidir. `OPENCLAW_STATE_DIR` ayarlıysa onun yerine o dizini kullanın.

Her şeyi sıfırlamak için:

- Yapılandırma için `openclaw.json`
- Model auth profilleri (API anahtarları + OAuth) için `agents/<agentId>/agent/auth-profiles.json`
- Hâlâ auth profil deposu dışında yaşayan sağlayıcı/kanal durumu için `credentials/`
- Ajan oturum geçmişi için `agents/<agentId>/sessions/`
- Oturum dizini için `agents/<agentId>/sessions/sessions.json`
- Eski yollar varsa `sessions/`
- Boş bir çalışma alanı istiyorsanız `workspace/`

Yalnızca oturumları sıfırlamak istiyorsanız, o ajan için `agents/<agentId>/sessions/` dizinini silin. Auth'u korumak istiyorsanız `agents/<agentId>/agent/auth-profiles.json` ve `credentials/` altındaki sağlayıcı durumunu yerinde bırakın.

## Başvurular

- [Testing](/help/testing)
- [Getting Started](/start/getting-started)
