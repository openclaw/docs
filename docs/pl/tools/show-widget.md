---
read_when:
    - Chcesz, aby agent wyświetlał interaktywny wynik w czacie internetowym
    - Potrzebujesz kontraktu dotyczącego danych wejściowych `show_widget`, bezpieczeństwa lub retencji danych
sidebarTitle: Show widget
summary: Renderowanie samodzielnych widżetów SVG lub HTML bezpośrednio w czacie internetowym
title: Pokaż widżet
x-i18n:
    generated_at: "2026-07-12T15:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` renderuje samodzielny fragment SVG lub HTML bezpośrednio w transkrypcji czatu interfejsu Control UI. Dołączony Plugin Canvas jest właścicielem narzędzia i udostępnia każdy wynik jako dokument Canvas z tego samego źródła.

Narzędzie jest dostępne tylko wtedy, gdy źródłowy klient Gateway deklaruje możliwość `inline-widgets`. Interfejs Control UI deklaruje ją automatycznie. Uruchomienia w kanałach takich jak Telegram i WhatsApp nie otrzymują narzędzia `show_widget`.

Przekazywanie możliwości obejmuje osadzone zaplecza modeli, zaplecza korzystające z serwera aplikacji Codex oraz zaplecza oparte na CLI. Wywołania MCP uwierzytelniane przyznanym dostępem oraz bezpośrednie wywołania narzędzi przez HTTP pozostają domyślnie blokowane, ponieważ nie deklarują możliwości klienta.

## Używanie narzędzia

Agent przekazuje dwa wymagane ciągi znaków:

<ParamField path="title" type="string" required>
  Krótki tytuł wyświetlany przy podglądzie osadzonym oraz jako tytuł udostępnionego dokumentu.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Samodzielny fragment SVG lub HTML. Dane wejściowe rozpoczynające się od `<svg` po usunięciu skrajnych białych znaków są renderowane w trybie SVG; wszystkie pozostałe dane wejściowe są traktowane jako fragment HTML. Maksymalna długość: 262 144 znaki.
</ParamField>

Wynik narzędzia zawiera uchwyt podglądu Canvas, dzięki czemu czat internetowy renderuje widżet bezpośrednio na podstawie wywołania narzędzia i przywraca go po ponownym wczytaniu historii. Transkrypcje, które nie renderują podglądów, nadal wyświetlają ścieżkę udostępnionego dokumentu Canvas.

## Bezpieczeństwo i przechowywanie

Dokumenty widżetów korzystają z restrykcyjnych zasad Content Security Policy: wbudowane style i skrypty są dozwolone, obrazy mogą używać adresów URL `data:`, a zewnętrzne pobieranie danych i ładowanie zasobów są zablokowane. Cały kod znaczników, style, skrypty i dane obrazów należy umieścić w `widget_code`.

Element iframe zawsze pomija `allow-same-origin`, nawet gdy globalny tryb osadzania interfejsu Control UI ma wartość `trusted`, dlatego skrypty widżetu nie mogą odczytać źródła aplikacji nadrzędnej. Host Canvas udostępnia również dokumenty widżetów z nagłówkiem odpowiedzi `Content-Security-Policy: sandbox allow-scripts`, dzięki czemu bezpośrednie otwarcie udostępnionego adresu URL nadal uruchamia widżet w nieprzezroczystym źródle zamiast w źródle interfejsu Control UI. Mechanizmy izolacji przeglądarki nie uniemożliwiają skryptowi nawigowania we własnym elemencie iframe; renderuj wyłącznie kod widżetu, który akceptujesz do wykonania w tej odizolowanej ramce.

Element iframe stosuje się również do ustawienia [`gateway.controlUi.embedSandbox`](/pl/web/control-ui#hosted-embeds). Domyślny poziom `scripts` obsługuje interaktywne widżety, zachowując izolację źródła.

Canvas przechowuje maksymalnie 32 widżety na sesję (lub na agenta, gdy sesja jest niedostępna). Utworzenie kolejnego widżetu usuwa najstarszy dokument w tym zakresie.

## Powiązane materiały

- [Osadzona zawartość udostępniana przez Control UI](/pl/web/control-ui#hosted-embeds)
- [Plugin Canvas](/pl/plugins/reference/canvas)
- [Możliwości klienta protokołu Gateway](/pl/gateway/protocol#client-capabilities)
