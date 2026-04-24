---
read_when:
    - OpenClaw'ta daha kısa `exec` veya `bash` araç sonuçları istiyorsunuz
    - Paketlenmiş tokenjuice Plugin'ini etkinleştirmek istiyorsunuz
    - Tokenjuice'un neyi değiştirdiğini ve neyi ham bıraktığını anlamanız gerekiyor
summary: İsteğe bağlı paketlenmiş bir Plugin ile gürültülü exec ve bash araç sonuçlarını sıkıştırma
title: İsteğe bağlı paketlenmiş bir Plugin ile gürültülü exec ve bash araç sonuçlarını sıkıştırma
x-i18n:
    generated_at: "2026-04-24T09:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice`, komut zaten çalıştıktan sonra gürültülü `exec` ve `bash`
araç sonuçlarını sıkıştıran isteğe bağlı paketlenmiş bir Plugin'dir.

Komutun kendisini değil, döndürülen `tool_result` değerini değiştirir. Tokenjuice
shell girdisini yeniden yazmaz, komutları yeniden çalıştırmaz veya çıkış kodlarını değiştirmez.

Bugün bu, Pi gömülü çalıştırmalarına uygulanır; tokenjuice burada gömülü
`tool_result` yoluna kanca olur ve oturuma geri dönen çıktıyı kırpar.

## Plugin'i etkinleştirin

Hızlı yol:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Eşdeğeri:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw Plugin'i zaten paketlenmiş olarak getirir. Ayrı bir `plugins install`
veya `tokenjuice install openclaw` adımı yoktur.

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

## Tokenjuice neyi değiştirir

- Gürültülü `exec` ve `bash` sonuçlarını oturuma geri beslenmeden önce sıkıştırır.
- Asıl komut yürütmesini dokunmadan bırakır.
- Tam dosya içeriği okumalarını ve tokenjuice'un ham bırakması gereken diğer komutları korur.
- İsteğe bağlıdır: her yerde birebir çıktı istiyorsanız Plugin'i devre dışı bırakın.

## Çalıştığını doğrulayın

1. Plugin'i etkinleştirin.
2. `exec` çağırabilen bir oturum başlatın.
3. `git status` gibi gürültülü bir komut çalıştırın.
4. Dönen araç sonucunun ham shell çıktısından daha kısa ve daha yapılandırılmış olduğunu denetleyin.

## Plugin'i devre dışı bırakın

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Veya:

```bash
openclaw plugins disable tokenjuice
```

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Thinking düzeyleri](/tr/tools/thinking)
- [Bağlam motoru](/tr/concepts/context-engine)
