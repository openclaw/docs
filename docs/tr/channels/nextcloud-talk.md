---
read_when:
    - Nextcloud Talk kanal özellikleri üzerinde çalışma
summary: Nextcloud Talk destek durumu, yetenekleri ve yapılandırması
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T09:07:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Status: paketle gelen Plugin (Webhook botu). Doğrudan mesajlar, odalar, tepkiler ve Markdown mesajları desteklenir.

## Paketle gelen Plugin

Nextcloud Talk, mevcut OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur; bu yüzden
normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Nextcloud Talk'u hariç tutan daha eski bir derlemede veya özel bir kurulumdaysanız,
yayınlandığında güncel bir npm paketi kurun:

CLI ile kurun (npm registry, güncel bir paket mevcut olduğunda):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

npm, OpenClaw'a ait paketi kullanım dışı olarak bildirirse, daha yeni bir npm paketi
yayınlanana kadar güncel bir paketlenmiş OpenClaw derlemesi veya yerel checkout yolunu kullanın.

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum (başlangıç)

1. Nextcloud Talk Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketler.
   - Eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
2. Nextcloud sunucunuzda bir bot oluşturun:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
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

   Dosya destekli secret:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway'i yeniden başlatın (veya kurulumu tamamlayın).

En küçük yapılandırma:

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
- Webhook URL'si Gateway tarafından erişilebilir olmalıdır; bir proxy arkasındaysa `webhookPublicUrl` ayarlayın.
- Medya yüklemeleri bot API'si tarafından desteklenmez; medya URL olarak gönderilir.
- Webhook yükü DM'leri odalardan ayırt etmez; oda türü aramalarını etkinleştirmek için `apiUser` + `apiPassword` ayarlayın (aksi halde DM'ler oda olarak değerlendirilir).

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.nextcloud-talk.dmPolicy = "pairing"`. Bilinmeyen gönderenler bir eşleştirme kodu alır.
- Şununla onaylayın:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Herkese açık DM'ler: `channels.nextcloud-talk.dmPolicy="open"` artı `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` yalnızca Nextcloud kullanıcı ID'leriyle eşleşir; görünen adlar yok sayılır.

## Odalar (gruplar)

- Varsayılan: `channels.nextcloud-talk.groupPolicy = "allowlist"` (bahsetme kapılı).
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

- Hiçbir odaya izin vermemek için izin listesini boş tutun veya `channels.nextcloud-talk.groupPolicy="disabled"` ayarlayın.

## Yetenekler

| Özellik          | Durum             |
| ---------------- | ----------------- |
| Doğrudan mesajlar | Desteklenir       |
| Odalar           | Desteklenir       |
| Konular          | Desteklenmez      |
| Medya            | Yalnızca URL      |
| Tepkiler         | Desteklenir       |
| Yerel komutlar   | Desteklenmez      |

## Yapılandırma referansı (Nextcloud Talk)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.nextcloud-talk.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.nextcloud-talk.baseUrl`: Nextcloud instance URL'si.
- `channels.nextcloud-talk.botSecret`: bot paylaşılan secret'ı.
- `channels.nextcloud-talk.botSecretFile`: normal dosya secret yolu. Symlink'ler reddedilir.
- `channels.nextcloud-talk.apiUser`: oda aramaları için API kullanıcısı (DM algılama).
- `channels.nextcloud-talk.apiPassword`: oda aramaları için API/uygulama parolası.
- `channels.nextcloud-talk.apiPasswordFile`: API parolası dosya yolu.
- `channels.nextcloud-talk.webhookPort`: Webhook dinleyici portu (varsayılan: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook host'u (varsayılan: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook yolu (varsayılan: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: dışarıdan erişilebilir Webhook URL'si.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM izin listesi (kullanıcı ID'leri). `open`, `"*"` gerektirir.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: grup izin listesi (kullanıcı ID'leri).
- `channels.nextcloud-talk.rooms`: oda başına ayarlar ve izin listesi.
- `channels.nextcloud-talk.historyLimit`: grup geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dmHistoryLimit`: DM geçmişi sınırı (0 devre dışı bırakır).
- `channels.nextcloud-talk.dms`: DM başına geçersiz kılmalar (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: giden metin parçası boyutu (karakter).
- `channels.nextcloud-talk.chunkMode`: uzunluğa göre parçalara ayırmadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.nextcloud-talk.blockStreaming`: bu kanal için blok akışını devre dışı bırak.
- `channels.nextcloud-talk.blockStreamingCoalesce`: blok akışı birleştirme ayarı.
- `channels.nextcloud-talk.mediaMaxMb`: gelen medya sınırı (MB).

## İlgili

- [Kanallar genel bakışı](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
