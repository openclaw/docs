---
read_when:
    - Yalnızca Node'a özgü geliştirme betikleri veya izleme modu hatalarında hata ayıklama
    - OpenClaw'da tsx/esbuild yükleyici çökmelerini araştırma
summary: Node + tsx "__name is not a function" çökme notları ve geçici çözümler
title: Node + tsx çökmesi
x-i18n:
    generated_at: "2026-05-06T17:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx "\_\_name is not a function" çökmesi

## Özet

OpenClaw’ı Node üzerinden `tsx` ile çalıştırmak başlangıçta şu hatayla başarısız oluyor:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Bu, geliştirme betikleri Bun’dan `tsx`’e geçirildikten sonra başladı (commit `2871657e`, 2026-01-06). Aynı çalışma zamanı yolu Bun ile çalışıyordu.

## Ortam

- Node: v25.x (v25.3.0 üzerinde gözlendi)
- tsx: 4.21.0
- OS: macOS (yeniden üretim Node 25 çalıştıran diğer platformlarda da olası)

## Yeniden üretim (yalnızca Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Repoda minimal yeniden üretim

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node sürümü kontrolü

- Node 25.3.0: başarısız
- Node 22.22.0 (Homebrew `node@22`): başarısız
- Node 24: burada henüz yüklü değil; doğrulama gerekiyor

## Notlar / hipotez

- `tsx`, TS/ESM dönüştürmek için esbuild kullanır. esbuild’in `keepNames` seçeneği bir `__name` yardımcısı üretir ve işlev tanımlarını `__name(...)` ile sarar.
- Çökme, `__name` değerinin var olduğunu ancak çalışma zamanında bir işlev olmadığını gösteriyor; bu da yardımcının Node 25 yükleyici yolunda bu modül için eksik olduğu veya üzerine yazıldığı anlamına gelir.
- Benzer `__name` yardımcısı sorunları, yardımcının eksik olduğu veya yeniden yazıldığı durumlarda diğer esbuild tüketicilerinde bildirilmiştir.

## Regresyon geçmişi

- `2871657e` (2026-01-06): Bun’ı isteğe bağlı hale getirmek için betikler Bun’dan tsx’e geçirildi.
- Bundan önce (Bun yolu), `openclaw status` ve `gateway:watch` çalışıyordu.

## Geçici çözümler

- Geliştirme betikleri için Bun kullanın (mevcut geçici geri alma).
- Repo tür denetimi için `tsgo` kullanın, ardından oluşturulan çıktıyı çalıştırın:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Tarihsel not: Bu Node/tsx sorunu hata ayıklanırken burada `tsc` kullanılmıştı, ancak repo tür denetimi hatları artık `tsgo` kullanıyor.
- Mümkünse TS yükleyicisinde esbuild keepNames seçeneğini devre dışı bırakın (`__name` yardımcısının eklenmesini önler); tsx şu anda bunu dışa açmıyor.
- Sorunun Node 25’e özgü olup olmadığını görmek için Node LTS (22/24) sürümlerini `tsx` ile test edin.

## Referanslar

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Sonraki adımlar

- Node 25 regresyonunu doğrulamak için Node 22/24 üzerinde yeniden üretin.
- Bilinen bir regresyon varsa `tsx` nightly sürümünü test edin veya daha eski bir sürüme sabitleyin.
- Node LTS üzerinde yeniden üretilirse, `__name` yığın izlemesiyle birlikte üst projeye minimal bir yeniden üretim bildirin.

## İlgili

- [Node.js kurulumu](/tr/install/node)
- [Gateway sorun giderme](/tr/gateway/troubleshooting)
