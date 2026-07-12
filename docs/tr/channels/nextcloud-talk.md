---
read_when:
    - Nextcloud Talk kanal özellikleri üzerinde çalışma
summary: Nextcloud Talk destek durumu, özellikleri ve yapılandırması
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T11:29:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk, OpenClaw'ı bir Talk Webhook botu üzerinden kendi sunucunuzda barındırılan bir Nextcloud örneğine bağlayan, indirilebilir bir kanal Plugin'idir (`@openclaw/nextcloud-talk`). Doğrudan mesajlar, odalar, tepkiler ve markdown mesajları desteklenir; medya URL olarak gönderilir.

## Kurulum

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Güncel resmî sürüm etiketini izlemek için yalnızca paket belirtimini kullanın. Tam bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

Yerel bir çalışma kopyasından (geliştirme iş akışları):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Kurulumdan sonra Gateway'i yeniden başlatın. Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Plugin'i kurun (yukarıda).
2. Nextcloud sunucunuzda bir bot oluşturun:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   `--feature response` seçeneğini koruyun: bu seçenek olmadan giden yanıtlar 401 hatasıyla başarısız olur. Mevcut bir botu `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` ile düzeltin.

3. Hedef oda ayarlarında botu etkinleştirin.
4. OpenClaw'ı yapılandırın:
   - Yapılandırma: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Veya ortam değişkeni: `NEXTCLOUD_TALK_BOT_SECRET` (yalnızca varsayılan hesap)

   CLI kurulumu (`--url`/`--token`, açık alanların takma adlarıdır; `nc-talk` ve `nc` kanal takma adları olarak çalışır):

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

   Dosya tabanlı gizli değer:

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

- Botlar doğrudan mesaj başlatamaz. Kullanıcı önce bota mesaj göndermelidir.
- Webhook URL'sine Nextcloud sunucusundan erişilebilmelidir; Gateway bir proxy arkasındaysa `webhookPublicUrl` değerini ayarlayın. Webhook istekleri, botun gizli değeriyle HMAC-SHA256 kullanılarak imzalanır; geçersiz imzalar reddedilir ve hız sınırına tabi tutulur.
- Bot API'si medya yüklemelerini desteklemez; giden medya, `Attachment: <url>` satırı olarak eklenir.
- Webhook yükü, doğrudan mesajlarla odaları birbirinden ayırmaz; oda türü sorgularını etkinleştirmek için `apiUser` + `apiPassword` değerlerini ayarlayın (yaklaşık 5 dakika önbelleğe alınır). Bunlar olmadan her konuşma oda olarak değerlendirilir.
- Giden istekler SSRF korumasından geçer. Güvenilir bir özel/dahili ağdaki Nextcloud ana makinesi için `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` ayarıyla izin verin.
- `apiUser`/`apiPassword` ve `webhookPublicUrl` ayarlandığında `openclaw channels status`, botu yoklar ve `response` özelliği eksikse uyarır.

## Erişim denetimi (doğrudan mesajlar)

- Varsayılan: `channels.nextcloud-talk.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir eşleştirme kodu alır.
- Şunlarla onaylayın:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Herkese açık doğrudan mesajlar: `channels.nextcloud-talk.dmPolicy="open"` ve `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` yalnızca Nextcloud kullanıcı kimlikleriyle eşleşir (küçük harfe dönüştürülür); görünen adlar yok sayılır.

## Odalar (gruplar)

- Varsayılan: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bahsetme gerektirir).
- Oda belirtecinin anahtar olarak kullanıldığı `channels.nextcloud-talk.rooms` ile odaları izin listesine ekleyin; `"*"` genel varsayılanı ayarlar:

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

- Oda başına anahtarlar: `requireMention` (varsayılan olarak true), `enabled` (false, odayı devre dışı bırakır), `allowFrom` (oda başına gönderen izin listesi), `tools` (araç izin/ret geçersiz kılmaları), `skills` (yüklenen Skills'i sınırlar), `systemPrompt`.
- Hiçbir odaya izin vermemek için izin listesini boş bırakın veya `channels.nextcloud-talk.groupPolicy="disabled"` değerini ayarlayın.

## Yetenekler

| Özellik          | Durum               |
| ---------------- | ------------------- |
| Doğrudan mesajlar | Destekleniyor       |
| Odalar            | Destekleniyor       |
| İleti dizileri    | Desteklenmiyor      |
| Medya             | Yalnızca URL        |
| Tepkiler          | Destekleniyor       |
| Yerel komutlar    | Desteklenmiyor      |

## Yapılandırma başvurusu (Nextcloud Talk)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.nextcloud-talk.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.nextcloud-talk.baseUrl`: Nextcloud örneğinin URL'si.
- `channels.nextcloud-talk.botSecret`: botun paylaşılan gizli değeri (dize veya gizli değer başvurusu).
- `channels.nextcloud-talk.botSecretFile`: normal dosya türündeki gizli değerin yolu. Sembolik bağlantılar reddedilir.
- `channels.nextcloud-talk.apiUser`: oda sorguları (doğrudan mesaj algılama) ve durum yoklaması için API kullanıcısı.
- `channels.nextcloud-talk.apiPassword`: oda sorguları için API/uygulama parolası.
- `channels.nextcloud-talk.apiPasswordFile`: API parolası dosyasının yolu.
- `channels.nextcloud-talk.webhookPort`: Webhook dinleyici bağlantı noktası (varsayılan: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook ana makinesi (varsayılan: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook yolu (varsayılan: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: dışarıdan erişilebilen Webhook URL'si.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing). `open`, `allowFrom=["*"]` gerektirir.
- `channels.nextcloud-talk.allowFrom`: doğrudan mesaj izin listesi (kullanıcı kimlikleri).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (varsayılan: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: oda gönderenleri izin listesi (kullanıcı kimlikleri); ayarlanmadığında `allowFrom` kullanılır.
- `channels.nextcloud-talk.rooms`: oda başına ayarlar ve izin listesi (yukarıya bakın).
- Statik gönderen erişim gruplarına `allowFrom` ve `groupAllowFrom` içinden `accessGroup:<name>` ile başvurulabilir.
- `channels.nextcloud-talk.historyLimit`: grup geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dmHistoryLimit`: doğrudan mesaj geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dms`: kullanıcı kimliğinin anahtar olarak kullanıldığı, doğrudan mesaj başına geçersiz kılmalar (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: giden metin parçalarının karakter cinsinden boyutu (varsayılan: 4000).
- `channels.nextcloud-talk.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırlarından) bölmek için `length` (varsayılan) veya `newline`.
- `channels.nextcloud-talk.blockStreaming`: bu kanal için blok akışını devre dışı bırakır.
- `channels.nextcloud-talk.blockStreamingCoalesce`: blok akışı birleştirme ayarı.
- `channels.nextcloud-talk.responsePrefix`: giden yanıt ön eki.
- `channels.nextcloud-talk.markdown.tables`: markdown tablo oluşturma modu (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: gelen medya üst sınırı (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: özel/dahili Nextcloud ana makinelerinin SSRF korumasını geçmesine izin verir.
- `channels.nextcloud-talk.accounts.<id>`: hesap başına geçersiz kılmalar (aynı anahtarlar); `defaultAccount` varsayılan hesabı seçer. `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` ortam değişkenleri yalnızca varsayılan hesaba uygulanır.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme gereksinimi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güvenlik sıkılaştırması
