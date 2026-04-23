---
read_when:
    - Ви хочете аналізувати PDF через агентів
    - Вам потрібні точні параметри та обмеження tool-а `pdf`
    - Ви налагоджуєте нативний режим PDF порівняно з fallback-витягуванням
summary: Аналізуйте один або кілька PDF-документів із нативною підтримкою provider-а та fallback-витягуванням
title: Tool PDF
x-i18n:
    generated_at: "2026-04-23T21:16:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 230fa60b5fc0e046bec85c2304c74de52997982dd58bffc721645129c82971f0
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` аналізує один або кілька PDF-документів і повертає текст.

Коротко про поведінку:

- Нативний режим provider-а для model provider-ів Anthropic і Google.
- Режим fallback-витягування для інших provider-ів (спочатку витяг тексту, а потім зображення сторінок за потреби).
- Підтримує один (`pdf`) або кілька (`pdfs`) входів, максимум 10 PDF за один виклик.

## Доступність

Tool реєструється лише тоді, коли OpenClaw може розв’язати конфігурацію моделі з підтримкою PDF для агента:

1. `agents.defaults.pdfModel`
2. fallback до `agents.defaults.imageModel`
3. fallback до розв’язаної моделі сесії/типової моделі агента
4. якщо нативні PDF provider-и мають auth, надавати їм перевагу перед загальними кандидатами fallback для image

Якщо не вдається розв’язати жодну придатну модель, tool `pdf` не надається.

Примітки щодо доступності:

- Ланцюжок fallback враховує auth. Налаштований `provider/model` зараховується лише тоді, коли
  OpenClaw справді може автентифікувати цей provider для агента.
- Нативні PDF provider-и наразі — це **Anthropic** і **Google**.
- Якщо розв’язаний provider сесії/типовий provider уже має налаштовану модель vision/PDF,
  tool PDF повторно використовує її перед fallback до інших provider-ів з auth.

## Довідник входу

- `pdf` (`string`): один шлях до PDF або URL
- `pdfs` (`string[]`): кілька шляхів до PDF або URL, до 10 загалом
- `prompt` (`string`): prompt аналізу, за замовчуванням `Analyze this PDF document.`
- `pages` (`string`): фільтр сторінок на кшталт `1-5` або `1,3,7-9`
- `model` (`string`): необов’язкове перевизначення моделі (`provider/model`)
- `maxBytesMb` (`number`): обмеження розміру одного PDF у MB

Примітки щодо входу:

- `pdf` і `pdfs` об’єднуються та дедуплікуються перед завантаженням.
- Якщо не передано жодного PDF-входу, tool завершується з помилкою.
- `pages` розбирається як номери сторінок з 1, дедуплікується, сортується й обмежується налаштованим максимумом сторінок.
- `maxBytesMb` за замовчуванням береться з `agents.defaults.pdfMaxBytesMb` або дорівнює `10`.

## Підтримувані посилання на PDF

- локальний шлях до файла (зокрема з розгортанням `~`)
- URL `file://`
- URL `http://` і `https://`

Примітки щодо посилань:

- Інші URI scheme (наприклад `ftp://`) відхиляються з `unsupported_pdf_reference`.
- У режимі sandbox віддалені URL `http(s)` відхиляються.
- Коли увімкнено policy файлів лише в межах workspace, локальні шляхи до файлів поза дозволеними коренями відхиляються.

## Режими виконання

### Нативний режим provider-а

Нативний режим використовується для provider-ів `anthropic` і `google`.
Tool надсилає сирі байти PDF безпосередньо до API provider-ів.

Обмеження нативного режиму:

- `pages` не підтримується. Якщо його задано, tool повертає помилку.
- Підтримується кілька PDF на вхід; кожен PDF надсилається як нативний document block /
  inline PDF part перед prompt.

### Режим fallback-витягування

Режим fallback використовується для не-нативних provider-ів.

Потік:

1. Витягти текст із вибраних сторінок (до `agents.defaults.pdfMaxPages`, за замовчуванням `20`).
2. Якщо довжина витягнутого тексту менша за `200` символів, відрендерити вибрані сторінки в PNG-зображення і включити їх.
3. Надіслати витягнутий вміст разом із prompt до вибраної моделі.

Подробиці fallback:

- Витягування зображень сторінок використовує budget пікселів `4,000,000`.
- Якщо цільова модель не підтримує image input і немає тексту, який можна витягти, tool повертає помилку.
- Якщо витяг тексту вдався, але витягування зображень потребувало б vision на
  текстовій моделі, OpenClaw відкидає відрендерені зображення й продовжує роботу з
  витягнутим текстом.
- Fallback-витягування потребує `pdfjs-dist` (і `@napi-rs/canvas` для рендерингу зображень).

## Config

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Повні подробиці полів див. у [Configuration Reference](/uk/gateway/configuration-reference).

## Подробиці виводу

Tool повертає текст у `content[0].text` і структуровані metadata в `details`.

Поширені поля `details`:

- `model`: розв’язане посилання на модель (`provider/model`)
- `native`: `true` для нативного режиму provider-а, `false` для fallback
- `attempts`: невдалі спроби fallback перед успіхом

Поля шляхів:

- для одного PDF на вхід: `details.pdf`
- для кількох PDF на вхід: `details.pdfs[]` із записами `pdf`
- metadata переписування шляху sandbox (де застосовно): `rewrittenFrom`

## Поведінка помилок

- Відсутній PDF на вхід: викидає `pdf required: provide a path or URL to a PDF document`
- Забагато PDF: повертає структуровану помилку в `details.error = "too_many_pdfs"`
- Непідтримувана scheme посилання: повертає `details.error = "unsupported_pdf_reference"`
- Нативний режим із `pages`: викидає зрозумілу помилку `pages is not supported with native PDF providers`

## Приклади

Один PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Кілька PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Fallback-модель із фільтром сторінок:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Пов’язане

- [Огляд tools](/uk/tools) — усі доступні tools агента
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — конфігурація pdfMaxBytesMb і pdfMaxPages
