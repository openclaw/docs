---
read_when:
    - Yalnızca Node kullanan geliştirme betiklerinde veya izleme modu hatalarında hata ayıklama
    - OpenClaw'da tsx/esbuild yükleyici çökmelerini araştırma
summary: Node + tsx `"__name bir işlev değil"` çökme notları ve geçici çözümler
title: Node + tsx Çökmesi
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx "`__name bir işlev değil`" çökmesi

## Özet

OpenClaw'ı Node üzerinden `tsx` ile çalıştırmak başlangıçta şu hatayla başarısız oluyor:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Bu durum, geliştirme betiklerinin Bun'dan `tsx`'e geçirilmesinden sonra başladı (commit `2871657e`, 2026-01-06). Aynı çalışma zamanı yolu Bun ile çalışıyordu.

## Ortam

- Node: v25.x (v25.3.0 üzerinde gözlemlendi)
- tsx: 4.21.0
- İşletim sistemi: macOS (Node 25 çalıştırabilen diğer platformlarda da büyük olasılıkla yeniden üretilebilir)

## Yeniden üretme (yalnızca Node)

```bash
# depo kök dizininde
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Depo içindeki minimal yeniden üretim

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node sürümü kontrolü

- Node 25.3.0: başarısız
- Node 22.22.0 (Homebrew `node@22`): başarısız
- Node 24: burada henüz kurulu değil; doğrulanması gerekiyor

## Notlar / hipotez

- `tsx`, TS/ESM dönüşümü için esbuild kullanır. esbuild'ün `keepNames` seçeneği bir `__name` yardımcı işlevi üretir ve işlev tanımlarını `__name(...)` ile sarar.
- Çökme, `__name`'in var olduğunu ancak çalışma zamanında bir işlev olmadığını gösteriyor; bu da Node 25 yükleyici yolunda bu modül için yardımcı işlevin eksik olduğunu veya üzerine yazıldığını düşündürüyor.
- Benzer `__name` yardımcı işlev sorunları, yardımcı işlev eksik olduğunda veya yeniden yazıldığında başka esbuild kullanıcılarında da bildirilmiştir.

## Regresyon geçmişi

- `2871657e` (2026-01-06): Bun'ı isteğe bağlı hale getirmek için betikler Bun'dan tsx'e geçirildi.
- Bundan önce (Bun yolu), `openclaw status` ve `gateway:watch` çalışıyordu.

## Geçici çözümler

- Geliştirme betikleri için Bun kullanın (mevcut geçici geri alma).
- Depo tür denetimi için `tsgo` kullanın, ardından derlenmiş çıktıyı çalıştırın:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Geçmiş not: Bu Node/tsx sorunu hata ayıklanırken burada `tsc` kullanıldı, ancak deponun tür denetimi hatları artık `tsgo` kullanıyor.
- Mümkünse TS yükleyicide esbuild `keepNames` seçeneğini devre dışı bırakın (`__name` yardımcı işlevinin eklenmesini engeller); tsx şu anda bunu açığa çıkarmıyor.
- Sorunun Node 25'e özgü olup olmadığını görmek için Node LTS (22/24) sürümlerini `tsx` ile test edin.

## Referanslar

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Sonraki adımlar

- Node 25 regresyonunu doğrulamak için Node 22/24 üzerinde yeniden üretin.
- Bilinen bir regresyon varsa `tsx` nightly sürümünü test edin veya daha eski bir sürüme sabitleyin.
- Node LTS üzerinde de yeniden üretilebiliyorsa, `__name` yığın iziyle birlikte minimal bir yeniden üretim örneğini upstream'e bildirin.
