---
read_when:
    - Nextcloud Talk kanal özellikleri üzerinde çalışma
summary: Nextcloud Talk destek durumu, yetenekleri ve yapılandırması
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Durum: paketlenmiş Plugin (Webhook botu). Doğrudan mesajlar, odalar, tepkiler ve Markdown mesajları desteklenir.

## Paketlenmiş Plugin

Nextcloud Talk, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle
normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derleme veya Nextcloud Talk'u içermeyen özel bir kurulum kullanıyorsanız,
elle yükleyin:

CLI ile yükleyin (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Nextcloud Talk Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Nextcloud sunucunuzda bir bot oluşturun:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Hedef oda ayarlarında botu etkinleştirin.
4. OpenClaw'ı yapılandırın:
   - Yapılandırma: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Veya ortam: `NEXTCLOUD_TALK_BOT_SECRET` (yalnızca varsayılan hesap)

   CLI kurulumu:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Eşdeğer açık alanlar:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Dosya destekli gizli anahtar:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).

Minimum yapılandırma:

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

- Botlar DM başlatamaz. Kullanıcının önce bota mesaj göndermesi gerekir.
- Webhook URL'sine Gateway tarafından erişilebilir olmalıdır; bir proxy arkasındaysanız `webhookPublicUrl` ayarlayın.
- Bot API'si medya yüklemelerini desteklemez; medya URL olarak gönderilir.
- Webhook payload'ı DM'leri odalardan ayırt etmez; oda türü sorgularını etkinleştirmek için `apiUser` + `apiPassword` ayarlayın (aksi halde DM'ler oda olarak değerlendirilir).

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.nextcloud-talk.dmPolicy = "pairing"`. Bilinmeyen göndericiler bir eşleştirme kodu alır.
- Şununla onaylayın:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Herkese açık DM'ler: `channels.nextcloud-talk.dmPolicy="open"` artı `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` yalnızca Nextcloud kullanıcı kimlikleriyle eşleşir; görünen adlar yok sayılır.

## Odalar (gruplar)

- Varsayılan: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bahsetme geçitlemeli).
- `channels.nextcloud-talk.rooms` ile odaları izin listesine alın:

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

| Özellik          | Durum          |
| ---------------- | -------------- |
| Doğrudan mesajlar | Desteklenir   |
| Odalar           | Desteklenir    |
| İleti dizileri   | Desteklenmez   |
| Medya            | Yalnızca URL   |
| Tepkiler         | Desteklenir    |
| Yerel komutlar   | Desteklenmez   |

## Yapılandırma başvurusu (Nextcloud Talk)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.nextcloud-talk.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.nextcloud-talk.baseUrl`: Nextcloud örneği URL'si.
- `channels.nextcloud-talk.botSecret`: bot paylaşılan gizli anahtarı.
- `channels.nextcloud-talk.botSecretFile`: normal dosya gizli anahtar yolu. Sembolik bağlantılar reddedilir.
- `channels.nextcloud-talk.apiUser`: oda sorguları için API kullanıcısı (DM algılama).
- `channels.nextcloud-talk.apiPassword`: oda sorguları için API/parola uygulaması.
- `channels.nextcloud-talk.apiPasswordFile`: API parola dosyası yolu.
- `channels.nextcloud-talk.webhookPort`: Webhook dinleyici portu (varsayılan: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook ana makinesi (varsayılan: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook yolu (varsayılan: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: dışarıdan erişilebilir Webhook URL'si.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM izin listesi (kullanıcı kimlikleri). `open`, `"*"` gerektirir.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: grup izin listesi (kullanıcı kimlikleri).
- `channels.nextcloud-talk.rooms`: oda başına ayarlar ve izin listesi.
- `channels.nextcloud-talk.historyLimit`: grup geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dmHistoryLimit`: DM geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dms`: DM başına geçersiz kılmalar (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: giden metin parça boyutu (karakter).
- `channels.nextcloud-talk.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.nextcloud-talk.blockStreaming`: bu kanal için blok akışını devre dışı bırakır.
- `channels.nextcloud-talk.blockStreamingCoalesce`: blok akışı birleştirme ayarı.
- `channels.nextcloud-talk.mediaMaxMb`: gelen medya sınırı (MB).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
