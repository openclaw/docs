---
read_when:
    - Implementacja panelu Canvas dla macOS
    - Dodawanie elementów sterujących agenta do wizualnego obszaru roboczego
    - Debugowanie ładowania canvas w WKWebView
summary: Panel kanwy kontrolowany przez agenta, osadzony za pomocą WKWebView + niestandardowego schematu URL
title: Płótno
x-i18n:
    generated_at: "2026-06-28T00:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Aplikacja macOS osadza kontrolowany przez agenta **panel Canvas** za pomocą `WKWebView`. Jest to lekkie wizualne środowisko robocze dla HTML/CSS/JS, A2UI oraz niewielkich interaktywnych powierzchni UI.

## Gdzie znajduje się Canvas

Stan Canvas jest przechowywany w Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas udostępnia te pliki za pomocą **niestandardowego schematu URL**:

- `openclaw-canvas://<session>/<path>`

Przykłady:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Jeśli w katalogu głównym nie istnieje `index.html`, aplikacja pokazuje **wbudowaną stronę szkieletową**.

## Zachowanie panelu

- Panel bez obramowania, o zmiennym rozmiarze, zakotwiczony w pobliżu paska menu (lub kursora myszy).
- Zapamiętuje rozmiar/pozycję dla każdej sesji.
- Automatycznie przeładowuje się, gdy lokalne pliki canvas się zmienią.
- Widoczny jest tylko jeden panel Canvas naraz (sesja jest przełączana w razie potrzeby).

Canvas można wyłączyć w Ustawieniach → **Zezwalaj na Canvas**. Po wyłączeniu polecenia węzła canvas zwracają `CANVAS_DISABLED`.

## Powierzchnia API agenta

Canvas jest udostępniany przez **Gateway WebSocket**, więc agent może:

- pokazywać/ukrywać panel
- przechodzić do ścieżki lub URL
- wykonywać JavaScript
- przechwytywać obraz zrzutu

Przykłady CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Uwagi:

- `canvas.navigate` akceptuje **lokalne ścieżki canvas**, URL-e `http(s)` oraz URL-e `file://`.
- Jeśli przekażesz `"/"`, Canvas pokaże lokalny szkielet albo `index.html`.

## A2UI w Canvas

A2UI jest hostowany przez host canvas Gateway i renderowany w panelu Canvas.
Gdy Gateway ogłasza host Canvas, aplikacja macOS automatycznie przechodzi do strony hosta A2UI przy pierwszym otwarciu.

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

Szybki test dymny:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Wyzwalanie uruchomień agenta z Canvas

Canvas może wyzwalać nowe uruchomienia agenta przez głębokie linki:

- `openclaw://agent?...`

Przykład (w JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Obsługiwane parametry zapytania:

- `message`: wstępnie wypełniony prompt agenta.
- `sessionKey`: stabilny identyfikator sesji.
- `thinking`: opcjonalny profil myślenia.
- `deliver`, `to` lub `channel`: cel dostarczenia.
- `timeoutSeconds`: opcjonalny limit czasu uruchomienia.
- `key`: wygenerowany przez aplikację token bezpieczeństwa dla zaufanych lokalnych wywołujących.

Aplikacja prosi o potwierdzenie, chyba że podano prawidłowy klucz. Linki bez klucza pokazują wiadomość i URL przed zatwierdzeniem oraz ignorują pola routingu dostarczenia; linki z kluczem używają normalnej ścieżki uruchomienia Gateway.

## Uwagi dotyczące bezpieczeństwa

- Schemat Canvas blokuje przechodzenie po katalogach; pliki muszą znajdować się w katalogu głównym sesji.
- Lokalna zawartość Canvas używa niestandardowego schematu (serwer local loopback nie jest wymagany).
- Zewnętrzne URL-e `http(s)` są dozwolone tylko po jawnej nawigacji.

## Powiązane

- [aplikacja macOS](/pl/platforms/macos)
- [WebChat](/pl/web/webchat)
