---
read_when:
    - Geçerli oturum hakkında hızlı bir yan soru sormak istiyorsunuz
    - İstemciler arasında BTW davranışını uyguluyor veya hata ayıklıyorsunuz
summary: '`/btw` ile geçici yan sorular'
title: BTW yan soruları
x-i18n:
    generated_at: "2026-04-24T09:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw`, normal konuşma geçmişine dönüştürmeden **geçerli oturum** hakkında
hızlı bir yan soru sormanızı sağlar.

Claude Code’un `/btw` davranışını temel alır, ancak OpenClaw’ın
Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. ayrı bir **araçsız** model çağrısı çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalışmayı olduğu gibi bırakır,
5. BTW sorusunu veya yanıtını oturum geçmişine **yazmaz**,
6. yanıtı normal bir asistan mesajı yerine **canlı bir yan sonuç** olarak yayınlar.

Önemli zihinsel model şudur:

- aynı oturum bağlamı
- ayrı bir tek seferlik yan sorgu
- araç çağrısı yok
- gelecekteki bağlamın kirlenmesi yok
- transkript kalıcılığı yok

## Ne yapmaz

`/btw` şunları **yapmaz**:

- yeni kalıcı bir oturum oluşturmaz,
- tamamlanmamış ana görevi sürdürmez,
- araçları veya ajan araç döngülerini çalıştırmaz,
- BTW soru/yanıt verisini transkript geçmişine yazmaz,
- `chat.history` içinde görünmez,
- yeniden yüklemeden sonra kalmaz.

Kasıtlı olarak **geçicidir**.

## Bağlam nasıl çalışır

BTW, geçerli oturumu yalnızca **arka plan bağlamı** olarak kullanır.

Ana çalışma şu anda etkinde ise OpenClaw, geçerli mesaj
durumunun anlık görüntüsünü alır ve uçuş hâlindeki ana istemi arka plan bağlamı olarak ekler; aynı zamanda modele açıkça şunları söyler:

- yalnızca yan soruyu yanıtla,
- tamamlanmamış ana görevi sürdürme veya tamamlama,
- araç çağrıları veya sözde araç çağrıları üretme.

Bu, BTW’yi ana çalışmadan yalıtırken yine de oturumun ne hakkında olduğunun
farkında olmasını sağlar.

## Teslim modeli

BTW, normal bir asistan transkript mesajı olarak **teslim edilmez**.

Gateway protokolü düzeyinde:

- normal asistan sohbeti `chat` olayını kullanır
- BTW, `chat.side_result` olayını kullanır

Bu ayrım kasıtlıdır. BTW normal `chat` olay yolunu yeniden kullansaydı,
istemciler onu normal konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve
`chat.history` içinden yeniden oynatılmadığı için yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI içinde BTW, geçerli oturum görünümünde satır içi olarak işlenir, ancak yine de
geçicidir:

- normal bir asistan yanıtından görünür biçimde farklıdır
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede yeniden oynatılmaz

### Harici kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW,
bu yüzeylerde yerel geçici kaplama kavramı bulunmadığı için
açıkça etiketlenmiş tek seferlik bir yanıt olarak teslim edilir.

Yanıt yine de normal oturum geçmişi değil, yan sonuç olarak ele alınır.

### Control UI / web

Gateway, BTW’yi `chat.side_result` olarak doğru şekilde yayınlar ve BTW
`chat.history` içine dahil edilmez; dolayısıyla kalıcılık sözleşmesi web için zaten doğrudur.

Geçerli Control UI, BTW’yi tarayıcıda canlı işlemek için hâlâ özel bir
`chat.side_result` tüketicisine ihtiyaç duyar. Bu istemci tarafı destek gelene kadar BTW,
tam TUI ve harici kanal davranışına sahip bir Gateway düzeyi özelliktir, ancak henüz
eksiksiz bir tarayıcı UX’i değildir.

## BTW ne zaman kullanılmalı

Şunları istediğinizde `/btw` kullanın:

- geçerli çalışma hakkında hızlı bir açıklama,
- uzun bir çalışma hâlâ sürerken olgusal bir yan yanıt,
- gelecekteki oturum bağlamının parçası olmaması gereken geçici bir yanıt.

Örnekler:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW ne zaman kullanılmamalı

Yanıtın oturumun gelecekteki çalışma bağlamının bir parçası olmasını istiyorsanız
`/btw` kullanmayın.

Bu durumda BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

- [Slash komutları](/tr/tools/slash-commands)
- [Düşünme Düzeyleri](/tr/tools/thinking)
- [Oturum](/tr/concepts/session)
