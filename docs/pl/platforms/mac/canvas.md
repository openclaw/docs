---
read_when:
    - Implementacja panelu Canvas dla macOS
    - Dodawanie sterowania wizualnym obszarem roboczym przez agenta to codex wide skill; user wants translation only. Need output only translated text.
    - Debugowanie ładowania Canvas w WKWebView
summary: Panel Canvas sterowany przez agenta, osadzony przez WKWebView + niestandardowy schemat URL
title: Canvas
x-i18n:
    generated_at: "2026-04-24T09:20:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 15
---

Aplikacja macOS osadza sterowany przez agenta **panel Canvas** przy użyciu `WKWebView`. To
lekki wizualny obszar roboczy dla HTML/CSS/JS, A2UI i małych interaktywnych
powierzchni UI.

## Gdzie znajduje się Canvas

Stan Canvas jest przechowywany w Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas serwuje te pliki przez **niestandardowy schemat URL**:

- `openclaw-canvas://<session>/<path>`

Przykłady:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Jeśli w katalogu głównym nie istnieje `index.html`, aplikacja pokazuje **wbudowaną stronę szablonową**.

## Zachowanie panelu

- Panel bez obramowania, ze zmiennym rozmiarem, zakotwiczony przy pasku menu (albo kursorem myszy).
- Zapamiętuje rozmiar/pozycję per sesja.
- Automatycznie przeładowuje się, gdy zmienią się lokalne pliki canvas.
- W danym momencie widoczny jest tylko jeden panel Canvas (sesja jest przełączana w razie potrzeby).

Canvas można wyłączyć w Settings → **Allow Canvas**. Gdy jest wyłączony, polecenia node canvas
zwracają `CANVAS_DISABLED`.

## Powierzchnia API agenta

Canvas jest udostępniany przez **Gateway WebSocket**, dzięki czemu agent może:

- pokazywać/ukrywać panel
- przechodzić do ścieżki lub URL
- wykonywać JavaScript
- przechwytywać obraz snapshotu

Przykłady CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Uwagi:

- `canvas.navigate` akceptuje **lokalne ścieżki canvas**, URL-e `http(s)` oraz URL-e `file://`.
- Jeśli przekażesz `"/"`, Canvas pokaże lokalny szablon albo `index.html`.

## A2UI w Canvas

A2UI jest hostowane przez host canvas Gateway i renderowane wewnątrz panelu Canvas.
Gdy Gateway ogłasza host Canvas, aplikacja macOS automatycznie przechodzi do
strony hosta A2UI przy pierwszym otwarciu.

Domyślny URL hosta A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Polecenia A2UI (v0.8)

Canvas obecnie akceptuje komunikaty A2UI **v0.8** serwer→klient:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) nie jest obsługiwane.

Przykład CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Szybki smoke test:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Wyzwalanie przebiegów agenta z Canvas

Canvas może wyzwalać nowe przebiegi agenta przez deep linki:

- `openclaw://agent?...`

Przykład (w JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Aplikacja wyświetla prośbę o potwierdzenie, chyba że podano prawidłowy klucz.

## Uwagi dotyczące bezpieczeństwa

- Schemat Canvas blokuje przechodzenie katalogów; pliki muszą znajdować się pod katalogiem głównym sesji.
- Lokalna zawartość Canvas używa niestandardowego schematu (nie jest wymagany serwer loopback).
- Zewnętrzne URL-e `http(s)` są dozwolone tylko przy jawnym przejściu.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [WebChat](/pl/web/webchat)
