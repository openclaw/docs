---
read_when:
    - OpenClaw'da daha kısa `exec` veya `bash` araç sonuçları istiyorsunuz
    - Tokenjuice Plugin'ini yüklemek veya etkinleştirmek istiyorsunuz
    - tokenjuice'ın neyi değiştirdiğini ve neyi ham bıraktığını anlamanız gerekir
summary: Gürültülü exec ve bash aracı sonuçlarını isteğe bağlı Tokenjuice Plugin ile sıkıştırın
title: Tokenjuice
x-i18n:
    generated_at: "2026-06-28T01:26:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 183ab08d2a1150b446245514423b893cff9a85581980c15600cc16aec10eeae7
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice`, komut zaten çalıştıktan sonra gürültülü `exec` ve `bash`
araç sonuçlarını sıkıştıran isteğe bağlı harici bir Plugin'dir.

Komutun kendisini değil, döndürülen `tool_result` değerini değiştirir. Tokenjuice
kabuk girdisini yeniden yazmaz, komutları yeniden çalıştırmaz veya çıkış kodlarını değiştirmez.

Bugün bu, OpenClaw gömülü çalıştırmaları ve Codex app-server harness içindeki OpenClaw dinamik araçları için geçerlidir. Tokenjuice, OpenClaw'ın araç sonucu ara katmanına bağlanır ve çıktıyı etkin harness oturumuna geri dönmeden önce kırpar.

## Plugin'i etkinleştirme

Bir kez kurun:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Ardından etkinleştirin:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Eşdeğeri:

```bash
openclaw plugins enable tokenjuice
```

Yapılandırmayı doğrudan düzenlemeyi tercih ederseniz:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice neleri değiştirir

- Gürültülü `exec` ve `bash` sonuçlarını oturuma geri beslenmeden önce sıkıştırır.
- Özgün komut çalıştırmasını değiştirmeden korur.
- Tam dosya içeriği okumalarını ve tokenjuice'in ham bırakması gereken diğer komutları korur.
- İsteğe bağlı kalır: her yerde birebir çıktı istiyorsanız Plugin'i devre dışı bırakın.

## Çalıştığını doğrulama

1. Plugin'i etkinleştirin.
2. `exec` çağırabilen bir oturum başlatın.
3. `git status` gibi gürültülü bir komut çalıştırın.
4. Döndürülen araç sonucunun ham kabuk çıktısından daha kısa ve daha yapılandırılmış olduğunu kontrol edin.

## Plugin'i devre dışı bırakma

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Veya:

```bash
openclaw plugins disable tokenjuice
```

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Düşünme düzeyleri](/tr/tools/thinking)
- [Bağlam motoru](/tr/concepts/context-engine)
