---
read_when:
    - Geçerli oturum hakkında hızlı bir yan soru sormak istiyorsunuz
    - BTW davranışını istemciler genelinde uyguluyor veya hata ayıklıyorsunuz
summary: /btw ile geçici yan sorular
title: Bu arada yan sorular
x-i18n:
    generated_at: "2026-06-28T01:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw`, **geçerli oturum** hakkında hızlı bir yan soru sormanızı sağlar; bu soru normal konuşma geçmişine dönüştürülmez. `/side` bir takma addır.

Claude Code'un `/btw` davranışı model alınmıştır, ancak OpenClaw'ın Gateway ve çok kanallı mimarisine uyarlanmıştır.

## Ne yapar?

Şunu gönderdiğinizde:

```text
/btw what changed?
```

OpenClaw:

1. geçerli oturum bağlamının anlık görüntüsünü alır,
2. ayrı, geçici bir yan sorgu çalıştırır,
3. yalnızca yan soruyu yanıtlar,
4. ana çalışmayı değiştirmez,
5. BTW sorusunu veya yanıtını oturum geçmişine yazmaz,
6. yanıtı normal bir asistan iletisi yerine **canlı yan sonuç** olarak yayar.

Önemli zihinsel model şudur:

- aynı oturum bağlamı
- ayrı, tek seferlik yan sorgu
- oturum yerel bir harness kullandığında aynı yerel harness aktarımı
- gelecekteki bağlam kirlenmesi yok
- transcript kalıcılığı yok

Codex harness oturumlarında BTW, etkin app-server iş parçacığını geçici bir yan iş parçacığı olarak çatallayarak Codex içinde kalır. Bu, yanıtı üst transcript'ten yalıtırken Codex OAuth ve yerel iş parçacığı davranışını korur. Codex `/side` gibi, yan iş parçacığı geçerli Codex izinlerini ve yerel araç yüzeyini korur; ayrıca modele, devralınan üst iş parçacığı çalışmasını etkin talimatlar olarak ele almamasını söyleyen koruma sınırları içerir.

CLI çalışma zamanı takma adlarında BTW, doğrudan sağlayıcı çağrısına geri dönmek yerine yan soru modunda sahip olan CLI arka ucunu kullanır. OpenClaw, temizlenmiş konuşma bağlamını yeni, tek seferlik bir CLI çağrısına aktarır, bu çağrı için OpenClaw MCP araç paketlemeyi ve yeniden kullanılabilir CLI oturum durumunu devre dışı bırakır ve arka ucun desteklediği CLI'ye özgü no-resume veya no-tools bayraklarını eklemesine izin verir. Doğrudan CLI olmayan çalışma zamanları, doğrudan tek seferlik yolu korur.

## Ne yapmaz?

`/btw` şunları **yapmaz**:

- yeni kalıcı bir oturum oluşturmaz,
- bitmemiş ana görevi sürdürmez,
- BTW soru/yanıt verilerini transcript geçmişine yazmaz,
- `chat.history` içinde görünmez,
- yeniden yüklemeden sonra kalmaz.

Bilinçli olarak **geçicidir**.

## Bağlam nasıl çalışır?

BTW, geçerli oturumu yalnızca **arka plan bağlamı** olarak kullanır.

Ana çalışma şu anda etkinse OpenClaw, geçerli ileti durumunun anlık görüntüsünü alır ve sürmekte olan ana istemi arka plan bağlamı olarak dahil eder; aynı zamanda modele açıkça şunları söyler:

- yalnızca yan soruyu yanıtla,
- bitmemiş ana görevi sürdürme veya tamamlama,
- üst konuşmayı yönlendirme.

Bu, BTW'yi ana çalışmadan yalıtılmış tutarken oturumun neyle ilgili olduğundan haberdar olmasını sağlar.

## Teslim modeli

BTW, normal bir asistan transcript iletisi olarak teslim **edilmez**.

Gateway protokol düzeyinde:

- normal asistan sohbeti `chat` olayını kullanır
- BTW `chat.side_result` olayını kullanır

Bu ayrım bilinçlidir. BTW normal `chat` olay yolunu yeniden kullansaydı istemciler onu normal konuşma geçmişi gibi ele alırdı.

BTW ayrı bir canlı olay kullandığı ve `chat.history` üzerinden yeniden oynatılmadığı için yeniden yüklemeden sonra kaybolur.

## Yüzey davranışı

### TUI

TUI içinde BTW, geçerli oturum görünümünde satır içi işlenir, ancak geçici kalır:

- normal bir asistan yanıtından görsel olarak ayırt edilebilir
- `Enter` veya `Esc` ile kapatılabilir
- yeniden yüklemede yeniden oynatılmaz

### Dış kanallar

Telegram, WhatsApp ve Discord gibi kanallarda BTW, bu yüzeylerde yerel geçici katman kavramı olmadığı için açıkça etiketlenmiş tek seferlik bir yanıt olarak teslim edilir.

Yanıt yine normal oturum geçmişi değil, bir yan sonuç olarak ele alınır.

### Control UI / web

Gateway, BTW'yi doğru biçimde `chat.side_result` olarak yayar ve BTW `chat.history` içine dahil edilmez; bu nedenle kalıcılık sözleşmesi web için zaten doğrudur.

Geçerli Control UI, BTW'yi tarayıcıda canlı işlemek için hâlâ özel bir `chat.side_result` tüketicisine ihtiyaç duyar. Bu istemci tarafı desteği gelene kadar BTW, tam TUI ve dış kanal davranışına sahip Gateway düzeyinde bir özelliktir, ancak henüz eksiksiz bir tarayıcı UX'i değildir.

## BTW ne zaman kullanılır?

Şunları istediğinizde `/btw` kullanın:

- geçerli çalışma hakkında hızlı bir açıklama,
- uzun bir çalışma hâlâ sürerken olgusal bir yan yanıt,
- gelecekteki oturum bağlamının parçası olmaması gereken geçici bir yanıt.

Örnekler:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW ne zaman kullanılmamalıdır?

Yanıtın oturumun gelecekteki çalışma bağlamının parçası olmasını istiyorsanız `/btw` kullanmayın.

Bu durumda, BTW kullanmak yerine ana oturumda normal şekilde sorun.

## İlgili

<CardGroup cols={2}>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="terminal">
    Yerel komut kataloğu ve sohbet yönergeleri.
  </Card>
  <Card title="Thinking levels" href="/tr/tools/thinking" icon="brain">
    Yan soru model çağrısı için akıl yürütme efor düzeyleri.
  </Card>
  <Card title="Session" href="/tr/concepts/session" icon="comments">
    Oturum anahtarları, geçmiş ve kalıcılık semantiği.
  </Card>
  <Card title="Steer command" href="/tr/tools/steer" icon="arrow-right">
    Etkin çalışmayı sonlandırmadan içine bir yönlendirme iletisi enjekte edin.
  </Card>
</CardGroup>
