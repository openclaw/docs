---
read_when:
    - Nextcloud Talk kanal özellikleri üzerinde çalışırken
summary: Nextcloud Talk destek durumu, yetenekleri ve yapılandırması
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T13:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Durum: paketlenmiş eklenti (webhook botu). Doğrudan mesajlar, odalar, tepkiler ve Markdown mesajları desteklenir.

## Paketlenmiş eklenti

Nextcloud Talk, mevcut OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya Nextcloud Talk'ı dışlayan özel bir kurulum kullanıyorsanız, manuel olarak yükleyin:

CLI ile yükleyin (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Ayrıntılar: [Plugins](/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Nextcloud Talk eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. Nextcloud sunucunuzda bir bot oluşturun:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Hedef oda ayarlarında botu etkinleştirin.
4. OpenClaw'ı yapılandırın:
   - Yapılandırma: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Veya ortam değişkeni: `NEXTCLOUD_TALK_BOT_SECRET` (yalnızca varsayılan hesap)
5. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).

En düşük yapılandırma:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Notlar

- Botlar doğrudan mesaj başlatamaz. Kullanıcının önce bota mesaj göndermesi gerekir.
- Webhook URL'si Gateway tarafından erişilebilir olmalıdır; bir proxy arkasındaysanız `webhookPublicUrl` ayarlayın.
- Bot API'si medya yüklemelerini desteklemez; medya URL olarak gönderilir.
- Webhook yükü DM'lerle odaları ayırt etmez; oda türü sorgularını etkinleştirmek için `apiUser` + `apiPassword` ayarlayın (aksi takdirde DM'ler oda olarak ele alınır).

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.nextcloud-talk.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir eşleme kodu alır.
- Şununla onaylayın:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Genel DM'ler: `channels.nextcloud-talk.dmPolicy="open"` artı `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` yalnızca Nextcloud kullanıcı kimlikleriyle eşleşir; görünen adlar yok sayılır.

## Odalar (gruplar)

- Varsayılan: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bahsetme geçitlemeli).
- Odaları `channels.nextcloud-talk.rooms` ile izin listesine ekleyin:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Hiçbir odaya izin vermemek için izin listesini boş bırakın veya `channels.nextcloud-talk.groupPolicy="disabled"` ayarlayın.

## Yetenekler

| Özellik         | Durum             |
| --------------- | ----------------- |
| Doğrudan mesajlar | Desteklenir     |
| Odalar          | Desteklenir       |
| İleti dizileri  | Desteklenmez      |
| Medya           | Yalnızca URL      |
| Tepkiler        | Desteklenir       |
| Yerel komutlar  | Desteklenmez      |

## Yapılandırma referansı (Nextcloud Talk)

Tam yapılandırma: [Configuration](/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.nextcloud-talk.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.nextcloud-talk.baseUrl`: Nextcloud örneği URL'si.
- `channels.nextcloud-talk.botSecret`: bot paylaşılan gizli anahtarı.
- `channels.nextcloud-talk.botSecretFile`: normal dosya gizli anahtar yolu. Symlink'ler reddedilir.
- `channels.nextcloud-talk.apiUser`: oda sorguları için API kullanıcısı (DM algılama).
- `channels.nextcloud-talk.apiPassword`: oda sorguları için API/uygulama parolası.
- `channels.nextcloud-talk.apiPasswordFile`: API parola dosyası yolu.
- `channels.nextcloud-talk.webhookPort`: webhook dinleyici bağlantı noktası (varsayılan: 8788).
- `channels.nextcloud-talk.webhookHost`: webhook ana makinesi (varsayılan: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: webhook yolu (varsayılan: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: dışarıdan erişilebilir webhook URL'si.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM izin listesi (kullanıcı kimlikleri). `open` için `"*"` gerekir.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: grup izin listesi (kullanıcı kimlikleri).
- `channels.nextcloud-talk.rooms`: oda başına ayarlar ve izin listesi.
- `channels.nextcloud-talk.historyLimit`: grup geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dmHistoryLimit`: DM geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dms`: DM başına geçersiz kılmalar (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: giden metin parça boyutu (karakter).
- `channels.nextcloud-talk.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.nextcloud-talk.blockStreaming`: bu kanal için blok akışını devre dışı bırak.
- `channels.nextcloud-talk.blockStreamingCoalesce`: blok akışı birleştirme ayarı.
- `channels.nextcloud-talk.mediaMaxMb`: gelen medya üst sınırı (MB).

## İlgili

- [Channels Overview](/channels) — desteklenen tüm kanallar
- [Pairing](/channels/pairing) — DM kimlik doğrulama ve eşleme akışı
- [Groups](/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Channel Routing](/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sertleştirme
