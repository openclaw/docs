---
read_when:
    - Mevcut oturum hakkında hızlı bir yan soru sormak istiyorsunuz
    - İstemciler genelinde BTW davranışını uyguluyor veya hata ayıklıyorsunuz
summary: /btw ile geçici yan sorular
title: Bu arada yan sorular
x-i18n:
    generated_at: "2026-05-11T20:37:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw`, **geçerli oturum** hakkında hızlı bir yan soru sormanızı sağlar; bu soruyu
normal konuşma geçmişine dönüştürmez. `/side` bir takma addır.

Claude Code'un `/btw` davranışı model alınmıştır, ancak OpenClaw'ın
Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. ayrı bir geçici yan sorgu çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalıştırmayı olduğu gibi bırakır,
5. BTW sorusunu veya yanıtını oturum geçmişine **yazmaz**,
6. yanıtı normal bir asistan mesajı yerine **canlı yan sonuç** olarak yayar.

Önemli zihinsel model şudur:

- aynı oturum bağlamı
- ayrı tek seferlik yan sorgu
- oturum yerel bir harness kullandığında aynı yerel harness aktarımı
- gelecekteki bağlamın kirlenmemesi
- transkript kalıcılığı olmaması

Codex harness oturumları için BTW, etkin app-server iş parçacığını geçici bir
yan iş parçacığı olarak çatallayarak Codex içinde kalır. Bu, yan yanıtı üst
transkriptten izole etmeye devam ederken Codex OAuth ve yerel iş parçacığı
davranışını sağlam tutar. Codex `/side` gibi, yan iş parçacığı geçerli Codex
izinlerini ve yerel araç yüzeyini korur; ayrıca modele devralınan üst iş
parçacığı çalışmasını etkin talimatlar olarak ele almamasını söyleyen
koruyucu sınırlar içerir. Codex dışı çalışma zamanları daha eski doğrudan tek
seferlik yolu korur.

## Ne yapmaz

`/btw` şunları **yapmaz**:

- yeni kalıcı bir oturum oluşturmaz,
- tamamlanmamış ana görevi sürdürmez,
- BTW soru/yanıt verilerini transkript geçmişine yazmaz,
- `chat.history` içinde görünmez,
- yeniden yüklemeden sonra kalmaz.

Bu, kasıtlı olarak **geçicidir**.

## Bağlam nasıl çalışır

BTW, geçerli oturumu **yalnızca arka plan bağlamı** olarak kullanır.

Ana çalıştırma o anda etkinse OpenClaw geçerli mesaj durumunun anlık
görüntüsünü alır ve devam eden ana istemi arka plan bağlamı olarak dahil eder;
bunu yaparken modele açıkça şunları söyler:

- yalnızca yan soruyu yanıtla,
- tamamlanmamış ana görevi sürdürme veya tamamlama,
- üst konuşmayı yönlendirme.

Bu, BTW'yi ana çalıştırmadan izole tutarken oturumun ne hakkında olduğunun
farkında olmasını sağlar.

## Teslim modeli

BTW, normal bir asistan transkript mesajı olarak **teslim edilmez**.

Gateway protokolü düzeyinde:

- normal asistan sohbeti `chat` olayını kullanır
- BTW `chat.side_result` olayını kullanır

Bu ayrım kasıtlıdır. BTW normal `chat` olay yolunu yeniden kullansaydı,
istemciler onu düzenli konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve `chat.history` üzerinden yeniden
oynatılmadığı için yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI içinde BTW geçerli oturum görünümünde satır içi işlenir, ancak geçici
kalmaya devam eder:

- normal bir asistan yanıtından görsel olarak ayırt edilir
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede yeniden oynatılmaz

### Harici kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW, açıkça etiketlenmiş tek
seferlik bir yanıt olarak teslim edilir; çünkü bu yüzeylerde yerel geçici
katman kavramı yoktur.

Yanıt yine de normal oturum geçmişi değil, bir yan sonuç olarak ele alınır.

### Control UI / web

Gateway, BTW'yi `chat.side_result` olarak doğru şekilde yayar ve BTW
`chat.history` içine dahil edilmez; bu nedenle kalıcılık sözleşmesi web için
zaten doğrudur.

Mevcut Control UI, BTW'yi tarayıcıda canlı işlemek için hâlâ ayrılmış bir
`chat.side_result` tüketicisine ihtiyaç duyar. Bu istemci tarafı destek
gelene kadar BTW, tam TUI ve harici kanal davranışına sahip bir Gateway
düzeyi özelliğidir, ancak henüz eksiksiz bir tarayıcı UX'i değildir.

## BTW ne zaman kullanılır

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

## BTW ne zaman kullanılmamalı

Yanıtın oturumun gelecekteki çalışma bağlamının parçası olmasını istiyorsanız
`/btw` kullanmayın.

Bu durumda BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

<CardGroup cols={2}>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Thinking levels" href="/tr/tools/thinking" icon="brain">
    Yan soru model çağrısı için akıl yürütme çabası düzeyleri.
  </Card>
  <Card title="Session" href="/tr/concepts/session" icon="comments">
    Oturum anahtarları, geçmiş ve kalıcılık semantiği.
  </Card>
  <Card title="Steer command" href="/tr/tools/steer" icon="arrow-right">
    Etkin çalıştırmayı sonlandırmadan içine bir yönlendirme mesajı enjekte edin.
  </Card>
</CardGroup>
