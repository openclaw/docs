---
read_when:
    - Implementacja panelu Canvas w systemie macOS
    - Dodawanie elementów sterujących agenta do wizualnego obszaru roboczego
    - Debugowanie ładowania elementu canvas w WKWebView
summary: Panel Canvas sterowany przez agenta, osadzony za pomocą WKWebView i niestandardowego schematu URL
title: Kanwa
x-i18n:
    generated_at: "2026-07-16T18:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Aplikacja macOS osadza sterowany przez agenta **panel Canvas** przy użyciu `WKWebView`, będący
lekką wizualną przestrzenią roboczą dla HTML/CSS/JS, A2UI oraz niewielkich
interaktywnych interfejsów użytkownika.

## Lokalizacja Canvas

Stan Canvas jest przechowywany w katalogu Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas udostępnia te pliki za pośrednictwem niestandardowego schematu URL
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Jeśli w katalogu głównym nie istnieje `index.html`, aplikacja wyświetla wbudowaną stronę szablonową.

## Zachowanie panelu

- Panel bez obramowania, o zmiennym rozmiarze, zakotwiczony w pobliżu paska menu (lub kursora myszy).
- Zapamiętuje rozmiar i położenie dla każdej sesji.
- Automatycznie przeładowuje się po zmianie lokalnych plików Canvas.
- W danym momencie widoczny jest tylko jeden panel Canvas (w razie potrzeby następuje przełączenie sesji).

Canvas można wyłączyć w Settings -> **Allow Canvas**. Po wyłączeniu
polecenia węzła Canvas zwracają `CANVAS_DISABLED`.

## Interfejs API agenta

Canvas jest udostępniany za pośrednictwem WebSocket Gateway, dzięki czemu agent może pokazywać i ukrywać
panel, przechodzić do ścieżki lub adresu URL, wykonywać kod JavaScript oraz przechwytywać
obraz migawki:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` przyjmuje lokalne ścieżki Canvas, adresy URL `http(s)` oraz adresy URL `file://`.
Przekazanie `"/"` wyświetla lokalną stronę szablonową lub `index.html`.

Elementy docelowe hostowane przez Gateway pod `/__openclaw__/canvas/` oraz
`/__openclaw__/a2ui/` są rozpoznawane za pośrednictwem bieżącego adresu URL Canvas o ograniczonym zakresie dla sesji węzła.
Aplikacja odświeża to krótkotrwałe uprawnienie przed nawigacją;
nie trzeba samodzielnie tworzyć ani kopiować adresu URL uprawnienia.

## A2UI w Canvas

A2UI jest hostowany przez hosta Canvas usługi Gateway i renderowany wewnątrz panelu
Canvas. Gdy Gateway ogłasza hosta Canvas, aplikacja macOS przy pierwszym otwarciu automatycznie przechodzi
do strony hosta A2UI.

Ogłaszany adres URL ma zakres ograniczony przez uprawnienie, na przykład
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Należy traktować go jako tymczasowe dane uwierzytelniające, a nie stały odnośnik.

### Polecenia A2UI (v0.8)

Canvas przyjmuje komunikaty A2UI v0.8 wysyłane z serwera do klienta: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9) nie jest
jeszcze obsługiwany.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Jeśli można to odczytać, przesyłanie A2UI działa."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Szybki test kontrolny:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Witaj z A2UI"
```

## Wyzwalanie uruchomień agenta z Canvas

Canvas może wyzwalać nowe uruchomienia agenta za pośrednictwem głębokich odnośników `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Obsługiwane parametry zapytania:

| Parametr                   | Znaczenie                                              |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Wstępnie wypełniony prompt agenta.                     |
| `sessionKey`               | Stabilny identyfikator sesji.                          |
| `thinking`                 | Opcjonalny profil rozumowania.                         |
| `deliver`, `to`, `channel` | Cel dostarczenia.                                      |
| `timeoutSeconds`           | Opcjonalny limit czasu uruchomienia.                   |
| `key`                      | Wygenerowany przez aplikację token bezpieczeństwa dla zaufanych lokalnych wywołujących. |

Aplikacja prosi o potwierdzenie, chyba że podano prawidłowy klucz. Odnośniki
bez klucza wyświetlają komunikat i adres URL przed zatwierdzeniem oraz ignorują pola
trasowania dostarczenia; odnośniki z kluczem korzystają ze standardowej ścieżki uruchamiania Gateway.

## Uwagi dotyczące bezpieczeństwa

- Schemat Canvas blokuje przechodzenie między katalogami; pliki muszą znajdować się w katalogu głównym sesji.
- Lokalna zawartość Canvas korzysta z niestandardowego schematu (serwer pętli zwrotnej nie jest wymagany).
- Zewnętrzne adresy URL `http(s)` są dozwolone tylko po jawnym przejściu do nich.
- Zwykłe strony internetowe służą wyłącznie do renderowania. Działania agenta są przyjmowane tylko ze
  schematu Canvas należącego do aplikacji lub dokładnie tego dokumentu A2UI Gateway o zakresie ograniczonym uprawnieniem,
  który wybrała aplikacja; ramki podrzędne, przekierowania, nieaktualne uprawnienia i zmienione
  zapytania nie mogą wywoływać działań.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [WebChat](/pl/web/webchat)
