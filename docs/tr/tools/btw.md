---
read_when:
    - Geçerli oturum hakkında hızlı bir yan soru sormak istiyorsanız
    - İstemciler arasında BTW davranışını uyguluyor veya hata ayıklıyorsanız
summary: /btw ile geçici yan sorular
title: BTW Yan Soruları
x-i18n:
    generated_at: "2026-04-05T14:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# BTW Yan Soruları

`/btw`, **geçerli oturum** hakkında hızlı bir yan soru sormanıza olanak tanır; bu soru normal konuşma geçmişinin bir parçası haline gelmez.

Bu davranış, Claude Code’un `/btw` davranışını temel alır, ancak OpenClaw’un
Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. araçsız ayrı bir model çağrısı çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalıştırmayı olduğu gibi bırakır,
5. BTW sorusunu veya yanıtını oturum geçmişine yazmaz,
6. yanıtı normal bir asistan mesajı yerine **canlı yan sonuç** olarak yayınlar.

Hatırda tutulması gereken önemli model şudur:

- aynı oturum bağlamı
- ayrı tek seferlik yan sorgu
- araç çağrısı yok
- gelecekteki bağlamı kirletme yok
- döküm kalıcılığı yok

## Ne yapmaz

`/btw` şunları **yapmaz**:

- yeni kalıcı bir oturum oluşturmaz,
- tamamlanmamış ana görevi sürdürmez,
- araçları veya ajan araç döngülerini çalıştırmaz,
- BTW soru/yanıt verilerini döküm geçmişine yazmaz,
- `chat.history` içinde görünmez,
- yeniden yüklemeden sonra kalmaz.

Kasıtlı olarak **geçicidir**.

## Bağlam nasıl çalışır

BTW, geçerli oturumu yalnızca **arka plan bağlamı** olarak kullanır.

Ana çalıştırma şu anda etkinse, OpenClaw geçerli mesaj durumunun anlık görüntüsünü alır
ve işlemdeki ana istemi arka plan bağlamı olarak dahil eder; aynı zamanda modele açıkça şunu söyler:

- yalnızca yan soruyu yanıtla,
- tamamlanmamış ana görevi sürdürme veya tamamlama,
- araç çağrıları veya sahte araç çağrıları üretme.

Bu, BTW’yi ana çalıştırmadan yalıtırken oturumun ne hakkında olduğunu
bilmesini de sağlar.

## Teslim modeli

BTW, normal bir asistan döküm mesajı olarak teslim edilmez.

Gateway protokol düzeyinde:

- normal asistan sohbeti `chat` olayı kullanır
- BTW ise `chat.side_result` olayını kullanır

Bu ayrım kasıtlıdır. BTW normal `chat` olay yolunu yeniden kullansaydı,
istemciler bunu normal konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve
`chat.history` içinden yeniden oynatılmadığı için, yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI içinde BTW, geçerli oturum görünümünde satır içi işlenir, ancak
geçici kalır:

- normal bir asistan yanıtından görünür şekilde farklıdır
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede tekrar oynatılmaz

### Harici kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW,
yerel geçici kaplama kavramı olmadığından açıkça etiketlenmiş tek seferlik bir yanıt olarak teslim edilir.

Yanıt yine de normal oturum geçmişi değil, yan sonuç olarak ele alınır.

### Control UI / web

Gateway, BTW’yi `chat.side_result` olarak doğru şekilde yayınlar ve BTW
`chat.history` içine dahil edilmez; dolayısıyla kalıcılık sözleşmesi web için zaten doğrudur.

Mevcut Control UI’nin BTW’yi
tarayıcıda canlı işlemek için hâlâ özel bir `chat.side_result` tüketicisine ihtiyacı vardır. Bu istemci tarafı destek gelene kadar BTW,
tam TUI ve harici kanal davranışına sahip bir Gateway düzeyi özelliktir, ancak henüz
tam bir tarayıcı UX’i değildir.

## BTW ne zaman kullanılmalı

Şunları istediğinizde `/btw` kullanın:

- mevcut iş hakkında hızlı bir açıklama,
- uzun bir çalıştırma hâlâ sürerken olgusal bir yan yanıt,
- gelecekteki oturum bağlamının parçası olmaması gereken geçici bir yanıt.

Örnekler:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW ne zaman kullanılmamalı

Yanıtın oturumun
gelecekteki çalışma bağlamının parçası olmasını istiyorsanız `/btw` kullanmayın.

Bu durumda BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

- [Slash commands](/tools/slash-commands)
- [Thinking Levels](/tools/thinking)
- [Session](/tr/concepts/session)
