---
read_when:
    - Zatwierdzasz prośby o parowanie urządzeń
    - Musisz wymienić lub unieważnić tokeny urządzeń
summary: Dokumentacja referencyjna CLI dla `openclaw devices` (parowanie urządzeń + rotacja/unieważnianie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-04-30T09:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: df105135a12ec733e45a67792e8447628f1538fc2536a008d615d46d1eaff5c8
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami ograniczonymi do urządzeń.

## Polecenia

### `openclaw devices list`

Wyświetla oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

Dane wyjściowe oczekującego żądania pokazują żądany dostęp obok aktualnie
zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu
rozszerzenia zakresu/roli są jawne, zamiast wyglądać tak, jakby parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuwa jeden wpis sparowanego urządzenia.

Gdy jesteś uwierzytelniony tokenem sparowanego urządzenia, wywołujący bez uprawnień administratora mogą
usunąć tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Masowo czyści sparowane urządzenia.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdza oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId`
zostanie pominięty albo przekazano `--latest`, OpenClaw tylko wypisuje wybrane oczekujące
żądanie i kończy działanie; uruchom zatwierdzanie ponownie z dokładnym ID żądania po sprawdzeniu
szczegółów.

<Note>
Jeśli urządzenie ponawia parowanie ze zmienionymi szczegółami uwierzytelnienia (rolą, zakresami lub kluczem publicznym), OpenClaw zastępuje poprzedni oczekujący wpis i wystawia nowy `requestId`. Uruchom `openclaw devices list` bezpośrednio przed zatwierdzeniem, aby użyć aktualnego ID.
</Note>

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę,
OpenClaw pozostawia istniejące zatwierdzenie i tworzy nowe oczekujące żądanie
rozszerzenia. Sprawdź kolumny `Requested` i `Approved` w `openclaw devices list`
albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed
jego zatwierdzeniem.

Jeśli Gateway jest jawnie skonfigurowany z
`gateway.nodes.pairing.autoApproveCidrs`, pierwsze żądania `role: node` z
pasujących adresów IP klientów mogą zostać zatwierdzone, zanim pojawią się na tej liście. Ta polityka
jest domyślnie wyłączona i nigdy nie dotyczy klientów operatora/przeglądarki ani żądań
rozszerzenia.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuca oczekujące żądanie parowania urządzenia.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotuje token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Rola docelowa musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może utworzyć nowej, niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z zapisanym zrotowanym tokenem ponownie użyją
buforowanych zatwierdzonych zakresów tego tokenu. Jeśli przekażesz jawne wartości `--scope`, staną się one
zapisanym zestawem zakresów dla przyszłych ponownych połączeń z użyciem buforowanego tokenu.
Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą rotować tylko token **własnego** urządzenia.
Docelowy zestaw zakresów tokenu musi mieścić się w zakresach operatora bieżącej sesji
wywołującego; rotacja nie może utworzyć ani zachować szerszego tokenu operatora niż ten,
który wywołujący już ma.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca metadane rotacji jako JSON. Jeśli wywołujący rotuje własny token, będąc
uwierzytelnionym tym tokenem urządzenia, odpowiedź zawiera również token zastępczy,
aby klient mógł go utrwalić przed ponownym połączeniem. Rotacje współdzielone/administracyjne
nie zwracają tokenu okaziciela.

### `openclaw devices revoke --device <id> --role <role>`

Odwołuje token urządzenia dla określonej roli.

Wywołujący bez uprawnień administratora, używający sparowanego urządzenia, mogą odwołać tylko token **własnego** urządzenia.
Odwołanie tokenu innego urządzenia wymaga `operator.admin`.
Docelowy zestaw zakresów tokenu także musi mieścić się w zakresach operatora bieżącej sesji
wywołującego; wywołujący mający tylko uprawnienia parowania nie mogą odwoływać tokenów operatora z uprawnieniami administracyjnymi/zapisu.

```
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik odwołania jako JSON.

## Wspólne opcje

- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url`, gdy skonfigurowano).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: limit czasu RPC.
- `--json`: dane wyjściowe JSON (zalecane do skryptów).

<Warning>
Gdy ustawisz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
</Warning>

## Uwagi

- Rotacja tokenu zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` to opcjonalna polityka Gateway tylko dla
  świeżego parowania urządzeń typu node; nie zmienia uprawnień CLI do zatwierdzania.
- Rotacja i odwoływanie tokenów pozostają wewnątrz zatwierdzonego zestawu ról parowania oraz
  zatwierdzonej bazowej linii zakresów dla tego urządzenia. Zabłąkany wpis buforowanego tokenu nie
  przyznaje celu zarządzania tokenami.
- W sesjach z tokenem sparowanego urządzenia zarządzanie między urządzeniami jest dostępne tylko dla administratora:
  `remove`, `rotate` i `revoke` dotyczą wyłącznie własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- Modyfikacja tokenu jest także ograniczona zakresem wywołującego: sesja mająca tylko uprawnienia parowania nie może
  rotować ani odwoływać tokenu, który obecnie przenosi `operator.admin` lub
  `operator.write`.
- `devices clear` jest celowo zabezpieczone przez `--yes`.
- Jeśli zakres parowania jest niedostępny na local loopback (i nie przekazano jawnego `--url`), list/approve może użyć lokalnej procedury awaryjnej parowania.
- `devices approve` wymaga jawnego ID żądania przed utworzeniem tokenów; pominięcie `requestId` albo przekazanie `--latest` tylko pokazuje podgląd najnowszego oczekującego żądania.

## Lista kontrolna odzyskiwania po dryfie tokenów

Użyj tego, gdy Control UI lub inni klienci nadal kończą się niepowodzeniem z `AUTH_TOKEN_MISMATCH` lub `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź aktualne źródło tokenu Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj ID dotkniętego urządzenia:

```bash
openclaw devices list
```

3. Zrotuj token operatora dla dotkniętego urządzenia:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli rotacja nie wystarczy, usuń nieaktualne parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów połączenie klienta z aktualnym współdzielonym tokenem/hasłem.

Uwagi:

- Normalna kolejność pierwszeństwa uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a na końcu token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem współdzielony token i zapisany token urządzenia dla jednej ograniczonej ponownej próby.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem panelu](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
