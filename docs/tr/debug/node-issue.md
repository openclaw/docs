---
read_when:
    - Yalnızca Node kullanan geliştirme betiklerini veya izleme modu hatalarını hata ayıklıyorsunuz
    - OpenClaw içindeki tsx/esbuild loader çökmelerini inceliyorsunuz
summary: Node + tsx "__name is not a function" çökmesiyle ilgili notlar ve geçici çözümler
title: Node + tsx Çökmesi
x-i18n:
    generated_at: "2026-04-05T13:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx "\_\_name is not a function" çökmesi

## Özet

OpenClaw'ı Node ile `tsx` kullanarak çalıştırmak başlangıçta şu hatayla başarısız oluyor:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Bu durum, geliştirme betikleri Bun'dan `tsx`'e geçirildikten sonra başladı (commit `2871657e`, 2026-01-06). Aynı çalışma zamanı yolu Bun ile çalışıyordu.

## Ortam

- Node: v25.x (v25.3.0 üzerinde gözlemlendi)
- tsx: 4.21.0
- İşletim sistemi: macOS (yeniden üretimin Node 25 çalıştıran diğer platformlarda da olması muhtemel)

## Yeniden üretim (yalnızca Node)

```bash
# depo kökünde
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Depo içindeki minimal yeniden üretim

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node sürümü denetimi

- Node 25.3.0: başarısız
- Node 22.22.0 (Homebrew `node@22`): başarısız
- Node 24: burada henüz yüklü değil; doğrulama gerekiyor

## Notlar / hipotez

- `tsx`, TS/ESM dönüştürmek için esbuild kullanır. esbuild’ün `keepNames` seçeneği bir `__name` yardımcı işlevi üretir ve işlev tanımlarını `__name(...)` ile sarar.
- Çökme, `__name` değerinin mevcut olduğunu ancak çalışma zamanında bir işlev olmadığını gösteriyor; bu da yardımcı işlevin eksik olduğunu veya bu modül için Node 25 loader yolunda üzerine yazıldığını düşündürür.
- Benzer `__name` yardımcı işlev sorunları, yardımcı işlev eksik olduğunda veya yeniden yazıldığında diğer esbuild kullanıcılarında da bildirilmiştir.

## Regresyon geçmişi

- `2871657e` (2026-01-06): Bun'u isteğe bağlı yapmak için betikler Bun'dan tsx'e geçirildi.
- Ondan önce (Bun yolu), `openclaw status` ve `gateway:watch` çalışıyordu.

## Geçici çözümler

- Geliştirme betikleri için Bun kullanın (mevcut geçici geri dönüş).
- Node + tsc watch kullanın, ardından derlenmiş çıktıyı çalıştırın:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Yerelde doğrulandı: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status`, Node 25 üzerinde çalışıyor.
- Mümkünse TS loader içinde esbuild `keepNames` seçeneğini devre dışı bırakın (`__name` yardımcı işlev eklemesini önler); tsx bunu şu anda dışa açmıyor.
- Sorunun Node 25'e özgü olup olmadığını görmek için `tsx` ile Node LTS (22/24) sürümlerini test edin.

## Kaynaklar

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Sonraki adımlar

- Node 25 regresyonunu doğrulamak için Node 22/24 üzerinde yeniden üretin.
- Bilinen bir regresyon varsa `tsx` nightly sürümünü test edin veya daha eski bir sürüme sabitleyin.
- Node LTS üzerinde de yeniden üretiliyorsa, `__name` yığın iziyle birlikte upstream'e minimal bir yeniden üretim bildirin.
