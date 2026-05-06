---
read_when:
    - Implementacja panelu Canvas w macOS
    - Dodawanie elementów sterowania agenta do wizualnego obszaru roboczego
    - Debugowanie ładowania płótna w WKWebView
summary: Panel Canvas kontrolowany przez agenta, osadzony za pomocą WKWebView + niestandardowego schematu URL
title: Kanwa
x-i18n:
    generated_at: "2026-05-06T09:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Aplikacja macOS osadza kontrolowany przez agenta **panel Canvas** za pomocą `WKWebView`. Jest to lekka wizualna przestrzeń robocza dla HTML/CSS/JS, A2UI oraz małych interaktywnych powierzchni UI.

## Gdzie znajduje się Canvas

Stan Canvas jest przechowywany w Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas udostępnia te pliki przez **niestandardowy schemat URL**:

- `openclaw-canvas://<session>/<path>`

Przykłady:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Jeśli w katalogu głównym nie ma pliku `index.html`, aplikacja pokazuje **wbudowaną stronę szkieletową**.

## Zachowanie panelu

- Bezramkowy panel o zmiennym rozmiarze, zakotwiczony w pobliżu paska menu (lub kursora myszy).
- Zapamiętuje rozmiar/pozycję dla każdej sesji.
- Automatycznie przeładowuje się, gdy zmieniają się lokalne pliki Canvas.
- Jednocześnie widoczny jest tylko jeden panel Canvas (sesja jest przełączana w razie potrzeby).

Canvas można wyłączyć w Settings → **Allow Canvas**. Po wyłączeniu polecenia węzła canvas zwracają `CANVAS_DISABLED`.

## Powierzchnia API agenta

Canvas jest udostępniany przez **Gateway WebSocket**, więc agent może:

- pokazać/ukryć panel
- przejść do ścieżki lub URL
- wykonać JavaScript
- przechwycić obraz migawki

Przykłady CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Uwagi:

- `canvas.navigate` akceptuje **lokalne ścieżki Canvas**, adresy URL `http(s)` oraz adresy URL `file://`.
- Jeśli przekażesz `"/"`, Canvas pokaże lokalną stronę szkieletową lub `index.html`.

## A2UI w Canvas

A2UI jest hostowane przez hosta Canvas Gateway i renderowane wewnątrz panelu Canvas. Gdy Gateway ogłasza hosta Canvas, aplikacja macOS automatycznie przechodzi do strony hosta A2UI przy pierwszym otwarciu.

Domyślny URL hosta A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Polecenia A2UI (v0.8)

Canvas obecnie akceptuje komunikaty serwer→klient **A2UI v0.8**:

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

## Wyzwalanie uruchomień agenta z Canvas

Canvas może wyzwalać nowe uruchomienia agenta przez deep linki:

- `openclaw://agent?...`

Przykład (w JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Aplikacja prosi o potwierdzenie, chyba że podano prawidłowy klucz.

## Uwagi dotyczące bezpieczeństwa

- Schemat Canvas blokuje przechodzenie po katalogach; pliki muszą znajdować się w katalogu głównym sesji.
- Lokalna zawartość Canvas używa niestandardowego schematu (serwer local loopback nie jest wymagany).
- Zewnętrzne adresy URL `http(s)` są dozwolone tylko wtedy, gdy zostaną jawnie wskazane jako cel nawigacji.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [WebChat](/pl/web/webchat)
