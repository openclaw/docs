---
read_when:
    - Pi entegrasyon kodu veya testleri üzerinde çalışılıyor
    - Pi'ye özgü lint, typecheck ve canlı test akışlarını çalıştırma
summary: 'Pi entegrasyonu için geliştirici iş akışı: derleme, test etme ve canlı doğrulama'
title: Pi geliştirme iş akışı
x-i18n:
    generated_at: "2026-04-24T09:18:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Bu kılavuz, OpenClaw içindeki Pi entegrasyonu üzerinde çalışmak için makul bir iş akışını özetler.

## Type Checking ve Linting

- Varsayılan yerel geçit: `pnpm check`
- Derleme çıktısını, paketlemeyi veya lazy-loading/module sınırlarını etkileyebilecek değişikliklerde derleme geçidi: `pnpm build`
- Pi ağırlıklı değişiklikler için tam teslim geçidi: `pnpm check && pnpm test`

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

Canlı sağlayıcı alıştırmasını da dahil etmek için:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Bu, ana Pi unit paketlerini kapsar:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Elle test etme

Önerilen akış:

- Gateway'i geliştirme modunda çalıştırın:
  - `pnpm gateway:dev`
- Agent'i doğrudan tetikleyin:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Etkileşimli hata ayıklama için TUI kullanın:
  - `pnpm tui`

Araç çağırma davranışı için bir `read` veya `exec` eylemi isteyin; böylece araç akışını ve payload işlemeyi görebilirsiniz.

## Temiz başlangıç sıfırlaması

Durum, OpenClaw durum dizini altında yaşar. Varsayılan `~/.openclaw` dizinidir. `OPENCLAW_STATE_DIR` ayarlıysa bunun yerine o dizini kullanın.

Her şeyi sıfırlamak için:

- Yapılandırma için `openclaw.json`
- Model auth profilleri (API anahtarları + OAuth) için `agents/<agentId>/agent/auth-profiles.json`
- Auth profil deposunun dışında yaşamaya devam eden sağlayıcı/kanal durumu için `credentials/`
- Agent oturum geçmişi için `agents/<agentId>/sessions/`
- Oturum dizini için `agents/<agentId>/sessions/sessions.json`
- Eski yollar varsa `sessions/`
- Boş bir çalışma alanı istiyorsanız `workspace/`

Yalnızca oturumları sıfırlamak istiyorsanız o agent için `agents/<agentId>/sessions/` dizinini silin. Auth'u korumak istiyorsanız `agents/<agentId>/agent/auth-profiles.json` dosyasını ve `credentials/` altındaki tüm sağlayıcı durumunu olduğu gibi bırakın.

## Başvurular

- [Testing](/tr/help/testing)
- [Getting Started](/tr/start/getting-started)

## İlgili

- [Pi integration architecture](/tr/pi)
