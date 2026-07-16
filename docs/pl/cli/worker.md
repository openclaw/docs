---
read_when:
    - Obsługa lub debugowanie pracowników chmurowych uruchamianych przez Gateway
    - Weryfikowanie dopuszczenia procesu roboczego, przypisania sesji lub izolacji narzędzi lokalnych
summary: Wewnętrzna dokumentacja operatora dotycząca środowiska uruchomieniowego pracownika chmurowego o ograniczonym dostępie
title: Proces roboczy
x-i18n:
    generated_at: "2026-07-16T18:30:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` jest punktem wejścia ograniczonego środowiska uruchomieniowego, przeznaczonym do uruchamiania przez orkiestrator pracowników chmurowych
w przygotowanym środowisku pracownika. Nie jest to
polecenie ogólnego przeznaczenia do ręcznej rejestracji pracowników.

Gateway instaluje pasujący pakiet OpenClaw i otwiera odwrotny tunel SSH
z przypiętym kluczem hosta. Program uruchamiający pracownika uruchamia to polecenie z przygotowanym
przydziałem. Polecenie łączy się przez lokalne gniazdo przekierowane w tunelu i
uzyskuje dostęp w dedykowanej roli `worker`.

## Kontrakt uruchomienia

Polecenie odczytuje ze standardowego wejścia dokładnie jedną ograniczoną kopertę uruchomieniową JSON.
Koperta zawiera lokalizację lokalnego gniazda, wygenerowane poświadczenie pracownika, tożsamość
pakietu i protokołu, epokę właściciela oraz pojedynczą przypisaną sesję i turę.
Poświadczenie nigdy nie jest przyjmowane za pośrednictwem argumentów wiersza poleceń, a ta strona
celowo nie zawiera przykładu poświadczenia ani ręcznie utworzonej koperty.

Dopuszczenie kończy się bezpieczną odmową, jeśli koperta jest nieprawidłowa, poświadczenie zostanie odrzucone,
funkcje pakietu lub protokołu nie są zgodne albo sesja i epoka właściciela
nie są już aktualne. Operatorzy powinni uruchamiać pracowników za pośrednictwem orkiestratora pracowników
chmurowych, zamiast bezpośrednio wywoływać ten punkt wejścia.

## Granica środowiska uruchomieniowego

Proces uruchamia standardową osadzoną pętlę agenta z ograniczonym backendem:

- Narzędzia programistyczne `read`, `write`, `edit`, `apply_patch`, `exec` i `process`
  działają lokalnie w przestrzeni roboczej pracownika.
- Wywołania modelu korzystają z proxy wnioskowania Gateway. Lokalny profil uwierzytelniania modelu
  nie jest wczytywany.
- Zapisy transkrypcji korzystają z RPC zatwierdzania transkrypcji Gateway.
- Aktualizacje strumieniowania i cyklu życia narzędzi korzystają z RPC zdarzeń na żywo Gateway.
- Akceptowane są tylko przypisana sesja i tura.

Tryb pracownika nie uruchamia kanałów, interfejsów HTTP Gateway ani automatycznego uruchamiania pluginów
poza zestawem narzędzi przypisanej sesji. Korzysta z jednorazowego katalogu stanu i nie ma
stałych poświadczeń dostawcy ani platformy forge.

W tym trybie wysyłanie sesji między pracownikami nie jest udostępniane. Rozmieszczanie i
wysyłanie pozostają zarządzane przez Gateway: operator może wysłać istniejącą lokalną
sesję zarządzanego drzewa roboczego za pośrednictwem Gateway, natomiast proces pracownika nie może
wysłać sam siebie ani innego pracownika.

Przygotowany przydział zawiera kontekst transkrypcji, zaakceptowany liść bazowy,
sekwencję zatwierdzeń i kursor zdarzeń na żywo. Po ponownym połączeniu tunelu proces
ponownie uzyskuje dostęp przy użyciu tego samego poświadczenia i tej samej epoki właściciela, zachowuje zaakceptowaną
bazę transkrypcji, odtwarza niepotwierdzoną końcówkę zdarzeń na żywo i ponownie dołącza
trwającą turę wnioskowania z tą samą tożsamością. Końcowy komunikat wnioskowania
jest miarodajny, jeśli pominięto strumieniowane delty. Nadrzędna epoka właściciela
odcina proces i powoduje jego prawidłowe zakończenie.

Odrzucenie transkrypcji `stale-base-leaf` natychmiast zatrzymuje bieżące uruchomienie. Tryb pracownika
nie ponawia odrzuconej sekwencji względem innego liścia, więc nie powstaje
zduplikowane zatwierdzenie; niezatwierdzona końcówka przechowywana w pamięci z tego
uruchomienia zostaje utracona. Ponowne uruchomienie należy do właściciela rozmieszczania etapu 3, który musi
utworzyć nowy przydział na podstawie miarodajnej transkrypcji Gateway i
rejestru zatwierdzeń. Analogicznie ponowne uruchomienie procesu Gateway kończy oczekującą
turę wnioskowania błędem dostawcy; tylko ponowne połączenie tunelu lub połączenia WebSocket
pracownika może ponownie dołączyć do aktywnego strumienia wnioskowania tego samego procesu.

Zobacz [Protokół Gateway](/pl/gateway/protocol#worker-role-and-closed-protocol), aby poznać
zamknięty interfejs RPC pracownika, oraz [Plan pracowników chmurowych](/pl/plan/cloud-workers), aby poznać
architekturę i model zabezpieczeń.
