---
read_when:
    - Geçerli oturum hakkında kısa bir yan soru sormak istiyorsunuz
    - İstemciler genelinde BTW davranışını uyguluyor veya hata ayıklıyorsunuz
summary: /btw ile geçici yan sorular
title: Bu arada yan sorular
x-i18n:
    generated_at: "2026-05-03T21:38:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw`, **geçerli oturum** hakkında hızlı bir yan soru sormanızı sağlar; bu
soruyu normal konuşma geçmişine dönüştürmez. `/side` bir takma addır.

Claude Code'un `/btw` davranışına göre modellenmiştir, ancak OpenClaw'ın
Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar?

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. ayrı bir **araçsız** model çağrısı çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalıştırmayı kendi halinde bırakır,
5. BTW sorusunu veya yanıtını oturum geçmişine **yazmaz**,
6. yanıtı normal bir asistan mesajı yerine **canlı yan sonuç** olarak yayar.

Önemli zihinsel model şudur:

- aynı oturum bağlamı
- ayrı, tek seferlik yan sorgu
- araç çağrısı yok
- gelecekteki bağlamı kirletme yok
- transkript kalıcılığı yok

## Ne yapmaz?

`/btw` şunları **yapmaz**:

- yeni ve kalıcı bir oturum oluşturmaz,
- tamamlanmamış ana göreve devam etmez,
- araçları veya agent araç döngülerini çalıştırmaz,
- BTW soru/yanıt verilerini transkript geçmişine yazmaz,
- `chat.history` içinde görünmez,
- yeniden yüklemeden sonra kalıcı olmaz.

Bilinçli olarak **geçicidir**.

## Bağlam nasıl çalışır?

BTW geçerli oturumu yalnızca **arka plan bağlamı** olarak kullanır.

Ana çalıştırma o anda etkinse OpenClaw geçerli mesaj durumunun anlık
görüntüsünü alır ve işlemdeki ana istemi arka plan bağlamı olarak dahil eder;
bu sırada modele açıkça şunları söyler:

- yalnızca yan soruyu yanıtla,
- tamamlanmamış ana görevi sürdürme veya tamamlama,
- araç çağrıları veya sözde araç çağrıları yayma.

Bu, BTW'yi ana çalıştırmadan yalıtılmış tutarken yine de oturumun ne hakkında
olduğunun farkında olmasını sağlar.

## Teslim modeli

BTW normal bir asistan transkript mesajı olarak teslim **edilmez**.

Gateway protokol düzeyinde:

- normal asistan sohbeti `chat` olayını kullanır
- BTW `chat.side_result` olayını kullanır

Bu ayrım bilinçlidir. BTW normal `chat` olay yolunu yeniden kullansaydı,
istemciler onu normal konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve `chat.history` içinden yeniden
oynatılmadığı için yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI'de BTW geçerli oturum görünümünde satır içi işlenir, ancak geçici kalır:

- normal bir asistan yanıtından görsel olarak ayırt edilir
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede tekrar oynatılmaz

### Harici kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW açıkça etiketlenmiş tek
seferlik bir yanıt olarak teslim edilir; çünkü bu yüzeylerde yerel geçici
katman kavramı yoktur.

Yanıt yine de normal oturum geçmişi değil, bir yan sonuç olarak ele alınır.

### Control UI / web

Gateway, BTW'yi `chat.side_result` olarak doğru şekilde yayar ve BTW
`chat.history` içine dahil edilmez; bu nedenle kalıcılık sözleşmesi web için
zaten doğrudur.

Mevcut Control UI'nin BTW'yi tarayıcıda canlı işlemek için hâlâ özel bir
`chat.side_result` tüketicisine ihtiyacı vardır. Bu istemci tarafı destek
gelene kadar BTW, tam TUI ve harici kanal davranışına sahip Gateway düzeyinde
bir özelliktir, ancak henüz eksiksiz bir tarayıcı UX'i değildir.

## BTW ne zaman kullanılır?

Şunları istediğinizde `/btw` kullanın:

- geçerli çalışma hakkında hızlı bir açıklama,
- uzun bir çalıştırma hâlâ sürerken olgusal bir yan yanıt,
- gelecekteki oturum bağlamının parçası olmaması gereken geçici bir yanıt.

Örnekler:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW ne zaman kullanılmamalı?

Yanıtın oturumun gelecekteki çalışma bağlamının parçası olmasını istiyorsanız
`/btw` kullanmayın.

Bu durumda BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

- [Eğik çizgi komutları](/tr/tools/slash-commands)
- [Düşünme Düzeyleri](/tr/tools/thinking)
- [Oturum](/tr/concepts/session)
