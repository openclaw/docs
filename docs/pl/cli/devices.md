---
read_when:
    - Zatwierdzasz żądania parowania urządzeń
    - Musisz rotować lub unieważnić tokeny urządzeń
summary: Dokumentacja referencyjna CLI dla `openclaw devices` (parowanie urządzeń + rotacja/odwoływanie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-05-03T09:44:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa92fd3ffc671c827fa98870bf9df89f3be90adec167fd8ea32698cf2e69991a
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami ograniczonymi do urządzeń.

## Polecenia

### `openclaw devices list`

Wyświetl oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

Dane wyjściowe oczekującego żądania pokazują żądany dostęp obok aktualnie zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu rozszerzenia zakresu/roli są jawne, zamiast wyglądać tak, jakby parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

Gdy jesteś uwierzytelniony tokenem sparowanego urządzenia, wywołujący bez uprawnień administratora mogą usuwać tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Wyczyść sparowane urządzenia zbiorczo.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Zatwierdź oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId` zostanie pominięte lub przekazano `--latest`, OpenClaw tylko wypisuje wybrane oczekujące żądanie i kończy działanie; uruchom zatwierdzanie ponownie z dokładnym identyfikatorem żądania po sprawdzeniu szczegółów.

<Note>
Jeśli urządzenie ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rola, zakresy lub klucz publiczny), OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowe `requestId`. Uruchom `openclaw devices list` tuż przed zatwierdzeniem, aby użyć bieżącego identyfikatora.
</Note>

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę, OpenClaw zachowuje istniejące zatwierdzenie i tworzy nowe oczekujące żądanie rozszerzenia. Przejrzyj kolumny `Requested` i `Approved` w `openclaw devices list` albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne rozszerzenie przed jego zatwierdzeniem.

Jeśli Gateway jest jawnie skonfigurowany z `gateway.nodes.pairing.autoApproveCidrs`, pierwsze żądania `role: node` z pasujących adresów IP klientów mogą zostać zatwierdzone, zanim pojawią się na tej liście. Ta polityka jest domyślnie wyłączona i nigdy nie dotyczy klientów operatora/przeglądarki ani żądań rozszerzenia.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Odrzuć oczekujące żądanie parowania urządzenia.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Obróć token urządzenia dla określonej roli (opcjonalnie aktualizując zakresy).
Rola docelowa musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia; obrót nie może utworzyć nowej, niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z zapisanym obróconym tokenem ponownie użyją zatwierdzonych zakresów zapisanych w pamięci podręcznej tego tokena. Jeśli przekażesz jawne wartości `--scope`, staną się one zapisanym zestawem zakresów dla przyszłych ponownych połączeń z tokenem z pamięci podręcznej.
Wywołujący z tokenem sparowanego urządzenia bez uprawnień administratora mogą obracać tylko token **własnego** urządzenia.
Docelowy zestaw zakresów tokena musi mieścić się w własnych zakresach operatora sesji wywołującego; obrót nie może utworzyć ani zachować szerszego tokena operatora niż ten, który wywołujący już posiada.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca metadane obrotu jako JSON. Jeśli wywołujący obraca własny token, będąc uwierzytelnionym tym tokenem urządzenia, odpowiedź zawiera też token zastępczy, aby klient mógł go utrwalić przed ponownym połączeniem. Współdzielone/administracyjne obroty nie zwracają tokena bearer.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla określonej roli.

Wywołujący z tokenem sparowanego urządzenia bez uprawnień administratora mogą unieważniać tylko token **własnego** urządzenia.
Unieważnienie tokena innego urządzenia wymaga `operator.admin`.
Docelowy zestaw zakresów tokena musi również mieścić się w własnych zakresach operatora sesji wywołującego; wywołujący mający tylko parowanie nie mogą unieważniać administracyjnych/zapisu tokenów operatora.

```
openclaw devices revoke --device <deviceId> --role node
```

Zwraca wynik unieważnienia jako JSON.

## Typowe opcje

- `--url <url>`: adres URL WebSocket Gateway (domyślnie `gateway.remote.url`, gdy skonfigurowano).
- `--token <token>`: token Gateway (jeśli wymagany).
- `--password <password>`: hasło Gateway (uwierzytelnianie hasłem).
- `--timeout <ms>`: limit czasu RPC.
- `--json`: dane wyjściowe JSON (zalecane do skryptów).

<Warning>
Gdy ustawisz `--url`, CLI nie wraca do danych uwierzytelniających z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych danych uwierzytelniających jest błędem.
</Warning>

## Uwagi

- Obrót tokena zwraca nowy token (poufny). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`). Niektóre zatwierdzenia wymagają też, aby wywołujący posiadał zakresy operatora, które urządzenie docelowe miałoby utworzyć lub odziedziczyć; zobacz [Zakresy operatora](/pl/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` to opcjonalna polityka Gateway tylko dla parowania nowych urządzeń typu node; nie zmienia uprawnień zatwierdzania w CLI.
- Obrót i unieważnianie tokenów pozostają w zatwierdzonym zestawie ról parowania oraz zatwierdzonej bazie zakresów dla tego urządzenia. Przypadkowy wpis tokena w pamięci podręcznej nie przyznaje celu zarządzania tokenami.
- W sesjach tokena sparowanego urządzenia zarządzanie między urządzeniami jest dostępne tylko dla administratora: `remove`, `rotate` i `revoke` dotyczą tylko własnego urządzenia, chyba że wywołujący ma `operator.admin`.
- Modyfikacja tokena jest także ograniczona zakresem wywołującego: sesja mająca tylko parowanie nie może obracać ani unieważniać tokena, który obecnie przenosi `operator.admin` lub `operator.write`.
- `devices clear` jest celowo chronione przez `--yes`.
- Jeśli zakres parowania jest niedostępny na local loopback (i nie przekazano jawnego `--url`), list/approve może użyć lokalnej procedury awaryjnej parowania.
- `devices approve` wymaga jawnego identyfikatora żądania przed utworzeniem tokenów; pominięcie `requestId` lub przekazanie `--latest` tylko pokazuje podgląd najnowszego oczekującego żądania.

## Lista kontrolna odzyskiwania rozjazdu tokenów

Użyj tego, gdy Control UI lub inni klienci nadal kończą się niepowodzeniem z `AUTH_TOKEN_MISMATCH` albo `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Potwierdź bieżące źródło tokena Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj identyfikator urządzenia, którego dotyczy problem:

```bash
openclaw devices list
```

3. Obróć token operatora dla urządzenia, którego dotyczy problem:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli obrót nie wystarczy, usuń nieaktualne parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów połączenie klienta z bieżącym współdzielonym tokenem/hasłem.

Uwagi:

- Normalna kolejność uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem zarówno współdzielony token, jak i zapisany token urządzenia dla jednej ograniczonej ponownej próby.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem w panelu Dashboard](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Węzły](/pl/nodes)
