---
read_when:
    - Mac WebChat görünümünde veya local loopback bağlantı noktasında hata ayıklama
summary: Mac uygulamasının Gateway WebChat'i nasıl yerleştirdiği ve hata ayıklama yöntemleri
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T11:56:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS menü çubuğu uygulaması, WebChat kullanıcı arayüzünü yerel bir SwiftUI görünümü olarak içerir. Gateway'e bağlanır ve seçilen ajan için varsayılan olarak birincil oturumu kullanır (`main`; `session.scope`, `global` olduğunda ise `global`).

Tam sohbet penceresi, yerel bir bölünmüş görünümdür:

- **Oturumlar kenar çubuğu**: Sabitlenmiş ve son kullanılanlar bölümlerini, okunmamış göstergelerini ve sabitleme/sabitlemeyi kaldırma, oturum anahtarını kopyalama ve silme bağlam menülerini içeren aranabilir oturum listesi. Bir araç çubuğu düğmesi (veya Cmd-N), `sessions.create` aracılığıyla gerçek bir yeni oturum oluşturur.
- **Pencere araç çubuğu**: Bağlam kullanım halkası (belirteçler ve oturum maliyeti ile kompakt bir eylem), düşünme düzeyi seçici, model seçici ve oturum eylemleri menüsü (yeni oturum, yenileme, oturum anahtarını kopyalama, dökümü dışa aktarma, sıkıştırma, geçmişi temizleme).
- **Döküm ve oluşturucu**: Asistan iletileri avatarla birlikte düz metin, kullanıcı iletileri ise vurgu renkli baloncuklar olarak görüntülenir. `/` yazıldığında, `commands.list` tarafından desteklenen eğik çizgi komutu otomatik tamamlama özelliği açılır ve ok/Tab/Return/Escape tuşlarıyla klavye gezintisi sunar. Bir iletiyi kopyalamak için sağ tıklayın.

Menü çubuğundaki sabitlenmiş hızlı sohbet paneli, satır içi seçicilerle kompakt tek sütunlu düzeni korur.

- **Yerel mod**: Doğrudan yerel Gateway WebSocket'ine bağlanır.
- **Uzak mod**: Gateway denetim portunu SSH üzerinden iletir ve bu tüneli veri düzlemi olarak kullanır.

## Başlatma ve hata ayıklama

- Elle: Lobster menüsü -> "Open Chat".
- Test için otomatik açma:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat`, eski bir diğer ad olarak kabul edilir.)

- Günlükler: `./scripts/clawlog.sh` (alt sistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Bağlantı yapısı

- Veri düzlemi: Gateway WS yöntemleri `chat.history`, `chat.send`, `chat.abort`, `chat.inject` ve `chat`, `agent`, `presence`, `tick`, `health` olayları.
- `chat.history`, görüntüleme için normalleştirilmiş bir döküm döndürür: satır içi yönerge etiketleri görünür metinden çıkarılır; düz metin araç çağrısı XML yükleri (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, kesilmiş bloklar dâhil) ve açığa çıkmış model denetim belirteçleri kaldırılır; tam olarak `NO_REPLY`/`no_reply` gibi yalnızca sessizlik belirtecinden oluşan asistan satırları atlanır ve aşırı büyük satırlar kesilmiş bir yer tutucuyla değiştirilebilir.
- Oturum: Yukarıda belirtildiği gibi varsayılan olarak birincil oturumu kullanır; kullanıcı arayüzü oturumlar arasında geçiş yapabilir.
- İlk katılım, ilk çalıştırma kurulumunu ayrı tutmak için özel bir oturum kullanır.
- Çevrimdışı önbellek: Uygulama, Gateway başına son sohbet oturumlarının ve dökümlerin küçük, salt okunur bir önbelleğini tutar (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): soğuk açılışlarda son bilinen döküm hemen görüntülenir ve Gateway yanıt verdiğinde yenilenir; ayrıca bağlantı kesikken son sohbetlere göz atılabilir (bağlantı geri gelene kadar gönderme devre dışı kalır).

## Güvenlik yüzeyi

- Uzak mod, yalnızca Gateway WebSocket denetim portunu SSH üzerinden iletir.

## Bilinen sınırlamalar

- Kullanıcı arayüzü, tam kapsamlı bir tarayıcı korumalı alanı için değil, sohbet oturumları için optimize edilmiştir.

## İlgili içerikler

- [WebChat](/tr/web/webchat)
- [macOS uygulaması](/tr/platforms/macos)
