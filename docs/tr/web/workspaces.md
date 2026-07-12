---
read_when:
    - Çalışma alanı sekmelerini ve widget'larını oluşturma veya yeniden düzenleme
    - Bir ajanın çalışma alanı oluşturmasına izin verme
    - Özel widget onay ve korumalı alan modelinin incelenmesi
summary: Kontrol Arayüzünde Ajan Tarafından Birleştirilebilir Çalışma Alanları
title: Çalışma alanları
x-i18n:
    generated_at: "2026-07-12T12:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

[Kontrol Arayüzü](/tr/web/control-ui) içindeki **Çalışma Alanları** sekmesi, sizin ve ajanlarınızın birlikte düzenlediği bir yüzeydir. Sekmeler, bileşenler, bunların 12 sütunlu bir ızgaradaki konumları ve veri bağlamalarının tümü tek bir belgede bulunur. Bu belgeyi düzenleyebilen her şey çalışma alanını oluşturabilir: siz, `openclaw workspaces` CLI veya `workspace_*` araçlarını çağıran bir ajan.

Her yazma işlemi aynı doğrulanmış yoldan geçer; böylece bir insanın düzeni ile bir ajanın düzeni birbirinden farklılaşamaz. Kabul edilen her yazma işlemi sürümü artırır ve `plugin.workspaces.changed` olayını yayınlar; dolayısıyla bir ajanın düzenlemesi, yeniden yükleme gerektirmeden zaten açık olan tarayıcıda görünür.

## Çalışma Alanlarını Etkinleştirme

Paketle birlikte gelen Çalışma Alanları Plugin'i varsayılan olarak devre dışıdır. Kontrol Arayüzünde **Pluginler** bölümünü açın, **Çalışma Alanları** öğesini bulun ve **Etkinleştir** seçeneğini belirleyin. CLI üzerinden de etkinleştirebilirsiniz:

```sh
openclaw plugins enable workspaces
```

Plugin'i etkinleştirmek **Çalışma Alanları** sekmesini ekler ve `openclaw workspaces` CLI ile `workspace_*` ajan araçlarını kullanılabilir hâle getirir. Devre dışı bırakmak, çalışma alanı veritabanını veya bileşen varlıklarını silmeden bu yüzeyleri kaldırır.

## Varsayılan çalışma alanı

İlk yüklemede bir **Genel Bakış** çalışma alanı sunulur: maliyet ve token kartları, örnek durumu, oturumlar, cron durumu ve etkinlik akışı. Bu, sıradan çalışma alanı içeriğidir; sürükleyebilir, daraltabilir, gizleyebilir veya silebilirsiniz.

## Yerleşik bileşenler

Dokuz güvenilir bileşen Plugin ile birlikte sunulur ve birinci taraf kullanıcı arayüzü olarak işlenir:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Bileşenler verileri **bağlamalar** aracılığıyla bildirir; verileri asla kendi başlarına getirmezler:

| Bağlama  | Çözümlendiği değer                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `static` | Belgede depolanan sabit bir değer (en fazla 8 KB).                                                              |
| `file`   | `<stateDir>/workspaces/data/` altındaki bir JSON, Markdown veya CSV dosyası; isteğe bağlı olarak JSON işaretçisiyle daraltılabilir. |
| `rpc`    | Güvenilir Kontrol Arayüzü tarafından çözümlenen, sabit bir salt okunur Gateway yöntemleri izin listesindeki yöntemlerden biri. |

`file` bağlaması, kendi sayılarınızı bir çalışma alanına yerleştirmenin en basit yoludur: veri dizinine bir JSON dosyası yazın ve bir `stat-card` öğesini ona yönlendirin.

## Kaynak bilgisi

Sekmeler ve bileşenler, yazma işlemini yapan kişiye göre ayarlanan bir `createdBy` damgası taşır: `user`, `system` veya `agent:<id>`. Bu değer çağıran tarafından sağlanamaz; dolayısıyla bir ajan kendi çalışmasını sizin çalışmanızmış gibi etiketleyemez ve ajan tarafından oluşturulan bir bileşendeki "AI" rozeti her zaman gerçekten bunu ifade eder.

## Özel bileşenler

Bir ajan, `workspace_widget_scaffold` ile gerçek bir HTML bileşeni oluşturabilir (veya siz `openclaw workspaces widget-scaffold <name>` ile oluşturabilirsiniz). Ajan tarafından oluşturulan kod düşmanca kabul edilir:

- İskeleti oluşturulan bir bileşen kayıt defterine **beklemede** durumuyla girer. Bir operatör onaylayana kadar iframe oluşturulmaz ve varlık rotası dosyaları için 404 döndürür.
- Onay, düzeni değiştirmekten ayrı bir karardır: `workspaces.widget.approve`, çalıştırma onaylarını koruyan kapsamla aynı olan `operator.approvals` kapsamını gerektirir.
- Onaylanmış bir bileşen `<iframe sandbox="allow-scripts">` içinde işlenir; `allow-same-origin` hiçbir zaman kullanılmaz. Böylece kökeni opaktır ve üst öğenin DOM'una, depolama alanına veya çerezlerine erişemez.
- Varlıkları `connect-src 'none'` ile sunulur; bu, `fetch`, XHR ve WebSockets gibi betik ağ iletişimini engeller. Herhangi bir kimlik bilgisi taşımaz ve Gateway ile hiçbir zaman iletişim kurmaz.
- Veriler bileşene yalnızca sürümlendirilmiş bir `postMessage` köprüsü üzerinden ulaşır. Özel kod, önceden ajan veya operatör tarafından çalışma alanında oluşturulmuş değerler olan bildirilmiş `static` bağlamalarını alabilir. RPC ve dosya bağlamaları güvenilir yerleşik bileşenlerde kalır: tarayıcılar korumalı alan içindeki bir alt öğenin kendi çerçevesinde gezinmesine izin verdiğinden ayrıcalıklı veriler hiçbir zaman ajan tarafından oluşturulan HTML'ye gönderilmez.

Bir bileşenden sohbete istem göndermek ayrıca bir bildirim yeteneği, tam metni alıntılayan çağrı başına onay ve hız sınırından geçmeyi gerektirir.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve`, `operator.approvals` kapsamıyla eşleştirilmiş bir cihaz gerektirir; Kontrol Arayüzünden onaylamak bunu gerektirmez çünkü tarayıcı bu kapsamı zaten taşır.

## Depolama

Çalışma alanı belgesi, özel bileşen kayıt defteri ve 20 girdilik geri alma halkası `<stateDir>/workspaces/workspaces.sqlite` içinde bulunur. Ajan tarafından oluşturulan bileşen varlıkları `<stateDir>/workspaces/widgets/<name>/` altında, dosya bağlama verileri ise `<stateDir>/workspaces/data/` altında diskte kalır; çünkü ajan bunları sıradan dosya araçlarıyla oluşturur ve bileşen rotası bunların baytlarını sunar.
