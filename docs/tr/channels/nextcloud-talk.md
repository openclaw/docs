---
read_when:
    - Nextcloud Talk kanal özellikleri üzerinde çalışma
summary: Nextcloud Talk destek durumu, yetenekler ve yapılandırma
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-10T19:23:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4b3b2d074cc8d3c19223dbb0c306c6861717d0f35e638e3aab04b03647fd248
    source_path: channels/nextcloud-talk.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Durum: paketle gelen Plugin (Webhook botu). Doğrudan mesajlar, odalar, tepkiler ve markdown mesajları desteklenir.

## Paketle gelen Plugin

Nextcloud Talk, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu nedenle
normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Nextcloud Talk'u hariç tutan özel bir kurulum kullanıyorsanız,
npm paketini doğrudan kurun:

CLI ile kurulum (npm kayıt yeri):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Geçerli resmi sürüm etiketini izlemek için yalın paketi kullanın. Tam bir
sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Nextcloud Talk Plugin'in kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
2. Nextcloud sunucunuzda bir bot oluşturun:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

3. Hedef oda ayarlarında botu etkinleştirin.
4. OpenClaw'ı yapılandırın:
   - Yapılandırma: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Veya env: `NEXTCLOUD_TALK_BOT_SECRET` (yalnızca varsayılan hesap)

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

   Dosya destekli gizli değer:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).

Asgari yapılandırma:

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

- Botlar DM başlatamaz. Kullanıcı önce bota mesaj göndermelidir.
- Webhook URL'sine Gateway tarafından erişilebilmelidir; bir proxy arkasındaysa `webhookPublicUrl` ayarlayın.
- Medya yüklemeleri bot API'si tarafından desteklenmez; medya URL olarak gönderilir.
- Webhook yükü DM'ler ile odaları ayırt etmez; oda türü aramalarını etkinleştirmek için `apiUser` + `apiPassword` ayarlayın (aksi halde DM'ler oda olarak ele alınır).

## Erişim kontrolü (DM'ler)

- Varsayılan: `channels.nextcloud-talk.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir eşleştirme kodu alır.
- Şununla onaylayın:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Herkese açık DM'ler: `channels.nextcloud-talk.dmPolicy="open"` ve `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` yalnızca Nextcloud kullanıcı kimlikleriyle eşleşir; görünen adlar yok sayılır.

## Odalar (gruplar)

- Varsayılan: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bahsetme kapılı).
- Odaları `channels.nextcloud-talk.rooms` ile izin listesine alın:

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

- Hiçbir odaya izin vermemek için izin listesini boş tutun veya `channels.nextcloud-talk.groupPolicy="disabled"` ayarlayın.

## Yetenekler

| Özellik          | Durum            |
| ---------------- | ---------------- |
| Doğrudan mesajlar | Desteklenir      |
| Odalar           | Desteklenir      |
| Konular          | Desteklenmez     |
| Medya            | Yalnızca URL     |
| Tepkiler         | Desteklenir      |
| Yerel komutlar   | Desteklenmez     |

## Yapılandırma referansı (Nextcloud Talk)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.nextcloud-talk.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.nextcloud-talk.baseUrl`: Nextcloud örneği URL'si.
- `channels.nextcloud-talk.botSecret`: bot paylaşılan gizli değeri.
- `channels.nextcloud-talk.botSecretFile`: normal dosya gizli değer yolu. Sembolik bağlantılar reddedilir.
- `channels.nextcloud-talk.apiUser`: oda aramaları için API kullanıcısı (DM algılama).
- `channels.nextcloud-talk.apiPassword`: oda aramaları için API/uygulama parolası.
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
- Statik gönderen erişim gruplarına `allowFrom` ve `groupAllowFrom` içinden `accessGroup:<name>` ile başvurulabilir.
- `channels.nextcloud-talk.historyLimit`: grup geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dmHistoryLimit`: DM geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dms`: DM başına geçersiz kılmalar (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: giden metin parça boyutu (karakter).
- `channels.nextcloud-talk.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.nextcloud-talk.blockStreaming`: bu kanal için blok akışını devre dışı bırak.
- `channels.nextcloud-talk.blockStreamingCoalesce`: blok akışı birleştirme ayarı.
- `channels.nextcloud-talk.mediaMaxMb`: gelen medya üst sınırı (MB).

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
