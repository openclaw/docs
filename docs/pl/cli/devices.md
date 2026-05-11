---
read_when:
    - Zatwierdzasz prośby o parowanie urządzeń
    - Musisz rotować lub unieważniać tokeny urządzeń
summary: Dokumentacja CLI dla `openclaw devices` (parowanie urządzenia + rotacja/odwoływanie tokenów)
title: Urządzenia
x-i18n:
    generated_at: "2026-05-11T20:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b38caf47697d5fd6c630285c53919f3a5eaf704b1992e57adb1902e20e2a0fc0
    source_path: cli/devices.md
    workflow: 16
---

# `openclaw devices`

Zarządzaj żądaniami parowania urządzeń i tokenami o zakresie urządzenia.

## Polecenia

### `openclaw devices list`

Wyświetl oczekujące żądania parowania i sparowane urządzenia.

```
openclaw devices list
openclaw devices list --json
```

Dane wyjściowe oczekującego żądania pokazują żądany dostęp obok aktualnie
zatwierdzonego dostępu urządzenia, gdy urządzenie jest już sparowane. Dzięki temu
podniesienie zakresu/roli jest jawne, zamiast wyglądać tak, jakby parowanie zostało utracone.

### `openclaw devices remove <deviceId>`

Usuń jeden wpis sparowanego urządzenia.

Gdy jesteś uwierzytelniony tokenem sparowanego urządzenia, wywołujący bez uprawnień administratora mogą
usunąć tylko wpis **własnego** urządzenia. Usunięcie innego urządzenia wymaga
`operator.admin`.

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

Zatwierdź oczekujące żądanie parowania urządzenia według dokładnego `requestId`. Jeśli `requestId`
zostanie pominięte lub przekazano `--latest`, OpenClaw tylko wypisze wybrane oczekujące
żądanie i zakończy działanie; uruchom zatwierdzanie ponownie z dokładnym identyfikatorem żądania po zweryfikowaniu
szczegółów.

<Note>
Jeśli urządzenie ponawia parowanie ze zmienionymi szczegółami uwierzytelniania (rolą, zakresami lub kluczem publicznym), OpenClaw zastępuje poprzedni oczekujący wpis i wydaje nowe `requestId`. Uruchom `openclaw devices list` tuż przed zatwierdzeniem, aby użyć bieżącego ID.
</Note>

Jeśli urządzenie jest już sparowane i prosi o szersze zakresy lub szerszą rolę,
OpenClaw zachowuje istniejące zatwierdzenie i tworzy nowe oczekujące żądanie
podniesienia uprawnień. Przejrzyj kolumny `Requested` i `Approved` w `openclaw devices list`
albo użyj `openclaw devices approve --latest`, aby podejrzeć dokładne podniesienie uprawnień przed
jego zatwierdzeniem.

Jeśli Gateway jest jawnie skonfigurowany z
`gateway.nodes.pairing.autoApproveCidrs`, pierwsze żądania `role: node` z
pasujących adresów IP klientów mogą zostać zatwierdzone, zanim pojawią się na tej liście. Ta polityka
jest domyślnie wyłączona i nigdy nie dotyczy klientów operatora/przeglądarkowych ani żądań
podniesienia uprawnień.

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

Zrotuj token urządzenia dla konkretnej roli (opcjonalnie aktualizując zakresy).
Rola docelowa musi już istnieć w zatwierdzonym kontrakcie parowania tego urządzenia;
rotacja nie może wygenerować nowej, niezatwierdzonej roli.
Jeśli pominiesz `--scope`, późniejsze ponowne połączenia z zapisanym zrotowanym tokenem ponownie użyją
buforowanych zatwierdzonych zakresów tego tokenu. Jeśli przekażesz jawne wartości `--scope`, staną się one
zapisanym zestawem zakresów dla przyszłych ponownych połączeń z buforowanym tokenem.
Wywołujący bez uprawnień administratora korzystający ze sparowanego urządzenia mogą rotować tylko token **własnego** urządzenia.
Docelowy zestaw zakresów tokenu musi mieścić się w zakresach operatora własnej sesji
wywołującego; rotacja nie może wygenerować ani zachować szerszego tokenu operatora niż ten,
który wywołujący już ma.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Zwraca metadane rotacji jako JSON. Jeśli wywołujący rotuje własny token, będąc
uwierzytelnionym tym tokenem urządzenia, odpowiedź zawiera także token zastępczy,
aby klient mógł go utrwalić przed ponownym połączeniem. Rotacje współdzielone/administracyjne
nie zwracają tokenu bearer.

### `openclaw devices revoke --device <id> --role <role>`

Unieważnij token urządzenia dla konkretnej roli.

Wywołujący bez uprawnień administratora korzystający ze sparowanego urządzenia mogą unieważnić tylko token **własnego** urządzenia.
Unieważnienie tokenu innego urządzenia wymaga `operator.admin`.
Docelowy zestaw zakresów tokenu musi także mieścić się w zakresach operatora własnej sesji
wywołującego; wywołujący wyłącznie z parowaniem nie mogą unieważniać tokenów operatora admin/write.

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
Gdy ustawisz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska. Przekaż jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.
</Warning>

## Uwagi

- Rotacja tokenu zwraca nowy token (wrażliwy). Traktuj go jak sekret.
- Te polecenia wymagają zakresu `operator.pairing` (lub `operator.admin`). Niektóre
  zatwierdzenia wymagają także, aby wywołujący posiadał zakresy operatora, które docelowe
  urządzenie wygenerowałoby lub odziedziczyło; zobacz [Zakresy operatora](/pl/gateway/operator-scopes).
- `gateway.nodes.pairing.autoApproveCidrs` to opcjonalna polityka Gateway tylko dla
  świeżego parowania urządzeń node; nie zmienia uprawnień zatwierdzania w CLI.
- Rotacja i unieważnianie tokenów pozostają w obrębie zatwierdzonego zestawu ról parowania oraz
  zatwierdzonej bazowej linii zakresów dla tego urządzenia. Zabłąkany wpis buforowanego tokenu nie
  przyznaje celu zarządzania tokenami.
- W sesjach tokenów sparowanego urządzenia zarządzanie między urządzeniami jest dostępne tylko dla administratora:
  `remove`, `rotate` i `revoke` dotyczą tylko własnego urządzenia, chyba że wywołujący ma
  `operator.admin`.
- Mutacja tokenu jest także ograniczona zakresem wywołującego: sesja tylko do parowania nie może
  rotować ani unieważnić tokenu, który obecnie niesie `operator.admin` lub
  `operator.write`.
- `devices clear` jest celowo bramkowane przez `--yes`.
- Jeśli zakres parowania jest niedostępny przez local loopback (i nie przekazano jawnego `--url`), list/approve może użyć lokalnego mechanizmu zastępczego parowania.
- `devices approve` wymaga jawnego ID żądania przed wygenerowaniem tokenów; pominięcie `requestId` lub przekazanie `--latest` tylko pokazuje podgląd najnowszego oczekującego żądania.

## Lista kontrolna odzyskiwania po rozbieżności tokenów

Użyj tego, gdy Control UI lub inni klienci nadal kończą się niepowodzeniem z `AUTH_TOKEN_MISMATCH`, `AUTH_DEVICE_TOKEN_MISMATCH` lub `AUTH_SCOPE_MISMATCH`.

1. Potwierdź bieżące źródło tokenu Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Wyświetl sparowane urządzenia i zidentyfikuj ID urządzenia, którego dotyczy problem:

```bash
openclaw devices list
```

3. Zrotuj token operatora dla urządzenia, którego dotyczy problem:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Jeśli rotacja nie wystarczy, usuń przestarzałe parowanie i zatwierdź ponownie:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Ponów próbę połączenia klienta z bieżącym współdzielonym tokenem/hasłem.

Uwagi:

- Normalny priorytet uwierzytelniania przy ponownym połączeniu to najpierw jawny współdzielony token/hasło, potem jawny `deviceToken`, potem zapisany token urządzenia, a następnie token bootstrap.
- Zaufane odzyskiwanie po `AUTH_TOKEN_MISMATCH` może tymczasowo wysłać razem współdzielony token i zapisany token urządzenia w ramach jednej ograniczonej ponownej próby.
- `AUTH_SCOPE_MISMATCH` oznacza, że token urządzenia został rozpoznany, ale nie niesie żądanego zestawu zakresów; napraw kontrakt zatwierdzenia parowania/zakresu przed zmianą współdzielonego uwierzytelniania Gateway.

Powiązane:

- [Rozwiązywanie problemów z uwierzytelnianiem pulpitu](/pl/web/dashboard#if-you-see-unauthorized-1008)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Nodes](/pl/nodes)
