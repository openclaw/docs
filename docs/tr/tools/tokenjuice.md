---
read_when:
    - OpenClaw'da daha kısa `exec` veya `bash` araç sonuçları istiyorsunuz
    - Paketlenmiş Tokenjuice plugin'ini etkinleştirmek istiyorsunuz
    - Tokenjuice'ın neyi değiştirdiğini ve neyi ham bıraktığını anlamanız gerekiyor
summary: İsteğe bağlı paketlenmiş bir plugin ile gürültülü exec ve bash araç sonuçlarını sıkıştırın
title: Tokenjuice
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T14:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice`, komut zaten çalıştırıldıktan sonra gürültülü `exec` ve `bash`
araç sonuçlarını sıkıştıran isteğe bağlı paketlenmiş bir plugin'dir.

Komutun kendisini değil, döndürülen `tool_result` değerini değiştirir. Tokenjuice
shell girdisini yeniden yazmaz, komutları yeniden çalıştırmaz ve çıkış kodlarını değiştirmez.

Bugün bu, PI gömülü çalıştırmalarına ve Codex
app-server harness içindeki OpenClaw dinamik araçlarına uygulanır. Tokenjuice, OpenClaw'ın
araç sonucu middleware'ine bağlanır ve çıktı etkin harness oturumuna geri gitmeden önce
kırpar.

## Plugin'i etkinleştirin

Hızlı yol:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Eşdeğeri:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw plugin'i zaten paketlenmiş olarak sunar. Ayrı bir `plugins install`
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

## Tokenjuice'ın değiştirdiği şeyler

- Gürültülü `exec` ve `bash` sonuçlarını oturuma geri beslenmeden önce sıkıştırır.
- Özgün komut yürütmesini değiştirmeden bırakır.
- Tam dosya içeriği okumalarını ve Tokenjuice'ın ham bırakması gereken diğer komutları korur.
- İsteğe bağlı kalır: her yerde birebir çıktı istiyorsanız plugin'i devre dışı bırakın.

## Çalıştığını doğrulayın

1. Plugin'i etkinleştirin.
2. `exec` çağırabilen bir oturum başlatın.
3. `git status` gibi gürültülü bir komut çalıştırın.
4. Döndürülen araç sonucunun ham shell çıktısından daha kısa ve daha yapılandırılmış olduğunu kontrol edin.

## Plugin'i devre dışı bırakın

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Veya:

```bash
openclaw plugins disable tokenjuice
```

## İlgili

- [Exec tool](/tr/tools/exec)
- [Thinking levels](/tr/tools/thinking)
- [Context engine](/tr/concepts/context-engine)
