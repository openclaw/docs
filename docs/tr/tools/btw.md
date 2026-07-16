---
read_when:
    - Mevcut oturum hakkında kısa bir yan soru sormak istiyorsunuz
    - İstemciler genelinde BTW davranışını uyguluyor veya hata ayıklıyorsunuz
summary: /btw ile geçici yan sorular
title: Bu arada, yan sorular
x-i18n:
    generated_at: "2026-07-16T17:59:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (`/side` diğer adıyla), konuşma geçmişine eklemeden **geçerli
oturum** hakkında hızlı bir yan soru sorar. Claude Code'un `/btw` özelliği örnek alınarak
OpenClaw'ın Gateway ve çok kanallı mimarisine uyarlanmıştır.

```text
/btw ne değişti?
/side bu hata ne anlama geliyor?
```

## Ne yapar?

1. Geçerli oturumun anlık görüntüsünü arka plan bağlamı olarak alır (devam
   eden ana çalıştırma istemi dahil).
2. Modele yalnızca yan soruyu yanıtlamasını ve ana görevi sürdürmemesini veya
   yönlendirmemesini söyleyen ayrı, tek seferlik bir yan sorgu çalıştırır.
3. Yanıtı normal bir asistan mesajı olarak değil, canlı bir yan sonuç olarak iletir.
4. Soruyu veya yanıtı hiçbir zaman oturum geçmişine ya da `chat.history` içine yazmaz.

Etkin bir ana çalıştırma varsa buna dokunulmaz.

Codex çalışma düzeneği oturumlarında BTW, ayrı bir sağlayıcı çağrısı çalıştırmak
yerine etkin Codex uygulama sunucusu iş parçacığını geçici bir alt iş parçacığına
çatallar. Bu, Codex OAuth ile yerel araç/iş parçacığı davranışını korur ve çatallanan
iş parçacığı, üst iş parçacığının geçerli onay politikasını, korumalı alanını ve yerel
araç yüzeyini korur. Çatallanan iş parçacığı, modele kendisinden önceki her şeyin
etkin talimatlar değil, devralınmış başvuru bağlamı olduğunu ve yalnızca sınırdan
sonraki mesajların etkin olduğunu bildiren bir sınır istemi alır. `/btw` mevcut bir
Codex iş parçacığı gerektirir; önce normal bir mesaj gönderin.

CLI çalışma zamanı diğer adlarında BTW, sahibi olan CLI arka ucunu tek seferlik
yan soru modunda çağırır: temizlenmiş konuşma bağlamını, araç paketleme ve yeniden
kullanılabilir oturum durumu devre dışı bırakılmış yeni bir CLI çağrısına başlangıç
verisi olarak aktarır ve arka ucun desteklediği sürdürmeme/araç kullanmama bayraklarını
ekler. Doğrudan (CLI olmayan) çalışma zamanları bunun yerine doğrudan, tek seferlik
bir sağlayıcı çağrısı kullanır.

## Ne yapmaz?

`/btw` kalıcı bir oturum oluşturmaz, tamamlanmamış ana görevi sürdürmez,
soru/yanıt verilerini döküm geçmişinde kalıcı hâle getirmez veya yeniden yüklemeden
sonra varlığını sürdürmez.

## İletim modeli

Normal asistan sohbeti Gateway `chat` olayını kullanır. BTW ise istemcilerin bunu
normal konuşma geçmişiyle karıştırmaması için ayrı bir `chat.side_result` olayı
kullanır. `chat.history` üzerinden yeniden oynatılmadığından, yeniden yüklemeden
sonra kaybolur.

## Yüzey davranışı

| Yüzey             | Davranış                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Sohbet günlüğünde satır içinde, normal bir yanıttan görünür biçimde farklı olarak oluşturulur; `Enter` veya `Esc` ile kapatılabilir.                                                                                                                                                                           |
| Harici kanallar   | Açıkça etiketlenmiş tek seferlik bir yanıt olarak iletilir (Telegram, WhatsApp ve Discord'da yerel geçici katman yoktur).                                                                                                                                                                         |
| Control UI / web  | İş parçacığına sabitlenmiş, kayan bir "Yan sohbet" paneli olarak oluşturulur. Yanıtlar konuşma turları olarak birikir ve "Takip sorusu" girişi sonraki yan soruyu sorar. Kapatmak (`Esc` veya X) konuşmayı korur ve sonraki yanıtta yeniden açar; çöp kutusu düğmesi konuşmayı siler ve bekleyen bir çalıştırmayı durdurur. |

## Seçim açılır penceresi (Control UI)

Control UI'daki bir sohbet mesajında metin vurgulandığında iki eylem içeren küçük
bir seçim açılır penceresi görüntülenir:

- **Daha fazla ayrıntı** seçeneği, modelden vurgulanan metni geçerli
  oturum bağlamında açıklamasını isteyen örtük bir `/btw` sorusunu hemen gönderir.
  Yanıt, kayan yan sohbet panelinde görüntülenir.
- **Yan sohbette sor** seçeneği, vurgulanan metni alıntılayan bir
  `/btw` taslağını düzenleyiciye önceden doldurur; böylece metin hakkında kendi sorunuzu yazabilirsiniz.

Her iki eylem de normal `/btw` anlam kurallarına uyar: soru ve yanıt oturum
geçmişinin dışında kalır ve ana çalıştırmaya dokunulmaz.

## Ne zaman kullanılmalı?

`/btw` özelliğini hızlı bir açıklama, uzun bir çalıştırma hâlâ devam ederken
olgusal bir yanıt veya gelecekteki oturum bağlamına girmemesi gereken geçici bir
yanıt için kullanın.

```text
/btw hangi dosyayı düzenliyoruz?
/btw geçerli görevi tek cümlede özetle
/btw 17 * 19 kaçtır?
```

Oturumun gelecekteki çalışma bağlamının bir parçası olmasını istediğiniz her şeyi
bunun yerine ana oturumda normal şekilde sorun.

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Düşünme düzeyleri" href="/tr/tools/thinking" icon="brain">
    Yan soru model çağrısının akıl yürütme çabası düzeyleri.
  </Card>
  <Card title="Oturum" href="/tr/concepts/session" icon="comments">
    Oturum anahtarları, geçmiş ve kalıcılık anlam kuralları.
  </Card>
  <Card title="Yönlendirme komutu" href="/tr/tools/steer" icon="arrow-right">
    Etkin çalıştırmayı sonlandırmadan buna bir yönlendirme mesajı ekleyin.
  </Card>
</CardGroup>
