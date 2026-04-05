---
read_when:
    - Implementujesz panel Canvas w aplikacji macOS
    - Dodajesz sterowanie agenta dla wizualnego workspace
    - Debugujesz ładowanie Canvas w WKWebView
summary: Panel Canvas sterowany przez agenta, osadzony przez `WKWebView` + niestandardowy schemat URL
title: Canvas
x-i18n:
    generated_at: "2026-04-05T13:59:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (aplikacja macOS)

Aplikacja macOS osadza **panel Canvas** sterowany przez agenta przy użyciu `WKWebView`. To
lekki wizualny workspace dla HTML/CSS/JS, A2UI oraz małych interaktywnych
powierzchni UI.

## Gdzie znajduje się Canvas

Stan Canvas jest przechowywany w Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas udostępnia te pliki przez **niestandardowy schemat URL**:

- `openclaw-canvas://<session>/<path>`

Przykłady:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Jeśli w katalogu głównym nie istnieje `index.html`, aplikacja pokazuje **wbudowaną stronę szkieletową**.

## Zachowanie panelu

- Panel bez obramowania, z możliwością zmiany rozmiaru, zakotwiczony w pobliżu paska menu (lub kursora myszy).
- Zapamiętuje rozmiar/pozycję dla każdej sesji.
- Automatycznie przeładowuje się, gdy lokalne pliki Canvas się zmienią.
- W danym momencie widoczny jest tylko jeden panel Canvas (sesja jest przełączana w razie potrzeby).

Canvas można wyłączyć w Ustawieniach → **Allow Canvas**. Gdy jest wyłączony, polecenia węzła Canvas
zwracają `CANVAS_DISABLED`.

## Powierzchnia API agenta

Canvas jest udostępniany przez **Gateway WebSocket**, więc agent może:

- pokazywać/ukrywać panel
- przechodzić do ścieżki lub URL-a
- wykonywać JavaScript
- przechwytywać obraz migawki

Przykłady CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Uwagi:

- `canvas.navigate` akceptuje **lokalne ścieżki Canvas**, URL-e `http(s)` i URL-e `file://`.
- Jeśli przekażesz `"/"`, Canvas pokaże lokalny szkielet lub `index.html`.

## A2UI w Canvas

A2UI jest hostowane przez host Canvas Gateway i renderowane wewnątrz panelu Canvas.
Gdy Gateway ogłasza host Canvas, aplikacja macOS automatycznie przechodzi do
strony hosta A2UI przy pierwszym otwarciu.

Domyślny URL hosta A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Polecenia A2UI (v0.8)

Canvas obecnie akceptuje wiadomości A2UI serwer→klient w wersji **A2UI v0.8**:

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

Aplikacja poprosi o potwierdzenie, chyba że zostanie podany prawidłowy klucz.

## Uwagi dotyczące bezpieczeństwa

- Schemat Canvas blokuje przechodzenie po katalogach; pliki muszą znajdować się pod katalogiem głównym sesji.
- Lokalna zawartość Canvas używa niestandardowego schematu (nie jest wymagany serwer loopback).
- Zewnętrzne URL-e `http(s)` są dozwolone tylko przy jawnym przejściu do nich.
