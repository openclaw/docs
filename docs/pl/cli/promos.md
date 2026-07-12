---
read_when:
    - Chcesz wypróbować bezpłatną ofertę promocyjną modelu w ClawHub
    - Konfigurujesz dostawcę w ramach promocji zamiast podczas wdrażania użytkownika
summary: Dokumentacja CLI dla `openclaw promos` (wyświetlanie i odbieranie promocyjnych ofert modeli)
title: Promocje
x-i18n:
    generated_at: "2026-07-12T15:02:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Odkrywaj i odbieraj promocyjne oferty modeli publikowane w ClawHub. Odebranie
promocji konfiguruje dostawcę (uwierzytelnianie i Plugin, gdy jest potrzebny)
oraz rejestruje modele objęte promocją — bez ponownego przechodzenia procesu
wdrażania i bez zmiany modelu domyślnego, chyba że tego zażądasz.

Powiązane:

- Model domyślny i modele zapasowe: [Modele](/pl/cli/models)
- Konfiguracja uwierzytelniania dostawcy: [Pierwsze kroki](/pl/start/getting-started)

## Polecenia

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Wyświetla aktualnie obowiązujące promocje wraz z ich modelami, sugerowanym
modelem domyślnym, pozostałym czasem oraz dokładnym poleceniem odebrania.
`--json` wyświetla nieprzetworzone dane.

## `openclaw promos claim <slug>`

Odbiera aktualnie obowiązującą promocję:

1. Pobiera promocję z ClawHub i sprawdza, czy mieści się ona w okresie
   obowiązywania.
2. Sprawdza dostawcę promocji, wybraną metodę uwierzytelniania i zadeklarowane
   pakiety Pluginów pod kątem zgodności z zainstalowaną wersją OpenClaw.
   Nieznane identyfikatory lub niezgodności pakietów są odrzucane — promocja
   nigdy nie może sprawić, że CLI uruchomi coś, czego nie potrafi już obsłużyć.
3. Ponownie wykorzystuje istniejące dane uwierzytelniające dostawcy, jeśli je
   masz. W przeciwnym razie przeprowadza standardowy proces uwierzytelniania
   dostawcy (najpierw wyświetlając adres URL rejestracji z promocji, umożliwiający
   uzyskanie bezpłatnego klucza). `--api-key <key>` kończy uwierzytelnianie
   kluczem API bez monitów, zgodnie z flagami trybu nieinteraktywnego polecenia
   `openclaw onboard`; aby nie umieszczać klucza w wierszu poleceń, wyeksportuj
   zamiast tego zmienną środowiskową dostawcy (na przykład
   `OPENROUTER_API_KEY`) — istniejące dane uwierzytelniające ze środowiska są
   wykrywane automatycznie i żadna flaga nie jest potrzebna.
4. Rejestruje modele objęte promocją wraz z ich aliasami. Istniejące aliasy
   nigdy nie są nadpisywane.
5. Proponuje ustawienie sugerowanego modelu promocji jako modelu domyślnego —
   `--set-default` pomija pytanie; w przeciwnym razie ustawienia domyślne
   pozostają bez zmian.

Po zakończeniu okresu obowiązywania promocji dostawca przestaje udostępniać
bezpłatne modele; konfiguracja i dane uwierzytelniające pozostają niezmienione.
W dowolnym momencie możesz przełączyć model za pomocą
`openclaw models set <model>`.

## Pasywne wykrywanie w `models list`

`openclaw models list` wyświetla również promocje bez bezpośredniego
odpytywania ClawHub:

- Aktualne oferty, których modeli jeszcze nie skonfigurowano, pojawiają się
  poniżej tabeli w grupie „Dostępne w ramach promocji”, każda z poleceniem
  odebrania.
- Modele zarejestrowane za pomocą `promos claim` mają znacznik `promo`, który
  po zakończeniu okresu obowiązywania oferty zmienia się na `promo ended`.
- Gdy nowa oferta zostanie wykryta po raz pierwszy, jednorazowe powiadomienie
  wskazuje polecenie `openclaw promos list`. Oferty, które już wyświetlono lub
  odebrano, nie są ponownie ogłaszane.

Mechanizm odczytuje lokalnie buforowaną kopię hostowanego w ClawHub kanału
promocji (zwykle odświeżaną raz dziennie za pomocą żądania warunkowego lub
wcześniej, gdy buforowany zapis wygaśnie; nieudane próby odświeżenia są po
cichu pomijane). Odświeżanie nieaktualnej kopii trwa najwyżej 2,5 sekundy i
nigdy nie zakłóca wyświetlania listy. Dane wyjściowe `--json` i `--plain`
pozostają czyste i przeznaczone do przetwarzania maszynowego: bez sekcji
promocji ani powiadomień. Odebranie promocji zawsze powoduje jej ponowną
weryfikację w aktywnym API ClawHub, dlatego oferta wycofana przed terminem
zostanie odrzucona, nawet jeśli nadal widnieje w buforowanej kopii.
