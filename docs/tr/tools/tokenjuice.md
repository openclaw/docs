---
read_when:
    - OpenClaw'da daha kısa `exec` veya `bash` araç sonuçları istiyorsunuz
    - Tokenjuice pluginini yüklemek veya etkinleştirmek istiyorsunuz
    - tokenjuice'ın neleri değiştirdiğini ve neleri ham hâliyle bıraktığını anlamanız gerekir
summary: İsteğe bağlı Tokenjuice Plugin'i ile ayrıntılı exec ve bash aracı sonuçlarını kompaktlaştırın
title: Tokenjuice
x-i18n:
    generated_at: "2026-07-12T12:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96b110563a2600429dd9f0d38997cf7cc5ae4952b7f146a6ab64c96f2f202440
    source_path: tools/tokenjuice.md
    workflow: 16
---

`tokenjuice`, komut zaten çalıştırıldıktan sonra gürültülü `exec` ve `bash`
araç sonuçlarını sıkıştıran isteğe bağlı bir harici Plugin'dir.

Komutun kendisini değil, döndürülen `tool_result` değerini değiştirir. Tokenjuice
kabuk girdisini yeniden yazmaz, komutları yeniden çalıştırmaz veya çıkış kodlarını değiştirmez.

Bu, şu anda OpenClaw gömülü çalıştırmalarına ve Codex app-server test düzenindeki
OpenClaw dinamik araçlarına uygulanır. Tokenjuice, OpenClaw'ın araç sonucu ara yazılımına
bağlanır ve çıktıyı etkin test düzeni oturumuna geri dönmeden önce kırpar.

## Plugin'i etkinleştirme

Bir kez yükleyin:

```bash
openclaw plugins install clawhub:@openclaw/tokenjuice
```

Ardından etkinleştirin:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Eşdeğer komut:

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

## Tokenjuice neleri değiştirir?

- Gürültülü `exec` ve `bash` sonuçlarını oturuma geri beslenmeden önce sıkıştırır.
- Özgün komut yürütmesini değiştirmez.
- Güvenli envanter ilkesi uygular: tam dosya içeriği okumaları ham kalır, bağımsız depo envanteri komutları sıkıştırılabilir ve güvenli olmayan karma komut dizileri ham kalır.
- İsteğe bağlı olarak kalır: her yerde çıktının birebir olmasını istiyorsanız Plugin'i devre dışı bırakın.

## Çalıştığını doğrulama

1. Plugin'i etkinleştirin.
2. `exec` çağırabilen bir oturum başlatın.
3. `git status` gibi gürültülü bir komut çalıştırın.
4. Döndürülen araç sonucunun ham kabuk çıktısından daha kısa ve daha yapılandırılmış olduğunu doğrulayın.

## Plugin'i devre dışı bırakma

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Veya:

```bash
openclaw plugins disable tokenjuice
```

## İlgili konular

- [Exec aracı](/tr/tools/exec)
- [Düşünme düzeyleri](/tr/tools/thinking)
- [Bağlam motoru](/tr/concepts/context-engine)
