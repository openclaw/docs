---
read_when:
    - Kanal giriş yeniden düzenlemesinin neden gereğinden fazla kod eklediğini denetleme
    - Rota, komut, olay, etkinleştirme veya erişim grubu ilkesini paketle birlikte gelen Plugin'lerden çekirdeğe taşıma
    - Bir kanal giriş yardımcısının paketle birlikte gelen Plugin kodunu gerçekten silip silmediğini inceleme
sidebarTitle: Ingress core deletion
summary: Tekrarlanan kanal giriş bağlayıcı kodunu çekirdeğe taşımaya yönelik silme öncelikli plan.
title: Ingress çekirdeği silme planı
x-i18n:
    generated_at: "2026-05-12T00:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Giriş çekirdeği silme planı

Giriş yeniden düzenlemesi binlerce net satır eklerken sağlıklı değildir. Çekirdek
merkezileştirme, yalnızca paketli Plugin üretim kodu küçüldüğünde ve
eski üçüncü taraf SDK uyumluluğu SDK/çekirdek shim'lerine karantinaya alındığında
sayılır.

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

Paketli Plugin'ler, bu tür public Plugin API olmadıkça girişi yerel `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` veya
`{ allowed, reasonCode }` şekillerine geri çevirmemelidir.

## Bütçe

İzlenmeyen dosyalar dahil olmak üzere PR merge-base'i `origin/main` ile
karşılaştırılarak ölçüldü.

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

Minimum kalan temizlik:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Yalnızca yorum silme temizlik sayılmaz. Önceki bütçe geçişi, geri yüklenen QQBot
açıklayıcı yorumlarını içerdiği için fazla cömertti; bu belge yalnızca
yürütülebilir/belge/test kodu hareketini izler.

Her temizlik dalgasından sonra yeniden ölçün:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Tanı

İlk geçiş paylaşılan giriş çekirdeğini ekledi, ardından yanında çok fazla
Plugin-yerel yetkilendirme bıraktı:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Bu, modeli yineler. Çekirdek üretim yaklaşık 3.376 satır büyürken
paketli Plugin üretimi 1.240 satır küçüldü. Bu, ilk geçişten daha iyi,
ancak minimum bütçenin içinde değil. Çözüm hâlâ silme önceliklidir:

- yalnızca giriş alanlarını yeniden adlandıran Plugin DTO'larını silin
- yalnızca sarmalayıcı şeklini doğrulayan testleri silin
- çekirdek yardımcılarını yalnızca aynı yama paketli Plugin kodunu sildiğinde ekleyin
- eski SDK uyumluluğunu yalnızca SDK/çekirdek shim'lerinde tutun
- sarmalayıcı silme kararlı şekli ortaya çıkardıktan sonra çekirdeği yeniden paketleyin

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

Dal henüz minimum bütçenin içinde değil. Kalan incelemeyle ilgili çalışma,
başka bir çekirdek soyutlaması eklemeden önce yinelenen yetkilendirme akışını,
turn iskele kodunu veya sarmalayıcı testlerini silmelidir.

## Geçerli Kod Okuması

Sağlıklı çekirdek dikişi zaten `src/channels/message-access/runtime.ts` içinde var:
kimlik bağdaştırıcıları, etkin izin listeleri, eşleştirme deposu okumaları, rota
tanımlayıcıları, komut/olay preset'leri, erişim grupları ve son çözümlenmiş
`ResolvedChannelMessageIngress` projeksiyonu ona aittir.

Kalan büyüme çoğunlukla bu dikişin üstüne katmanlanan Plugin yapıştırıcısıdır:

- `extensions/telegram/src/ingress.ts` çekirdek kararlarını Telegram'a özgü
  komut/olay yardımcılarında sarmalar, ardından çağrı noktaları hâlâ önceden
  hesaplanmış normalleştirilmiş izin listelerini ve sahip listelerini geçirir.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  ve `extensions/matrix/src/matrix/monitor/access-state.ts` hâlâ girişin yanında
  yerel ilke DTO'larını veya eski karar adlarını tutar.
- `extensions/signal/src/monitor/access-policy.ts` Signal kimlik
  normalleştirmesini ve eşleştirme yanıtlarını doğru biçimde yerel tutar,
  ancak hâlâ doğrudan giriş tüketimine çökmelidir.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` ve
  `extensions/zalouser/src/monitor.ts` hâlâ giriş çekirdeği dışındaki paylaşılan
  turn yardımcılarına taşınabilecek rota/zarf/turn derlemesini yineler.

Sonuç: Çekirdeğe daha fazla kod taşımak, yalnızca aynı yamada bu Plugin
sarmalayıcı katmanlarını silerse yararlıdır. Sarmalayıcı dönüşleri yerinde
kalırken başka bir soyutlama eklemek aynı hatayı yineler.

## Sınır

Çekirdek genel ilkeye sahiptir:

- izin listesi normalleştirmesi ve eşleştirmesi
- erişim grubu genişletmesi ve tanılamaları
- eşleştirme deposu DM izin listesi okumaları
- rota, gönderen, komut, olay ve aktivasyon geçitleri
- kabul eşlemesi: dispatch, drop, skip, observe, pairing
- redakte edilmiş durum, kararlar, tanılamalar ve SDK uyumluluk projeksiyonları
- kimlik, rota, komut, olay, aktivasyon ve sonuçlar için yeniden kullanılabilir genel tanımlayıcılar

Plugin'ler taşıma gerçeklerine ve yan etkilere sahiptir:

- Webhook/soket/istek özgünlüğü
- platform kimliği çıkarma ve API aramaları
- kanala özgü ilke varsayılanları
- eşleştirme sınaması teslimi, yanıtlar, ack'ler, tepkiler, yazıyor göstergesi,
  medya, geçmiş, kurulum, doctor, durum, günlükler ve kullanıcıya dönük kopya

Çekirdek kanal-bağımsız kalmalıdır: `src/channels/message-access` içinde
Discord, Slack, Telegram, Matrix, oda, sunucu, alan, API istemcisi veya
Plugin'e özgü varsayılan olmamalıdır.

## Kabul Kuralı

Her yeni çekirdek yardımcısı paketli Plugin üretim kodunu hemen silmelidir.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Şu durumlarda durun ve yeniden tasarlayın:

- Plugin üretim LOC'u artarsa
- testler üretimin küçülmesinden daha hızlı büyürse
- paketli bir sıcak yol yalnızca `ResolvedChannelMessageIngress` öğesini yeniden adlandıran bir DTO döndürürse
- çekirdek yardımcısı bir kanal id'si, platform nesnesi, API istemcisi veya
  kanala özgü varsayılan gerektirirse

## Çalışma Paketleri

1. Bütçeyi dondurun.
   LOC'u PR'ye koyun, deprecated-ingress lint'i yeşil tutun ve temizlik commit'lerine
   önce/sonra LOC ekleyin.

2. İnce DTO dikişlerini silin.
   Plugin-yerel sarmalayıcı dönüşlerini doğrudan `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` veya `ingress` ile değiştirin.
   QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage ve
   Tlon ile başlayın. Sarmalayıcı-şekli testlerini silin; davranış testlerini koruyun.

3. Sonuç sınıflandırmasını yalnızca silmelerle ekleyin.
   Genel bir sınıflandırıcı `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` ve
   `drop-ingress` açığa çıkarabilir. Reason string'lerden değil karar grafiğinden
   türemeli ve aynı yamada en az üç Plugin'i taşımalıdır.

4. Rota tanımlayıcı oluşturucularını yalnızca silmelerle ekleyin.
   Genel rota hedefi ve rota gönderen yardımcıları, yalnızca rota-ağırlıklı
   Plugin'leri hemen küçültürse kabul edilebilir: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo ve Zalo Personal.

5. Komut/olay preset'lerini yalnızca silmelerle ekleyin.
   Metin-komutu, yerel-komut, callback ve origin-subject şekillerini merkezileştirin.
   Komut tüketicileri, komut geçidi çalışmadığında varsayılan olarak yetkisiz olmalıdır;
   olaylar eşleştirmeyi başlatmamalıdır.

6. Kimlik preset'lerini yalnızca kalıp kodu kaldırdıkları yerde paylaşın.
   Kararlı-id, kararlı-id-artı-takma-adlar, telefon/e164 ve çoklu-tanımlayıcı
   yardımcılarına, ham değerler yalnızca bağdaştırıcı girdisine girdiğinde ve
   redakte edilmiş durum opak id'leri/sayıları tuttuğunda izin verilir.

7. Yetkili turn derlemesini paylaşın.
   Giriş çekirdeği dışında, QA Channel, IRC, Nextcloud Talk, Zalo ve Zalo Personal'dan
   yinelenen rota/zarf/bağlam/yanıt iskele kodunu kaldırın. Çekirdek
   rota/oturum/zarf/dispatch sıralamasına sahip olabilir; Plugin'ler teslimi ve
   kanala özgü bağlamı tutar.

8. Uyumluluğu karantinaya alın.
   Kullanımdan kaldırılmış SDK yardımcıları kaynak-uyumlu kalır, ancak paketli
   sıcak yollar kullanımdan kaldırılmış giriş veya command-auth facade'larını
   içe aktarmamalıdır. Uyumluluk testleri paketli-Plugin internals yerine sahte
   üçüncü taraf Plugin'leri kullanmalıdır.

9. Çekirdeği yeniden paketleyin.
   Sarmalayıcı silmeden sonra tek-kullanımlı modülleri daraltın, kullanılmayan
   export'ları kaldırın, uyumluluk projeksiyonunu sıcak yolların dışına taşıyın
   ve kimlik, rota, komut/olay, aktivasyon, erişim grupları ve uyumluluk shim'leri
   için odaklı testleri koruyun.

## Silme Dalgaları

Bunları sırayla çalıştırın. Her dalga paketli üretim LOC'unu azaltmalıdır.

1. Sarmalayıcı çökertme, beklenen Plugin deltası: -400 ile -600.
   Plugin-yerel `resolveXAccess`, `resolveXCommandAccess` ve
   `accessFromIngress` sonuç türlerini doğrudan `ResolvedChannelMessageIngress`
   okumalarıyla değiştirin. İlk hedefler: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Paylaşılan sonuç yardımcıları, beklenen Plugin deltası: -200 ile -350.
   Genel bir sınıflandırıcıyı yalnızca en az üç Plugin genelinde yinelenen
   `shouldBlockControlCommand`, eşleştirme, aktivasyon atlama, rota engelleme
   ve gönderen engelleme merdivenlerini siliyorsa ekleyin.

3. Rota tanımlayıcı oluşturucular, beklenen Plugin deltası: -200 ile -350.
   Yinelenen rota hedefi ve rota gönderen tanımlayıcı derlemesini çekirdek
   yardımcılara taşıyın. İlk hedefler: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Turn derlemesi paylaşımı, beklenen Plugin deltası: -250 ile -450.
   Basit gelen Plugin'ler için ortak rota/oturum/zarf/dispatch sıralamasını
   kullanın. İlk hedefler: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Çekirdek yeniden paketleme, beklenen çekirdek deltası: -300 ile -700.
   Plugin'ler çalışma zamanı projeksiyonlarını doğrudan tükettikten sonra
   tek-kullanımlı modülleri silin, küçük dosyaları yeniden `runtime.ts` içine
   veya odaklı kardeşlere birleştirin ve SDK uyumluluk dosyalarını paketli sıcak
   yollardan ayrı tutun.

6. Test budama, beklenen test deltası: -300 ile -600.
   Yalnızca kaldırılmış sarmalayıcı şekillerini doğrulayan testleri silin.
   Komut reddi, grup fallback'i, origin-subject eşleştirmesi, aktivasyon atlama,
   erişim grupları, eşleştirme ve redaksiyon için davranış testlerini koruyun.

Bu dalgalardan sonra beklenen minimum landing şekli:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Taşımayın

Platform yapılandırma varsayılanlarını, kurulum kullanıcı deneyimini, doctor/fix kopyasını, API aramalarını,
Slack sahip varlığı kontrollerini, Matrix takma ad/doğrulama işlemeyi, Telegram
callback ayrıştırmasını, komut söz dizimi ayrıştırmasını, yerel komut kaydını, tepki
yükü ayrıştırmasını, eşleştirme yanıtlarını, komut yanıtlarını, onayları, yazıyor durumunu, medyayı, geçmişi
veya günlükleri taşımayın.

## Doğrulama

Hedefli yerel döngü:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC eğilimi bütçe içinde olduğunda geniş değişiklik kapıları/tam paket kanıtı için
Testbox kullanın.

Her iş paketi şunları kaydeder:

- kategoriye göre önce/sonra LOC
- silinen plugin sarmalayıcıları
- varsa yeni core yardımcı LOC
- çalıştırılan hedefli testler
- kalan etkin nokta listesi

## Çıkış Kriterleri

- paketlenmiş üretim içe aktarımları, kullanımdan kaldırılmış channel-access veya command-auth cephelerini kullanmaz
- uyumluluk kodu SDK/core dikişleriyle sınırlandırılmıştır
- paketlenmiş plugin'ler ingress projeksiyonlarını veya genel sonuçları doğrudan tüketir
- plugin üretim LOC değeri `origin/main` karşısında net en az 1.500 negatiftir
- core üretim LOC değeri `<= +1,500` olur veya toplam
  `<= +2,000` kalırken herhangi bir fazlalık telafi edilir
- temsili testler redaksiyon, rota, komut/olay, aktivasyon,
  access-group ve kanala özgü geri dönüş davranışını kapsar
