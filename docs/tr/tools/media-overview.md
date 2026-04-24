---
read_when:
    - Medya yeteneklerine genel bakış arıyorsunuz
    - Hangi medya sağlayıcısını yapılandıracağınıza karar verme
    - Eşzamansız medya üretiminin nasıl çalıştığını anlama
summary: Medya üretimi, anlama ve speech yetenekleri için birleşik açılış sayfası
title: Medya genel bakışı
x-i18n:
    generated_at: "2026-04-24T09:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Medya Üretimi ve Anlama

OpenClaw görüntü, video ve müzik üretir; gelen medyayı (görüntü, ses, video) anlar ve metinden konuşmaya ile yanıtları sesli olarak okur. Tüm medya yetenekleri araç güdümlüdür: aracı bunları konuşmaya göre ne zaman kullanacağına karar verir ve her araç yalnızca en az bir destekleyici sağlayıcı yapılandırıldığında görünür.

## Yeteneklere hızlı bakış

| Yetenek              | Araç             | Sağlayıcılar                                                                                  | Ne yapar                                                |
| -------------------- | ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Görüntü üretimi      | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                             | Metin istemlerinden veya başvurulardan görüntü oluşturur ya da düzenler |
| Video üretimi        | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Metinden, görüntülerden veya mevcut videolardan video oluşturur |
| Müzik üretimi        | `music_generate` | ComfyUI, Google, MiniMax                                                                      | Metin istemlerinden müzik veya ses parçaları oluşturur  |
| Metinden konuşmaya (TTS) | `tts`         | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                   | Giden yanıtları konuşulan sese dönüştürür               |
| Medya anlama         | (otomatik)       | Görüntü/ses yetenekli herhangi bir model sağlayıcısı, artı CLI geri dönüşleri                 | Gelen görüntüleri, sesleri ve videoları özetler         |

## Sağlayıcı yetenek matrisi

Bu tablo, platform genelinde hangi sağlayıcıların hangi medya yeteneklerini desteklediğini gösterir.

| Sağlayıcı  | Görüntü | Video | Müzik | TTS | STT / Transcription | Medya Anlama |
| ---------- | ------- | ----- | ----- | --- | ------------------- | ------------ |
| Alibaba    |         | Evet  |       |     |                     |              |
| BytePlus   |         | Evet  |       |     |                     |              |
| ComfyUI    | Evet    | Evet  | Evet  |     |                     |              |
| Deepgram   |         |       |       |     | Evet                |              |
| ElevenLabs |         |       |       | Evet | Evet               |              |
| fal        | Evet    | Evet  |       |     |                     |              |
| Google     | Evet    | Evet  | Evet  |     |                     | Evet         |
| Microsoft  |         |       |       | Evet |                    |              |
| MiniMax    | Evet    | Evet  | Evet  | Evet |                    |              |
| Mistral    |         |       |       |     | Evet                |              |
| OpenAI     | Evet    | Evet  |       | Evet | Evet               | Evet         |
| Qwen       |         | Evet  |       |     |                     |              |
| Runway     |         | Evet  |       |     |                     |              |
| Together   |         | Evet  |       |     |                     |              |
| Vydra      | Evet    | Evet  |       |     |                     |              |
| xAI        | Evet    | Evet  |       | Evet | Evet               | Evet         |

<Note>
Medya anlama, sağlayıcı yapılandırmanızda kayıtlı görüntü yetenekli veya ses yetenekli herhangi bir modeli kullanır. Yukarıdaki tablo özel medya anlama desteği olan sağlayıcıları vurgular; çok modlu modellere sahip çoğu LLM sağlayıcısı (Anthropic, Google, OpenAI vb.) etkin yanıt modeli olarak yapılandırıldığında gelen medyayı da anlayabilir.
</Note>

## Eşzamansız üretim nasıl çalışır

Video ve müzik üretimi arka plan görevleri olarak çalışır çünkü sağlayıcı işleme genellikle 30 saniyeden birkaç dakikaya kadar sürer. Aracı `video_generate` veya `music_generate` çağırdığında OpenClaw isteği sağlayıcıya gönderir, hemen bir görev kimliği döndürür ve işi görev defterinde izler. İş çalışırken aracı diğer mesajlara yanıt vermeye devam eder. Sağlayıcı işi bitirdiğinde OpenClaw aracıyı uyandırır; böylece tamamlanan medyayı özgün kanala geri gönderebilir. Görüntü üretimi ve TTS eşzamanlıdır ve yanıtla birlikte satır içinde tamamlanır.

Deepgram, ElevenLabs, Mistral, OpenAI ve xAI yapılandırıldığında gelen
sesi toplu `tools.media.audio` yolu üzerinden yazıya dökebilir. Deepgram,
ElevenLabs, Mistral, OpenAI ve xAI ayrıca Voice Call akışlı STT
sağlayıcılarını da kaydeder; böylece canlı telefon sesi, tamamlanmış bir kaydı beklemeden
seçilen satıcıya iletilebilir.

OpenAI, OpenClaw'ın görüntü, video, toplu TTS, toplu STT, Voice Call
akışlı STT, gerçek zamanlı ses ve memory embedding yüzeylerine eşlenir. xAI şu anda
OpenClaw'ın görüntü, video, arama, kod yürütme, toplu TTS, toplu STT
ve Voice Call akışlı STT yüzeylerine eşlenir. xAI Realtime voice yukarı akış
bir yetenektir, ancak paylaşılan gerçek zamanlı
ses sözleşmesi bunu temsil edene kadar OpenClaw içinde kaydedilmez.

## Hızlı bağlantılar

- [Image Generation](/tr/tools/image-generation) -- görüntü üretme ve düzenleme
- [Video Generation](/tr/tools/video-generation) -- metinden videoya, görüntüden videoya ve videodan videoya
- [Music Generation](/tr/tools/music-generation) -- müzik ve ses parçaları oluşturma
- [Text-to-Speech](/tr/tools/tts) -- yanıtları konuşulan sese dönüştürme
- [Media Understanding](/tr/nodes/media-understanding) -- gelen görüntüleri, sesleri ve videoları anlama

## İlgili

- [Görüntü üretimi](/tr/tools/image-generation)
- [Video üretimi](/tr/tools/video-generation)
- [Müzik üretimi](/tr/tools/music-generation)
- [Metinden konuşmaya](/tr/tools/tts)
