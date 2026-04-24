---
read_when:
    - Yalnızca Node ile çalışan geliştirme script'lerini veya izleme modu hatalarını hata ayıklama
    - OpenClaw'da tsx/esbuild yükleyici çökmelerini araştırma
summary: Node + tsx `"__name is not a function"` çökme notları ve geçici çözümler
title: Node + tsx çökmesi
x-i18n:
    generated_at: "2026-04-24T09:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx `__name is not a function` çökmesi

## Özet

OpenClaw'ı Node ile `tsx` üzerinden çalıştırmak başlangıçta şu hatayla başarısız oluyor:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Bu durum, geliştirme script'lerini Bun'dan `tsx`'e geçirdikten sonra başladı (commit `2871657e`, 2026-01-06). Aynı çalışma zamanı yolu Bun ile çalışıyordu.

## Ortam

- Node: v25.x (v25.3.0 üzerinde gözlemlendi)
- tsx: 4.21.0
- OS: macOS (yeniden üretimin Node 25 çalıştıran diğer platformlarda da olması olası)

## Yeniden üretim (yalnızca Node)

```bash
# repo kökünde
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Repo içinde en küçük yeniden üretim

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node sürüm kontrolü

- Node 25.3.0: başarısız
- Node 22.22.0 (Homebrew `node@22`): başarısız
- Node 24: burada henüz kurulu değil; doğrulanması gerekiyor

## Notlar / hipotez

- `tsx`, TS/ESM dönüşümü için esbuild kullanır. esbuild'in `keepNames` seçeneği bir `__name` yardımcı işlevi üretir ve işlev tanımlarını `__name(...)` ile sarar.
- Çökme, çalışma zamanında `__name`'in var olduğunu ama işlev olmadığını gösteriyor; bu da yardımcı işlevin eksik olduğunu veya Node 25 yükleyici yolunda bu modül için üzerine yazıldığını ima eder.
- Benzer `__name` yardımcı işlev sorunları, yardımcı işlev eksik olduğunda veya yeniden yazıldığında diğer esbuild tüketicilerinde de bildirilmiştir.

## Regresyon geçmişi

- `2871657e` (2026-01-06): Bun'ı isteğe bağlı yapmak için script'ler Bun'dan tsx'e değiştirildi.
- Ondan önce (Bun yolu), `openclaw status` ve `gateway:watch` çalışıyordu.

## Geçici çözümler

- Geliştirme script'leri için Bun kullanın (geçerli geçici geri alma).
- Repo type check işlemi için `tsgo` kullanın, sonra derlenmiş çıktıyı çalıştırın:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Tarihsel not: Bu Node/tsx sorununu hata ayıklarken burada `tsc` kullanıldı, ancak repo type check hatları artık `tsgo` kullanıyor.
- Mümkünse TS yükleyicide esbuild `keepNames` seçeneğini devre dışı bırakın (`__name` yardımcı işlev eklemesini önler); tsx bunu şu anda dışa açmıyor.
- Sorunun Node 25'e özgü olup olmadığını görmek için `tsx` ile Node LTS'yi (22/24) test edin.

## Referanslar

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Sonraki adımlar

- Node 25 regresyonunu doğrulamak için Node 22/24 üzerinde yeniden üretin.
- Bilinen bir regresyon varsa `tsx` nightly sürümünü test edin veya daha eski bir sürüme sabitleyin.
- Node LTS üzerinde de yeniden üretiliyorsa, `__name` yığın iziyle birlikte yukarı akışa en küçük yeniden üretimi içeren bir hata bildirimi açın.

## İlgili

- [Node.js kurulumu](/tr/install/node)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
