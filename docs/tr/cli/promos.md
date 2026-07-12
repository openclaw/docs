---
read_when:
    - ClawHub'ın ücretsiz promosyon model teklifini denemek istiyorsunuz
    - Bir sağlayıcıyı ilk katılım yerine bir promosyon aracılığıyla yapılandırıyorsunuz
summary: '`openclaw promos` için CLI başvurusu (promosyon model tekliflerini listeleme ve talep etme)'
title: Promosyonlar
x-i18n:
    generated_at: "2026-07-12T12:12:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

ClawHub'da yayımlanan promosyon model tekliflerini keşfedin ve talep edin. Bir promosyonu talep etmek, sağlayıcıyı (gerektiğinde kimlik doğrulama ve Plugin) yapılandırır ve promosyonun modellerini kaydeder — ilk kurulumu yeniden çalıştırmadan ve siz istemediğiniz sürece varsayılan modelinizi değiştirmeden.

İlgili:

- Varsayılan model ve yedekler: [Modeller](/tr/cli/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/tr/start/getting-started)

## Komutlar

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Şu anda etkin olan promosyonları; modelleri, önerilen varsayılan modeli, kalan süreyi ve tam talep komutunu içerecek şekilde listeler. `--json`, ham veri yükünü yazdırır.

## `openclaw promos claim <slug>`

Etkin bir promosyonu talep eder:

1. Promosyonu ClawHub'dan alır ve geçerlilik süresi içinde olduğunu doğrular.
2. Promosyonun sağlayıcısını, kimlik doğrulama seçimini ve bildirilen Plugin paketlerini yüklü OpenClaw sürümünüze göre doğrular. Bilinmeyen kimlikler veya paket uyuşmazlıkları reddedilir — bir promosyon, CLI'ın zaten nasıl çalıştıracağını bilmediği hiçbir şeyi çalıştırmasını sağlayamaz.
3. Mevcut sağlayıcı kimlik bilgilerinizi varsa yeniden kullanır. Aksi takdirde sağlayıcının normal kimlik doğrulama akışını yürütür (önce ücretsiz bir anahtar için promosyonun kayıt URL'sini yazdırır). `--api-key <key>`, `openclaw onboard` etkileşimsiz seçenekleriyle uyumlu biçimde API anahtarıyla kimlik doğrulamayı istem olmadan tamamlar; anahtarı komut satırından uzak tutmak için bunun yerine sağlayıcının ortam değişkenini dışa aktarın (örneğin `OPENROUTER_API_KEY`) — mevcut ortam kimlik bilgileri otomatik olarak algılanır ve herhangi bir seçenek gerekmez.
4. Promosyonun modellerini takma adlarıyla kaydeder. Mevcut takma adların üzerine hiçbir zaman yazılmaz.
5. Promosyonun önerilen modelini varsayılanınız olarak ayarlamayı teklif eder — `--set-default` soruyu atlar; aksi takdirde varsayılanlarınızla ilgili hiçbir şey değişmez.

Promosyonun geçerlilik süresi sona erdiğinde sağlayıcı ücretsiz modelleri sunmayı durdurur; yapılandırmanız ve kimlik bilgileriniz değişmeden kalır. İstediğiniz zaman `openclaw models set <model>` ile geri dönebilirsiniz.

## `models list` içinde pasif keşif

`openclaw models list`, siz doğrudan ClawHub'a sormadan da promosyonları gösterir:

- Modellerini yapılandırmadığınız etkin teklifler, tablonun altında "Promosyon aracılığıyla kullanılabilir" grubunda ve her biri kendi talep komutuyla görünür.
- `promos claim` aracılığıyla kaydettiğiniz modeller, teklifin geçerlilik süresi sona erdiğinde `promo ended` olarak değişen bir `promo` etiketi taşır.
- Yeni bir teklif ilk kez görüldüğünde, tek seferlik bir bildirim `openclaw promos list` komutuna yönlendirir. Daha önce listelediğiniz veya talep ettiğiniz teklifler bir daha duyurulmaz.

Bu işlem, ClawHub'ın barındırılan promosyon akışının yerel olarak önbelleğe alınmış bir kopyasını okur (normalde koşullu bir istekle günde bir kez veya önbelleğe alınmış anlık görüntünün süresi dolduğunda daha erken yenilenir; yenileme hataları sessizce atlanır). Güncelliğini yitirmiş bir yenileme en fazla 2,5 saniye bekler ve listelemeyi hiçbir zaman bozmaz. `--json` ve `--plain` çıktıları makine işlemeye uygun ve temiz kalır: promosyon bölümleri veya bildirimleri içermez. Talep işlemi her zaman canlı ClawHub API'sine karşı yeniden doğrulama yapar; bu nedenle erken geri çekilen bir teklif, önbelleğe alınmış bir kopyada hâlâ görünse bile reddedilir.
