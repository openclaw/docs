---
read_when:
    - İnsanlar veya diğer aracılar bir oturumu kendilerinden habersiz değiştirdiğinde aracıların bunu fark etmesini istiyorsunuz
    - Durum değişikliği bildirimlerinde, izleme imleçlerinde veya session_status changesSince değerinde hata ayıklıyorsunuz
    - Üst düzey agent'ların alt oturumlarla nasıl senkronize kaldığını anlamak istiyorsunuz
sidebarTitle: Session state awareness
summary: 'Kalıcı oturum durumu sinyal günlüğü: durum sürümleri, izleyiciler, eski durum bildirimleri ve uzlaştırma'
title: Oturum durumu farkındalığı
x-i18n:
    generated_at: "2026-07-16T17:06:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb4126a0802e1ca4418f225c792490493a78886089b81c3b4567f72090ce34f4
    source_path: concepts/session-state.md
    workflow: 16
---

Birden fazla oturum aynı sorun üzerinde çalıştığında — bir yöneticinin alt oturumlara görev vermesi, bir insanın doğrudan bir çalışan oturumuna girmesi, iki ajanın [`sessions_send`](/tr/concepts/session-tool) üzerinden koordinasyon kurması — her oturum diğerleri hakkında varsayımlar oluşturur. Başka bir aktör müdahale ettiği anda bu varsayımlar geçerliliğini yitirir. Oturum durumu farkındalığı, müdahaleyi algılayan, etkilenen oturuma bir kez bildiren ve harekete geçmeden önce gelişmeleri düşük maliyetle takip etmesini sağlayan mekanizmadır.

Üç bileşen birlikte çalışır:

1. **Kalıcı bir sinyal günlüğü**, oturum başına seçili durum değişikliklerini kaydeder.
2. **İzleyiciler**, hedef başına imleçleri tutar ve birleştirilmiş tek bir eski durum bildirimi alır.
3. **Uzlaştırma**, `changesSince` ile `session_status` üzerinden kesin farkı çeker.

## Sinyal günlüğü

OpenClaw, izlenen bir oturum önemli ölçüde değiştiğinde paylaşılan durum veritabanına (`session_state_events`) türü belirlenmiş bir olay ekler. Olaylar meta veriler ve tek satırlık bir özet taşır; ileti içeriğini asla taşımaz.

| Tür                    | Kaydedildiği durum                                      | İzleyicilere bildirilir |
| ---------------------- | -------------------------------------------------------- | ----------------- |
| `human_direct_message` | Bir insan, izlenen bir oturuma doğrudan bir tur gönderdiğinde | Evet               |
| `upstream_missing`     | Benimsenmiş bir oturumun üst kaynak bağlantısı kaybolduğunda | Evet               |
| `goal_changed`         | Oturumun hedef durumu oluşturulduğunda, güncellendiğinde veya temizlendiğinde | Evet               |
| `child_spawned`        | Bir alt ajan veya ACP alt oturumu oluşturulduğunda       | Hayır (imleci başlangıç konumuna getirir) |
| `run_completed`        | Bir alt çalıştırma başarıyla sona erdiğinde              | Hayır (yalnızca günlüğe kaydedilir)     |
| `run_failed`           | Bir alt çalıştırma başarısız olduğunda, zaman aşımına uğradığında veya iptal edildiğinde | Hayır (yalnızca günlüğe kaydedilir)     |
| `compacted`            | Oturumun geçmişi sıkıştırıldığında                       | Hayır (yalnızca günlüğe kaydedilir)     |
| `adopted`              | Bir katalog oturumu OpenClaw'a benimsendiğinde           | Hayır (yalnızca günlüğe kaydedilir)     |

Her olay, aktörünü (`human`, `agent` veya `system`) belirtir. İptal edilen ve zaman aşımına uğrayan alt çalıştırmalar, kesin sonuç (`cancelled`, `timeout` veya `error`) olay yükünde korunarak başarısızlık olarak kaydedilir.

Bir oturumun **durum sürümü**, günlüğündeki en yüksek sıra numarasıdır ve budama sonrasında da korunan, oturuma özel kalıcı bir başlıkta izlenir. `sessions_list` satırları, bir oturumda günlüğe kaydedilmiş değişiklikler varsa `stateVersion` değerini içerir; `session_status` bunu her zaman bildirir.

Yalnızca günlüğe kaydedilen türler bildirim için değil, uzlaştırma geçmişi için bulunur: olağan alt çalıştırma tamamlanma teslimatı [alt ajan duyurularının](/tr/tools/subagents) sorumluluğunda kalır ve sinyal günlüğü bunu asla çoğaltmaz.

## İzleyiciler

İzleyici, bir hedef üzerinde imleç (`session_watch_cursors`) tutan oturumdur. İmleçler iki kaynaktan gelir:

- **Örtük (oluşturma kenarları).** Bir oturum bir alt ajan veya ACP alt oturumu oluşturduğunda, üst oturumun imleci otomatik olarak alt oturumun oluşturulma sürümünde başlangıç konumuna getirilir. Üst oturumlar hiçbir zaman elle abone olmaz.
- **Açık (`sessions_send watch: true`).** Herhangi bir koordinatör, oluşturmadığı bir hedefi izleyebilir: `sessions_send` üzerinde `watch: true` değerini iletin; gönderim başarıyla dağıtıldıktan sonra gönderen, iletiyi gerçekten alan oturumun izleyicisi olarak kaydedilir. Kayıt, hedefin geçerli durum sürümünden başlar; önceki geçmiş hiçbir zaman bildirim üretmez. Araç sonucu, parametre ayarlandığında `watched: true|false` değerini bildirir.

İzleyici kimliği, ajan nitelemeli bir oturum anahtarı olmalıdır. `session.scope="global"` altında paylaşılan `global` anahtarı ajanlar arasında belirsizdir; bu nedenle bu tür oturumlar kalıcı günlüğü ve `changesSince` değerini alır ancak proaktif bildirim almaz.

İzlemeler kendi kendini temizler: imleç satırlarının süresi sinyal günlüğü saklama süresiyle birlikte dolar, izleyici oturumu sıfırlandığında kaldırılır ve oturumlardan herhangi biriyle birlikte silinir. v1'de izlemeyi bırakma fiili yoktur.

Bir oturum kataloğundan benimsenen izlenen oturumlar, sabit bir sıklıkta doğrudan üst kaynak insan etkinliği açısından kontrol edilir. Algılanan etkinlik, diğer doğrudan insan turlarıyla aynı sinyal günlüğüne ve izleyici akışına girer.

Benimsenmiş bir oturumun üst kaynağı harici olarak silinirse, art arda üç başarısız kontrol (yaklaşık üç izleme döngüsü), izleyicileri için bir `upstream_missing` sinyali üretir ve üst kaynak bağlantısını kaldırır. Katalog oturumunu yeniden sürdürmek yeni bir bağlantı oluşturur.

## Bildirimler: çok değil, bir tane

Bildirim için uygun bir olay gerçekleştiğinde ve izleyicinin imleci geride kaldığında, izleyici bir sonraki turunda tek bir sistem bildirimi alır:

```
"agent:main:subagent:child" oturumu değişti (başka aktör). Harekete geçmeden önce uzlaştırın: session_status sessionKey "agent:main:subagent:child" changesSince 12.
```

Ana oturum izleyicileri ayrıca bir Heartbeat uyandırmasıyla hemen uyandırılır; iç içe geçmiş alt ajan izleyicileri bildirimi bir sonraki turlarında alır.

Protokol, istenmeyen bildirimleri önlemek üzere bilinçli olarak tasarlanmıştır:

- **İzleyici/hedef çifti başına bekleyen tek bildirim.** Bildirim metni beklerken bayt düzeyinde sabit kalır ve sistem olayı kuyruğu bu metne göre yinelenenleri kaldırır; dolayısıyla aynı hedefteki yirmi hızlı değişiklik bile izleyicinin isteminde tek bir satır üretir.
- **Dondurulmuş filigran.** Bir bildirim kuyruğa alındığında imleç, bildirilen konumunu dondurur. Sonraki önemli olaylar yalnızca önemli değişiklik filigranını ilerletir; yeniden bildirim oluşturmaz.
- **Boşaltma sırasında onayla, yalnızca araya giren çalışmalar için yeniden aç.** İzleyicinin turu bildirimi tükettiğinde imleç ilerler. Kuyruğa alma ile boşaltma arasında daha fazla önemli olay geldiyse, kalan bölüm için tam olarak bir yeni bildirim açılır.
- **Kendini engelleme.** Bir izleyici, kendisinin neden olduğu olaylar hakkında hiçbir zaman bildirim almaz.
- **Yeniden başlatma kurtarması.** Bekleyen bildirimler bellek içi bir kuyrukta bulunur; başlangıç taraması, bir Gateway yeniden başlatıldıktan sonra bunları kalıcı imleçlerden yeniden oluşturur.

## Uzlaştırma

Bildirim, izleyiciye tam olarak ne yapması gerektiğini söyler. `changesSince: <version>` ile `session_status`, hiçbir imleci ilerletmeden bu sürümden sonraki türü belirlenmiş olayları (en fazla 200) döndürür:

```json
{
  "stateVersion": 19,
  "stateChanges": {
    "events": [
      {
        "sequence": 14,
        "kind": "human_direct_message",
        "actorType": "human",
        "summary": "telegram üzerinden insan iletisi"
      },
      { "sequence": 19, "kind": "goal_changed", "actorType": "human", "summary": "hedef güncellendi" }
    ],
    "historyGap": false
  }
}
```

`historyGap: true`, istenen sürümün saklanan geçmişten daha eski olduğu anlamına gelir; yanıtı kesin bir fark olarak değerlendirmek yerine tüm oturum durumunu (`sessions_history`, `session_status`) yenileyin. Boşluk sinyali kesindir: sıra numarası aritmetiğinden çıkarılmaz, oturuma özel budanmış bir filigrandan gelir.

## Depolama ve sınırlar

Geçmiş, paylaşılan durum veritabanında tutulur ve 30 gün ile 50.000 satırla sınırlandırılır; oturum başlıkları budama sonrasında monoton kalır. Kayıt en iyi gayret esasına göre yapılır; başarısız bir ekleme günlüğe kaydedilir ve kaynak turu hiçbir zaman başarısızlığa uğratmaz. Bu nedenle `stateVersion`, işlemsel bir değişiklik verisi yakalama sürümü değil, bir sinyal günlüğü başlığıdır.

Geçerli sınırlar:

- Bildirim teslimatı, paylaşılan durum veritabanının tek bir Gateway işlemi tarafından yönetildiğini varsayar. Birden fazla Gateway kalıcı günlüğü ve `changesSince` değerini paylaşır ancak v1, bildirimleri işlemler arasında göndermez.
- Compaction olayları gömülü çalışma zamanının Compaction sahiplerini kapsar; yalnızca yerel donanımda gerçekleşen Compaction tam olarak günlüğe kaydedilmez.
- İptal edilen sonuç yükünün ayrıntıları şu anda ACP alt çalıştırmaları tarafından üretilir; yerel alt ajan iptalleri genel başarısızlıklar olarak gösterilir.
- Üst kaynak öz yankı algılaması, normalleştirilmiş kullanıcı metnini karşılaştırır. Oturumun OpenClaw tarafındaki en son 10 kullanıcı iletisinden biriyle eşleşen harici bir istem, öz yankı olarak değerlendirilir.
- Her sıklık döngüsü için 1 MiB tarama sınırından büyük tek bir yerel Claude JSONL satırı, v1'de ilgili oturumun imlecini engeller; sınıflandırılmamış baytlar asla atlanmaz.
- Eşleştirilmiş Node Claude kontrolleri, her sıklık döngüsünde en son 50 transkript öğesini sınıflandırır. Daha büyük artışlar v1 tarama penceresinin dışında kalabilir.
- Eşleştirilmiş Node Claude geçmiş okumaları kesin bir iş parçacığı bulunamadı sonucu sunmaz; bu nedenle uzaktaki Claude silmeleri v1'de `upstream_missing` olarak sınıflandırılmaz.
- Benimsenmemiş katalog oturumları v1'de farkındalık katmanının dışında kalır.
- Bu özellikten önce benimsenen oturumlar üst kaynak bağlantısı taşımaz; üst kaynak izlemeyi başlatmak için bunları katalogdan bir kez sürdürün.
- Üst kaynak bağlantıları, benimsenen her oturum anahtarının tek bir sahip ajana eşlendiğini varsayar (benimseme, varsayılan depo ajanını kullanır). Aynı harici iş parçacığının birden fazla ajan tarafından benimsenmesi v1'de izlenmez.

## İlgili konular

- [Oturum araçları](/tr/concepts/session-tool) — `sessions_send`, `session_status`, `sessions_list`
- [Alt ajanlar](/tr/tools/subagents) — oluşturma kenarları ve tamamlanma duyuruları
- [Heartbeat](/tr/gateway/heartbeat) — kuyruğa alınan bildirimlerin ana oturumları nasıl uyandırdığı
- [Oturum yönetimi](/tr/concepts/session) — oturum anahtarları, kapsamlar, yaşam döngüsü
