---
read_when:
    - Kanal girişi yeniden düzenlemesinin neden çok fazla kod eklediğini denetleme
    - Paketle birlikte gelen Plugin'lerden çekirdeğe rota, komut, olay, etkinleştirme veya erişim grubu politikasını taşıma
    - Bir kanal giriş yardımcısının paketlenmiş Plugin kodunu gerçekten silip silmediğini gözden geçirme
sidebarTitle: Ingress core deletion
summary: Yinelenen kanal giriş bağlayıcı kodunu çekirdeğe taşımaya yönelik silme öncelikli plan.
title: Giriş çekirdeğini silme planı
x-i18n:
    generated_at: "2026-05-10T19:53:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Ingress çekirdeği silme planı

Ingress yeniden düzenlemesi binlerce net satır eklerken sağlıklı değildir. Çekirdekte
merkezileştirme yalnızca paketli Plugin üretim kodu küçüldüğünde ve eski
üçüncü taraf SDK uyumluluğu SDK/çekirdek shim'lerine karantinaya alındığında
anlamlıdır.

İstenen çalışma zamanı şekli:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Paketli Plugin'ler, ilgili tür herkese açık Plugin API'si olmadığı sürece
ingress'i yeniden yerel `AccessResult`, `GroupAccessDecision`,
`CommandAuthDecision`, `DmCommandAccess` veya `{ allowed, reasonCode }`
şekillerine çevirmemelidir.

## Bütçe

İzlenmeyen dosyalar dahil, `origin/main` ile PR merge-base'ine göre ölçüldü.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Kalan en düşük temizlik:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Yalnızca yorum silme temizlik sayılmaz. Önceki bütçe geçişi, geri yüklenen QQBot
açıklayıcı yorumlarını da içerdiği için fazla cömertti; bu belge yalnızca
çalıştırılabilir/belge/test kodu hareketini izler.

Her temizlik dalgasından sonra yeniden ölçün:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Tanı

İlk geçiş paylaşılan ingress çekirdeğini ekledi, sonra yanında fazla fazla
Plugin-yerel yetkilendirme bıraktı:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Bu modeli yineler. Çekirdek üretim yaklaşık 3.376 satır büyürken paketli Plugin
üretimi 1.240 satır küçüldü. Bu ilk geçişten daha iyi, ancak en düşük bütçenin
içinde değil. Düzeltme hâlâ silme öncelikli olmalıdır:

- yalnızca ingress alanlarını yeniden adlandıran Plugin DTO'larını sil
- yalnızca sarmalayıcı şeklini doğrulayan testleri sil
- çekirdek yardımcılarını yalnızca aynı yama paketli Plugin kodunu sildiğinde ekle
- eski SDK uyumluluğunu yalnızca SDK/çekirdek shim'lerinde tut
- sarmalayıcı silme kararlı şekli açığa çıkardıktan sonra çekirdeği yeniden paketle

## Sıcak Noktalar

Hâlâ küçülmesi gereken pozitif paketli üretim dosyaları:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Dal henüz en düşük bütçenin içinde değil. Kalan inceleme açısından ilgili iş,
başka bir çekirdek soyutlaması eklemeden önce yinelenen yetkilendirme akışını,
turn iskelelerini veya sarmalayıcı testlerini silmelidir.

## Güncel Kod Okuması

Sağlıklı çekirdek bağlantı noktası zaten `src/channels/message-access/runtime.ts`
içinde var: kimlik bağdaştırıcılarını, etkili izin listelerini, eşleştirme deposu
okumalarını, rota tanımlayıcılarını, komut/olay preset'lerini, erişim gruplarını
ve son çözümlenmiş `ResolvedChannelMessageIngress` projeksiyonunu o sahiplenir.

Kalan büyüme çoğunlukla bu bağlantı noktasının üstüne katmanlanmış Plugin
yapıştırıcı kodudur:

- `extensions/telegram/src/ingress.ts` çekirdek kararlarını Telegram'a özgü
  komut/olay yardımcılarıyla sarar, sonra çağrı noktaları hâlâ önceden
  hesaplanmış normalleştirilmiş izin listeleri ve sahip listeleri geçirir.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  ve `extensions/matrix/src/matrix/monitor/access-state.ts` hâlâ ingress'in
  yanında yerel ilke DTO'ları veya eski karar adlarını tutar.
- `extensions/signal/src/monitor/access-policy.ts` Signal kimlik
  normalleştirmesini ve eşleştirme yanıtlarını doğru şekilde yerel tutar, ancak
  yine de doğrudan ingress tüketimine çökmeli bir sarmalayıcı bağlantı noktası
  içerir.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` ve
  `extensions/zalouser/src/monitor.ts` hâlâ ingress çekirdeğinin dışında
  paylaşılan turn yardımcılarına taşınabilecek rota/zarf/turn oluşturmayı yineler.

Sonuç: çekirdeğe daha fazla kod taşımak yalnızca aynı yamada bu Plugin
sarmalayıcı katmanlarını siliyorsa yararlıdır. Sarmalayıcı dönüşlerini yerinde
bırakırken başka bir soyutlama eklemek hatayı tekrarlar.

## Sınır

Çekirdek genel ilkeye sahiptir:

- izin listesi normalleştirme ve eşleştirme
- erişim grubu genişletme ve tanılama
- eşleştirme deposu DM izin listesi okumaları
- rota, gönderen, komut, olay ve etkinleştirme kapıları
- kabul eşlemesi: gönderim, düşürme, atlama, gözlemleme, eşleştirme
- redakte edilmiş durum, kararlar, tanılamalar ve SDK uyumluluk projeksiyonları
- kimlik, rota, komut, olay, etkinleştirme ve sonuçlar için yeniden kullanılabilir
  genel tanımlayıcılar

Plugin'ler taşıma gerçeklerine ve yan etkilere sahiptir:

- webhook/soket/istek özgünlüğü
- platform kimliği çıkarma ve API aramaları
- kanala özgü ilke varsayılanları
- eşleştirme sınaması teslimi, yanıtlar, onaylar, tepkiler, yazıyor durumu, medya,
  geçmiş, kurulum, doctor, durum, günlükler ve kullanıcıya dönük metin

Çekirdek kanaldan bağımsız kalmalıdır: `src/channels/message-access` içinde
Discord, Slack, Telegram, Matrix, oda, guild, space, API istemcisi veya
Plugin'e özgü varsayılan bulunmamalıdır.

## Kabul Kuralı

Her yeni çekirdek yardımcısı paketli Plugin üretim kodunu hemen silmelidir.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Şu durumlarda durup yeniden tasarlayın:

- Plugin üretim LOC artarsa
- testler üretim küçülmesinden daha hızlı büyürse
- paketli bir sıcak yol yalnızca `ResolvedChannelMessageIngress` adlarını yeniden
  adlandıran bir DTO döndürürse
- bir çekirdek yardımcısı kanal kimliğine, platform nesnesine, API istemcisine
  veya kanala özgü varsayılana ihtiyaç duyarsa

## İş Paketleri

1. Bütçeyi dondur.
   LOC'u PR'a koy, deprecated-ingress lint'i yeşil tut ve temizlik commit'lerine
   önce/sonra LOC ekle.

2. İnce DTO bağlantı noktalarını sil.
   Plugin-yerel sarmalayıcı dönüşlerini doğrudan
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`,
   `routeAccess` veya `ingress` okumalarıyla değiştir. QQBot, Telegram, Slack,
   Discord, Signal, Feishu, Matrix, iMessage ve Tlon ile başla. Sarmalayıcı
   şekli testlerini sil; davranış testlerini koru.

3. Sonuç sınıflandırmasını yalnızca silmelerle ekle.
   Genel bir sınıflandırıcı `dispatch`, `pairing-required`, `skip-activation`,
   `drop-command`, `drop-route`, `drop-sender` ve `drop-ingress` açığa çıkarabilir.
   Reason string'lerinden değil, karar grafiğinden türemeli ve aynı yamada en az
   üç Plugin'i taşımalıdır.

4. Rota tanımlayıcı oluşturucularını yalnızca silmelerle ekle.
   Genel rota hedefi ve rota gönderen yardımcıları yalnızca rota ağırlıklı
   Plugin'leri hemen küçültürse kabul edilebilir: Google Chat, IRC,
   Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo ve Zalo Personal.

5. Komut/olay preset'lerini yalnızca silmelerle ekle.
   Metin komutu, native komut, callback ve origin-subject şekillerini
   merkezileştir. Komut tüketicileri, komut kapısı çalışmadığında varsayılan
   olarak yetkisiz olmalıdır; olaylar eşleştirme başlatmamalıdır.

6. Kimlik preset'lerini yalnızca kalıp kodu kaldırdıkları yerlerde paylaş.
   Stable-id, stable-id-plus-aliases, phone/e164 ve multi-identifier yardımcılarına,
   ham değerler yalnızca bağdaştırıcı girdisine girdiğinde ve redakte edilmiş
   durum opak kimlikleri/sayımları tuttuğunda izin verilir.

7. Yetkili turn oluşturmayı paylaş.
   Ingress çekirdeğinin dışında, QA Channel, IRC, Nextcloud Talk, Zalo ve Zalo
   Personal'dan yinelenen rota/zarf/bağlam/yanıt iskelelerini kaldır. Çekirdek
   rota/oturum/zarf/gönderim sıralamasına sahip olabilir; Plugin'ler teslimi ve
   kanala özgü bağlamı tutar.

8. Uyumluluğu karantinaya al.
   Kullanımdan kaldırılmış SDK yardımcıları kaynak uyumlu kalır, ancak paketli
   sıcak yollar kullanımdan kaldırılmış ingress veya command-auth cephelerini
   içe aktarmamalıdır. Uyumluluk testleri paketli-Plugin iç ayrıntılarını değil,
   sahte üçüncü taraf Plugin'leri kullanmalıdır.

9. Çekirdeği yeniden paketle.
   Sarmalayıcı silmeden sonra tek kullanımlık modülleri birleştir, kullanılmayan
   dışa aktarmaları kaldır, uyumluluk projeksiyonunu sıcak yollardan çıkar ve
   kimlik, rota, komut/olay, etkinleştirme, erişim grupları ve uyumluluk
   shim'leri için odaklanmış testleri koru.

## Silme Dalgaları

Bunları sırayla çalıştırın. Her dalga paketli üretim LOC'unu düşürmelidir.

1. Sarmalayıcı çökertme, beklenen Plugin deltası: -400 ila -600.
   Plugin-yerel `resolveXAccess`, `resolveXCommandAccess` ve
   `accessFromIngress` sonuç türlerini `ResolvedChannelMessageIngress` üzerinden
   doğrudan okumalarla değiştir. İlk hedefler: Discord DM komut yetkilendirmesi,
   Feishu ilkesi, Matrix erişim durumu, Telegram ingress, Signal erişim ilkesi,
   QQBot SDK bağdaştırıcısı.

2. Paylaşılan sonuç yardımcıları, beklenen Plugin deltası: -200 ila -350.
   Tek bir genel sınıflandırıcıyı yalnızca yinelenen `shouldBlockControlCommand`,
   eşleştirme, etkinleştirme atlama, rota engelleme ve gönderen engelleme
   merdivenlerini en az üç Plugin'de siliyorsa ekle.

3. Rota tanımlayıcı oluşturucular, beklenen Plugin deltası: -200 ila -350.
   Yinelenen rota hedefi ve rota gönderen tanımlayıcı oluşturmayı çekirdek
   yardımcılara taşı. İlk hedefler: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Turn oluşturma paylaşımı, beklenen Plugin deltası: -250 ila -450.
   Basit gelen Plugin'ler için ortak rota/oturum/zarf/gönderim sıralamasını
   kullan. İlk hedefler: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Çekirdek yeniden paketleme, beklenen çekirdek deltası: -300 ila -700.
   Plugin'ler çalışma zamanı projeksiyonlarını doğrudan tükettikten sonra
   tek kullanımlık modülleri sil, küçük dosyaları yeniden `runtime.ts` veya
   odaklı kardeş dosyalarla birleştir ve SDK uyumluluk dosyalarını paketli sıcak
   yollardan ayrı tut.

6. Test budama, beklenen test deltası: -300 ila -600.
   Yalnızca kaldırılmış sarmalayıcı şekillerini doğrulayan testleri sil. Komut
   reddi, grup fallback'i, origin-subject eşleştirme, etkinleştirme atlama,
   erişim grupları, eşleştirme ve redaksiyon için davranış testlerini koru.

Bu dalgalardan sonra beklenen en düşük iniş şekli:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Taşımayın

Platform yapılandırma varsayılanlarını, kurulum kullanıcı deneyimini, doctor/fix metnini, API aramalarını,
Slack sahip-varlığı kontrollerini, Matrix alias/doğrulama işlemeyi, Telegram
callback ayrıştırmasını, komut söz dizimi ayrıştırmasını, yerel komut kaydını, reaksiyon
yükü ayrıştırmasını, eşleştirme yanıtlarını, komut yanıtlarını, onayları, yazıyor durumunu, medyayı, geçmişi
veya günlükleri taşımayın.

## Doğrulama

Hedeflenmiş yerel döngü:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC eğilimi bütçe içine girdikten sonra geniş değiştirilmiş kapılar/tam paket kanıtı için
Testbox kullanın.

Her iş paketi şunları kaydeder:

- kategoriye göre önce/sonra LOC
- silinen Plugin sarmalayıcıları
- varsa yeni çekirdek yardımcı LOC
- çalıştırılan hedeflenmiş testler
- kalan etkin nokta listesi

## Çıkış Kriterleri

- paketlenmiş üretim içe aktarmalarında kullanımdan kaldırılmış channel-access veya command-auth cepheleri yok
- uyumluluk kodu SDK/çekirdek sınırlarıyla izole edilmiştir
- paketlenmiş Plugin'ler ingress projeksiyonlarını veya genel sonuçları doğrudan tüketir
- Plugin üretim LOC'si `origin/main` karşısında en az 1.500 net negatiftir
- çekirdek üretim LOC'si <= +1.500'dür veya toplam
  <= +2.000 kalırken herhangi bir fazlalığın bedeli ödenmiştir
- temsili testler redaksiyon, rota, komut/olay, etkinleştirme,
  erişim grubu ve kanala özgü geri dönüş davranışını kapsar
