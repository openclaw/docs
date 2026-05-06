---
read_when:
    - Mevcut oturum hakkında hızlı bir ek soru sormak istiyorsunuz
    - İstemciler genelinde BTW davranışını uyguluyor veya hata ayıklıyorsunuz
summary: /btw ile geçici yan sorular
title: Bu arada yan sorular
x-i18n:
    generated_at: "2026-05-06T09:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw`, bu soruyu normal konuşma geçmişine dönüştürmeden **geçerli oturum** hakkında hızlı bir yan soru sormanızı sağlar. `/side` bir diğer addır.

Claude Code'un `/btw` davranışına göre modellenmiştir, ancak OpenClaw'ın Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. ayrı bir **araçsız** model çağrısı çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalıştırmayı olduğu gibi bırakır,
5. BTW sorusunu veya yanıtını oturum geçmişine yazmaz,
6. yanıtı normal bir asistan mesajı yerine **canlı bir yan sonuç** olarak yayar.

Önemli zihinsel model şudur:

- aynı oturum bağlamı
- ayrı tek seferlik yan sorgu
- araç çağrısı yok
- gelecekteki bağlamı kirletme yok
- transkript kalıcılığı yok

## Ne yapmaz

`/btw` şunları **yapmaz**:

- yeni kalıcı bir oturum oluşturmak,
- bitmemiş ana göreve devam etmek,
- araçları veya ajan araç döngülerini çalıştırmak,
- BTW soru/yanıt verilerini transkript geçmişine yazmak,
- `chat.history` içinde görünmek,
- yeniden yüklemeden sonra kalmak.

Bilinçli olarak **geçicidir**.

## Bağlam nasıl çalışır

BTW geçerli oturumu yalnızca **arka plan bağlamı** olarak kullanır.

Ana çalıştırma şu anda etkinse, OpenClaw geçerli mesaj durumunun anlık görüntüsünü alır ve devam eden ana istemi arka plan bağlamı olarak dahil eder; bu sırada modele açıkça şunları söyler:

- yalnızca yan soruyu yanıtla,
- bitmemiş ana görevi sürdürme veya tamamlama,
- araç çağrısı ya da sözde araç çağrısı yayma.

Bu, BTW'yi ana çalıştırmadan yalıtılmış tutarken yine de oturumun ne hakkında olduğundan haberdar olmasını sağlar.

## Teslim modeli

BTW normal bir asistan transkript mesajı olarak teslim **edilmez**.

Gateway protokolü düzeyinde:

- normal asistan sohbeti `chat` olayını kullanır
- BTW `chat.side_result` olayını kullanır

Bu ayrım bilinçlidir. BTW normal `chat` olay yolunu yeniden kullansaydı, istemciler onu düzenli konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve `chat.history` üzerinden yeniden oynatılmadığı için yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI'de BTW geçerli oturum görünümünde satır içinde işlenir, ancak geçici kalır:

- normal bir asistan yanıtından görsel olarak ayırt edilebilir
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede yeniden oynatılmaz

### Harici kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW, bu yüzeylerde yerel geçici katman kavramı olmadığı için açıkça etiketlenmiş tek seferlik bir yanıt olarak teslim edilir.

Yanıt yine de normal oturum geçmişi değil, bir yan sonuç olarak ele alınır.

### Denetim UI / web

Gateway, BTW'yi doğru şekilde `chat.side_result` olarak yayar ve BTW `chat.history` içinde yer almaz; bu nedenle kalıcılık sözleşmesi web için zaten doğrudur.

Geçerli Denetim UI'nin, BTW'yi tarayıcıda canlı işlemek için hâlâ özel bir `chat.side_result` tüketicisine ihtiyacı vardır. Bu istemci tarafı destek gelene kadar BTW, tam TUI ve harici kanal davranışına sahip Gateway düzeyinde bir özelliktir, ancak henüz eksiksiz bir tarayıcı kullanıcı deneyimi değildir.

## BTW ne zaman kullanılır

Şunları istediğinizde `/btw` kullanın:

- geçerli çalışma hakkında hızlı bir açıklama,
- uzun bir çalıştırma hâlâ devam ederken olgusal bir yan yanıt,
- gelecekteki oturum bağlamının parçası olmaması gereken geçici bir yanıt.

Örnekler:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW ne zaman kullanılmamalıdır

Yanıtın oturumun gelecekteki çalışma bağlamının parçası olmasını istiyorsanız `/btw` kullanmayın.

Bu durumda BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

<CardGroup cols={2}>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Düşünme seviyeleri" href="/tr/tools/thinking" icon="brain">
    Yan soru model çağrısı için muhakeme çabası seviyeleri.
  </Card>
  <Card title="Oturum" href="/tr/concepts/session" icon="comments">
    Oturum anahtarları, geçmiş ve kalıcılık semantiği.
  </Card>
  <Card title="Yönlendirme komutu" href="/tr/tools/steer" icon="arrow-right">
    Etkin çalıştırmaya, onu bitirmeden bir yönlendirme mesajı enjekte edin.
  </Card>
</CardGroup>
