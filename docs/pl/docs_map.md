---
read_when: Finding which docs page covers a topic before reading the page
summary: Wygenerowana mapa nagłówków dla stron dokumentacji OpenClaw
title: Mapa dokumentacji
x-i18n:
    generated_at: "2026-07-04T04:09:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1f240dc2ccee730a5d3b0cc3695d0ed17429dff4a0e0ffff8569ac92e34231ea
    source_path: docs_map.md
    workflow: 16
---

# Mapa dokumentacji OpenClaw

Ten plik jest generowany z nagłówków `docs/**/*.md` i `docs/**/*.mdx`, aby pomóc agentom poruszać się po drzewie dokumentacji.
Nie edytuj go ręcznie; uruchom `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Trasa: /agent-runtime-architecture
- Nagłówki:
  - H2: Układ runtime
  - H2: Granice
  - H2: Manifesty
  - H2: Wybór runtime
  - H2: Powiązane

## announcements/bluebubbles-imessage.md

- Trasa: /announcements/bluebubbles-imessage
- Nagłówki:
  - H1: Usunięcie BlueBubbles i ścieżka iMessage przez imsg
  - H2: Co się zmieniło
  - H2: Co zrobić
  - H2: Uwagi migracyjne
  - H2: Zobacz także

## auth-credential-semantics.md

- Trasa: /auth-credential-semantics
- Nagłówki:
  - H2: Stabilne kody powodów sondowania
  - H2: Dane uwierzytelniające tokenu
  - H3: Reguły kwalifikowalności
  - H3: Reguły rozpoznawania
  - H2: Przenośność kopii agenta
  - H2: Trasy uwierzytelniania tylko przez konfigurację
  - H2: Jawne filtrowanie kolejności uwierzytelniania
  - H2: Rozpoznawanie celu sondowania
  - H2: Wykrywanie danych uwierzytelniających zewnętrznego CLI
  - H2: Strażnik zasad OAuth SecretRef
  - H2: Komunikaty zgodne ze starszymi wersjami
  - H2: Powiązane

## automation/auth-monitoring.md

- Trasa: /automation/auth-monitoring
- Nagłówki:
  - H2: Powiązane

## automation/clawflow.md

- Trasa: /automation/clawflow
- Nagłówki:
  - H2: Powiązane

## automation/cron-jobs.md

- Trasa: /automation/cron-jobs
- Nagłówki:
  - H2: Szybki start
  - H2: Jak działa Cron
  - H2: Typy harmonogramów
  - H3: Dzień miesiąca i dzień tygodnia używają logiki OR
  - H2: Style wykonywania
  - H3: Ładunki poleceń
  - H3: Opcje ładunku dla izolowanych zadań
  - H2: Dostarczanie i wynik
  - H2: Język wyniku
  - H2: Przykłady CLI
  - H2: Webhooki
  - H3: Uwierzytelnianie
  - H2: Integracja Gmail PubSub
  - H3: Konfiguracja kreatorem (zalecana)
  - H3: Automatyczne uruchamianie Gateway
  - H3: Ręczna jednorazowa konfiguracja
  - H3: Nadpisanie modelu Gmail
  - H2: Zarządzanie zadaniami
  - H2: Konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Drabina poleceń
  - H2: Powiązane

## automation/cron-vs-heartbeat.md

- Trasa: /automation/cron-vs-heartbeat
- Nagłówki:
  - H2: Powiązane

## automation/gmail-pubsub.md

- Trasa: /automation/gmail-pubsub
- Nagłówki:
  - H2: Powiązane

## automation/hooks.md

- Trasa: /automation/hooks
- Nagłówki:
  - H2: Wybierz właściwą powierzchnię
  - H2: Szybki start
  - H2: Typy zdarzeń
  - H2: Pisanie hooków
  - H3: Struktura hooka
  - H3: Format HOOK.md
  - H3: Implementacja handlera
  - H3: Najważniejsze elementy kontekstu zdarzenia
  - H2: Wykrywanie hooków
  - H3: Pakiety hooków
  - H2: Dołączone hooki
  - H3: szczegóły session-memory
  - H3: konfiguracja bootstrap-extra-files
  - H3: szczegóły command-logger
  - H3: szczegóły compaction-notifier
  - H3: szczegóły boot-md
  - H2: Hooki Plugin
  - H2: Konfiguracja
  - H2: Odwołanie CLI
  - H2: Najlepsze praktyki
  - H2: Rozwiązywanie problemów
  - H3: Hook nie został wykryty
  - H3: Hook nie kwalifikuje się
  - H3: Hook się nie wykonuje
  - H2: Powiązane

## automation/index.md

- Trasa: /automation
- Nagłówki:
  - H2: Szybki przewodnik decyzyjny
  - H3: Zaplanowane zadania (Cron) kontra Heartbeat
  - H2: Podstawowe pojęcia
  - H3: Zaplanowane zadania (Cron)
  - H3: Zadania
  - H3: Wywnioskowane zobowiązania
  - H3: TaskFlow
  - H3: Stałe dyspozycje
  - H3: Hooki
  - H3: Heartbeat
  - H2: Jak działają razem
  - H2: Powiązane

## automation/poll.md

- Trasa: /automation/poll
- Nagłówki:
  - H2: Powiązane

## automation/standing-orders.md

- Trasa: /automation/standing-orders
- Nagłówki:
  - H2: Dlaczego stałe dyspozycje
  - H2: Jak działają
  - H2: Anatomia stałej dyspozycji
  - H2: Stałe dyspozycje plus zadania Cron
  - H2: Przykłady
  - H3: Przykład 1: treści i media społecznościowe (cykl tygodniowy)
  - H3: Przykład 2: operacje finansowe (wyzwalane zdarzeniem)
  - H3: Przykład 3: monitorowanie i alerty (ciągłe)
  - H2: Wzorzec wykonaj-zweryfikuj-zaraportuj
  - H2: Architektura wieloprogramowa
  - H2: Najlepsze praktyki
  - H3: Rób
  - H3: Unikaj
  - H2: Powiązane

## automation/taskflow.md

- Trasa: /automation/taskflow
- Nagłówki:
  - H2: Kiedy używać TaskFlow
  - H2: Niezawodny wzorzec zaplanowanego workflow
  - H2: Tryby synchronizacji
  - H3: Tryb zarządzany
  - H3: Tryb lustrzany
  - H2: Trwały stan i śledzenie rewizji
  - H2: Zachowanie anulowania
  - H2: Polecenia CLI
  - H2: Jak przepływy odnoszą się do zadań
  - H2: Powiązane

## automation/tasks.md

- Trasa: /automation/tasks
- Nagłówki:
  - H2: TL;DR
  - H2: Szybki start
  - H2: Co tworzy zadanie
  - H2: Cykl życia zadania
  - H2: Dostarczanie i powiadomienia
  - H3: Zasady powiadomień
  - H2: Odwołanie CLI
  - H2: Tablica zadań czatu (/tasks)
  - H2: Integracja statusu (presja zadań)
  - H2: Przechowywanie i konserwacja
  - H3: Gdzie znajdują się zadania
  - H3: Automatyczna konserwacja
  - H2: Jak zadania odnoszą się do innych systemów
  - H2: Powiązane

## automation/troubleshooting.md

- Trasa: /automation/troubleshooting
- Nagłówki:
  - H2: Powiązane

## automation/webhook.md

- Trasa: /automation/webhook
- Nagłówki:
  - H2: Powiązane

## brave-search.md

- Trasa: /brave-search
- Nagłówki:
  - H2: Powiązane

## channels/access-groups.md

- Trasa: /channels/access-groups
- Nagłówki:
  - H2: Statyczne grupy nadawców wiadomości
  - H2: Grupy referencyjne z list dozwolonych
  - H2: Obsługiwane ścieżki kanałów wiadomości
  - H2: Diagnostyka Plugin
  - H2: Odbiorcy kanałów Discord
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Rozwiązywanie problemów

## channels/ambient-room-events.md

- Trasa: /channels/ambient-room-events
- Nagłówki:
  - H2: Zalecana konfiguracja
  - H2: Co się zmienia
  - H2: Przykład Discord
  - H2: Przykład Slack
  - H2: Przykład Telegram
  - H2: Zasady specyficzne dla agenta
  - H2: Widoczne tryby odpowiedzi
  - H2: Historia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/bot-loop-protection.md

- Trasa: /channels/bot-loop-protection
- Nagłówki:
  - H1: Ochrona przed pętlą botów
  - H2: Domyślne ustawienia
  - H2: Konfiguracja współdzielonych ustawień domyślnych
  - H2: Nadpisanie dla kanału lub konta
  - H2: Obsługa kanałów

## channels/broadcast-groups.md

- Trasa: /channels/broadcast-groups
- Nagłówki:
  - H2: Omówienie
  - H2: Przypadki użycia
  - H2: Konfiguracja
  - H3: Podstawowa konfiguracja
  - H3: Strategia przetwarzania
  - H3: Pełny przykład
  - H2: Jak to działa
  - H3: Przepływ wiadomości
  - H3: Izolacja sesji
  - H3: Przykład: izolowane sesje
  - H2: Najlepsze praktyki
  - H2: Zgodność
  - H3: Dostawcy
  - H3: Routing
  - H2: Rozwiązywanie problemów
  - H2: Przykłady
  - H2: Odwołanie API
  - H3: Schemat konfiguracji
  - H3: Pola
  - H2: Ograniczenia
  - H2: Przyszłe ulepszenia
  - H2: Powiązane

## channels/channel-routing.md

- Trasa: /channels/channel-routing
- Nagłówki:
  - H1: Kanały i routing
  - H2: Kluczowe terminy
  - H2: Prefiksy celów wychodzących
  - H2: Kształty kluczy sesji (przykłady)
  - H2: Przypięcie głównej trasy DM
  - H2: Strzeżone rejestrowanie przychodzące
  - H2: Reguły routingu (jak wybierany jest agent)
  - H2: Grupy rozgłoszeniowe (uruchamianie wielu agentów)
  - H2: Omówienie konfiguracji
  - H2: Przechowywanie sesji
  - H2: Zachowanie WebChat
  - H2: Kontekst odpowiedzi
  - H2: Powiązane

## channels/clickclack.md

- Trasa: /channels/clickclack
- Nagłówki:
  - H2: Szybka konfiguracja
  - H2: Wiele botów
  - H2: Cele
  - H2: Uprawnienia
  - H2: Rozwiązywanie problemów

## channels/discord.md

- Trasa: /channels/discord
- Nagłówki:
  - H2: Szybka konfiguracja
  - H2: Zalecane: skonfiguruj obszar roboczy gildii
  - H2: Model runtime
  - H2: Kanały forum
  - H2: Komponenty interaktywne
  - H2: Kontrola dostępu i routing
  - H3: Routing agentów oparty na rolach
  - H2: Polecenia natywne i uwierzytelnianie poleceń
  - H2: Szczegóły funkcji
  - H2: Narzędzia i bramki akcji
  - H2: UI Components v2
  - H2: Głos
  - H3: Kanały głosowe
  - H3: Śledzenie użytkowników w głosie
  - H3: Wiadomości głosowe
  - H2: Rozwiązywanie problemów
  - H2: Odwołanie konfiguracji
  - H2: Bezpieczeństwo i operacje
  - H2: Powiązane

## channels/feishu.md

- Trasa: /channels/feishu
- Nagłówki:
  - H2: Szybki start
  - H2: Kontrola dostępu
  - H3: Wiadomości bezpośrednie
  - H3: Czaty grupowe
  - H2: Przykłady konfiguracji grup
  - H3: Zezwalaj na wszystkie grupy, wzmianka @ nie jest wymagana
  - H3: Zezwalaj na wszystkie grupy, nadal wymagaj wzmianki @
  - H3: Zezwalaj tylko na określone grupy
  - H3: Ogranicz nadawców w grupie
  - H2: Pobieranie identyfikatorów grup/użytkowników
  - H3: Identyfikatory grup (chatid, format: ocxxx)
  - H3: Identyfikatory użytkowników (openid, format: ouxxx)
  - H2: Typowe polecenia
  - H2: Rozwiązywanie problemów
  - H3: Bot nie odpowiada w czatach grupowych
  - H3: Bot nie odbiera wiadomości
  - H3: Konfiguracja QR nie reaguje w aplikacji mobilnej Feishu
  - H3: App Secret ujawniony
  - H2: Konfiguracja zaawansowana
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Streaming
  - H3: Optymalizacja limitów
  - H3: Sesje ACP
  - H4: Trwałe powiązanie ACP
  - H4: Uruchamianie ACP z czatu
  - H3: Routing wielu agentów
  - H2: Izolacja agenta dla użytkownika (dynamiczne tworzenie agenta)
  - H3: Szybka konfiguracja
  - H3: Jak to działa
  - H3: Opcje konfiguracji
  - H3: Zakres sesji
  - H3: Typowe wdrożenie wieloużytkownikowe
  - H3: Weryfikacja
  - H3: Uwagi
  - H2: Odwołanie konfiguracji
  - H2: Obsługiwane typy wiadomości
  - H3: Odbieranie
  - H3: Wysyłanie
  - H3: Wątki i odpowiedzi
  - H2: Powiązane

## channels/googlechat.md

- Trasa: /channels/googlechat
- Nagłówki:
  - H2: Instalacja
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Dodaj do Google Chat
  - H2: Publiczny URL (tylko Webhook)
  - H3: Opcja A: Tailscale Funnel (zalecane)
  - H3: Opcja B: Reverse Proxy (Caddy)
  - H3: Opcja C: Cloudflare Tunnel
  - H2: Jak to działa
  - H2: Cele
  - H2: Najważniejsze elementy konfiguracji
  - H2: Rozwiązywanie problemów
  - H3: 405 Method Not Allowed
  - H3: Inne problemy
  - H2: Powiązane

## channels/group-messages.md

- Trasa: /channels/group-messages
- Nagłówki:
  - H2: Zachowanie
  - H2: Przykład konfiguracji (WhatsApp)
  - H3: Polecenie aktywacji (tylko właściciel)
  - H2: Jak używać
  - H2: Testowanie / weryfikacja
  - H2: Znane kwestie
  - H2: Powiązane

## channels/groups.md

- Trasa: /channels/groups
- Nagłówki:
  - H2: Wprowadzenie dla początkujących (2 minuty)
  - H2: Widoczne odpowiedzi
  - H2: Widoczność kontekstu i listy dozwolonych
  - H2: Klucze sesji
  - H2: Wzorzec: osobiste DM + grupy publiczne (pojedynczy agent)
  - H2: Etykiety wyświetlania
  - H2: Zasady grup
  - H2: Bramkowanie wzmianką (domyślnie)
  - H2: Zakres skonfigurowanych wzorców wzmianek
  - H2: Ograniczenia narzędzi grupy/kanału (opcjonalne)
  - H2: Listy dozwolonych grup
  - H2: Aktywacja (tylko właściciel)
  - H2: Pola kontekstu
  - H2: Szczegóły iMessage
  - H2: Prompty systemowe WhatsApp
  - H2: Szczegóły WhatsApp
  - H2: Powiązane

## channels/imessage-from-bluebubbles.md

- Trasa: /channels/imessage-from-bluebubbles
- Nagłówki:
  - H2: Lista kontrolna migracji
  - H2: Kiedy ta migracja ma sens
  - H2: Co robi imsg
  - H2: Zanim zaczniesz
  - H2: Tłumaczenie konfiguracji
  - H2: Pułapka rejestru grup
  - H2: Krok po kroku
  - H2: Parzystość akcji w skrócie
  - H2: Parowanie, sesje i powiązania ACP
  - H2: Brak kanału wycofania
  - H2: Powiązane

## channels/imessage.md

- Trasa: /channels/imessage
- Nagłówki:
  - H2: Szybka konfiguracja
  - H2: Wymagania i uprawnienia (macOS)
  - H2: Włączanie prywatnego API imsg
  - H3: Konfiguracja
  - H3: Gdy nie możesz wyłączyć SIP
  - H2: Kontrola dostępu i routing
  - H2: Powiązania konwersacji ACP
  - H2: Wzorce wdrożeń
  - H2: Media, porcjowanie i cele dostarczania
  - H2: Akcje prywatnego API
  - H2: Zapisy konfiguracji
  - H2: Scalanie podzielonych wysyłek DM (polecenie + URL w jednej kompozycji)
  - H3: Scenariusze i to, co widzi agent
  - H2: Odzyskiwanie przychodzące po ponownym uruchomieniu mostu lub Gateway
  - H3: Sygnał widoczny dla operatora
  - H3: Migracja
  - H2: Rozwiązywanie problemów
  - H2: Wskaźniki odwołania konfiguracji
  - H2: Powiązane

## channels/index.md

- Trasa: /channels
- Nagłówki:
  - H2: Uwagi dotyczące dostarczania
  - H2: Obsługiwane kanały
  - H2: Uwagi

## channels/irc.md

- Trasa: /channels/irc
- Nagłówki:
  - H2: Szybki start
  - H2: Domyślne ustawienia bezpieczeństwa
  - H2: Kontrola dostępu
  - H3: Częsty haczyk: allowFrom dotyczy DM, nie kanałów
  - H2: Wyzwalanie odpowiedzi (wzmianki)
  - H2: Uwaga dotycząca bezpieczeństwa (zalecane dla kanałów publicznych)
  - H3: Te same narzędzia dla wszystkich w kanale
  - H3: Różne narzędzia dla poszczególnych nadawców (właściciel ma większe uprawnienia)
  - H2: NickServ
  - H2: Zmienne środowiskowe
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/line.md

- Ścieżka: /channels/line
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H2: Kontrola dostępu
  - H2: Zachowanie wiadomości
  - H2: Dane kanału (wiadomości rozszerzone)
  - H2: Obsługa ACP
  - H2: Media wychodzące
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/location.md

- Ścieżka: /channels/location
- Nagłówki:
  - H2: Formatowanie tekstu
  - H2: Pola kontekstu
  - H2: Uwagi dotyczące kanału
  - H2: Powiązane

## channels/matrix-migration.md

- Ścieżka: /channels/matrix-migration
- Nagłówki:
  - H2: Co migracja robi automatycznie
  - H2: Czego migracja nie może zrobić automatycznie
  - H2: Zalecany przepływ aktualizacji
  - H2: Jak działa migracja zaszyfrowana
  - H2: Typowe komunikaty i ich znaczenie
  - H3: Komunikaty aktualizacji i wykrywania
  - H3: Komunikaty odzyskiwania stanu szyfrowanego
  - H3: Komunikaty odzyskiwania ręcznego
  - H3: Komunikaty instalacji niestandardowego pluginu
  - H2: Jeśli zaszyfrowana historia nadal nie wraca
  - H2: Jeśli chcesz zacząć od nowa dla przyszłych wiadomości
  - H2: Powiązane

## channels/matrix-presentation.md

- Ścieżka: /channels/matrix-presentation
- Nagłówki:
  - H2: Zawartość zdarzenia
  - H2: Zachowanie awaryjne
  - H2: Obsługiwane bloki
  - H2: Interakcje
  - H2: Relacja z metadanymi zatwierdzania
  - H2: Wiadomości multimedialne

## channels/matrix-push-rules.md

- Ścieżka: /channels/matrix-push-rules
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Kroki
  - H2: Uwagi dotyczące wielu botów
  - H2: Uwagi dotyczące homeservera
  - H2: Powiązane

## channels/matrix.md

- Ścieżka: /channels/matrix
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H3: Konfiguracja interaktywna
  - H3: Minimalna konfiguracja
  - H3: Automatyczne dołączanie
  - H3: Formaty celów listy dozwolonych
  - H3: Normalizacja identyfikatora konta
  - H3: Dane logowania w pamięci podręcznej
  - H3: Zmienne środowiskowe
  - H2: Przykład konfiguracji
  - H2: Podglądy strumieniowe
  - H2: Wiadomości głosowe
  - H2: Metadane zatwierdzania
  - H3: Samodzielnie hostowane reguły push dla cichych sfinalizowanych podglądów
  - H2: Pokoje bot-bot
  - H2: Szyfrowanie i weryfikacja
  - H3: Włącz szyfrowanie
  - H3: Sygnały statusu i zaufania
  - H3: Zweryfikuj to urządzenie kluczem odzyskiwania
  - H3: Zainicjuj lub napraw podpisywanie krzyżowe
  - H3: Kopia zapasowa kluczy pokoi
  - H3: Wyświetlanie, żądanie i odpowiadanie na weryfikacje
  - H3: Uwagi dotyczące wielu kont
  - H2: Zarządzanie profilem
  - H2: Wątki
  - H3: Routing sesji (sessionScope)
  - H3: Odpowiedzi w wątkach (threadReplies)
  - H3: Dziedziczenie wątków i polecenia slash
  - H2: Powiązania konwersacji ACP
  - H3: Konfiguracja powiązania wątku
  - H2: Reakcje
  - H2: Kontekst historii
  - H2: Widoczność kontekstu
  - H2: Zasady DM i pokoi
  - H2: Naprawa pokoi bezpośrednich
  - H2: Zatwierdzenia wykonywania
  - H2: Polecenia slash
  - H2: Wiele kont
  - H2: Prywatne/LAN homeservery
  - H2: Proxy ruchu Matrix
  - H2: Rozwiązywanie celów
  - H2: Dokumentacja konfiguracji
  - H3: Konto i połączenie
  - H3: Szyfrowanie
  - H3: Dostęp i zasady
  - H3: Zachowanie odpowiedzi
  - H3: Ustawienia reakcji
  - H3: Narzędzia i nadpisania dla poszczególnych pokoi
  - H3: Ustawienia zatwierdzania wykonywania
  - H2: Powiązane

## channels/mattermost.md

- Ścieżka: /channels/mattermost
- Nagłówki:
  - H2: Instalacja
  - H2: Szybka konfiguracja
  - H2: Natywne polecenia slash
  - H2: Zmienne środowiskowe (konto domyślne)
  - H2: Tryby czatu
  - H2: Wątki i sesje
  - H2: Kontrola dostępu (DM)
  - H2: Kanały (grupy)
  - H2: Cele dostarczania wychodzącego
  - H2: Ponawianie kanału DM
  - H2: Strumieniowanie podglądu
  - H2: Reakcje (narzędzie wiadomości)
  - H2: Przyciski interaktywne (narzędzie wiadomości)
  - H3: Bezpośrednia integracja API (skrypty zewnętrzne)
  - H2: Adapter katalogu
  - H2: Wiele kont
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/msteams.md

- Ścieżka: /channels/msteams
- Nagłówki:
  - H2: Dołączony plugin
  - H2: Szybka konfiguracja
  - H2: Cele
  - H2: Zapisy konfiguracji
  - H2: Kontrola dostępu (DM + grupy)
  - H3: Jak to działa
  - H3: Krok 1: Utwórz Azure Bot
  - H3: Krok 2: Pobierz dane logowania
  - H3: Krok 3: Skonfiguruj punkt końcowy komunikacji
  - H3: Krok 4: Włącz kanał Teams
  - H3: Krok 5: Zbuduj manifest aplikacji Teams
  - H3: Krok 6: Skonfiguruj OpenClaw
  - H3: Krok 7: Uruchom Gateway
  - H2: Uwierzytelnianie federacyjne (certyfikat plus tożsamość zarządzana)
  - H3: Opcja A: Uwierzytelnianie oparte na certyfikacie
  - H3: Opcja B: Azure Managed Identity
  - H3: Konfiguracja AKS Workload Identity
  - H3: Porównanie typów uwierzytelniania
  - H2: Rozwój lokalny (tunelowanie)
  - H2: Testowanie bota
  - H2: Zmienne środowiskowe
  - H2: Akcja informacji o członku
  - H2: Kontekst historii
  - H2: Bieżące uprawnienia Teams RSC (manifest)
  - H2: Przykładowy manifest Teams (zredagowany)
  - H3: Zastrzeżenia manifestu (pola wymagane)
  - H3: Aktualizowanie istniejącej aplikacji
  - H2: Możliwości: tylko RSC kontra Graph
  - H3: Tylko z Teams RSC (aplikacja zainstalowana, bez uprawnień Graph API)
  - H3: Z Teams RSC + uprawnieniami aplikacji Microsoft Graph
  - H3: RSC kontra Graph API
  - H2: Media + historia z obsługą Graph (wymagane dla kanałów)
  - H2: Znane ograniczenia
  - H3: Limity czasu Webhook
  - H3: Obsługa chmury Teams i adresu URL usługi
  - H3: Formatowanie
  - H2: Konfiguracja
  - H2: Routing i sesje
  - H2: Styl odpowiedzi: wątki kontra wpisy
  - H3: Kolejność rozwiązywania
  - H3: Zachowanie kontekstu wątku
  - H2: Załączniki i obrazy
  - H2: Wysyłanie plików w czatach grupowych
  - H3: Dlaczego czaty grupowe wymagają SharePoint
  - H3: Konfiguracja początkowa
  - H3: Zachowanie udostępniania
  - H3: Zachowanie awaryjne
  - H3: Lokalizacja przechowywania plików
  - H2: Ankiety (Adaptive Cards)
  - H2: Karty prezentacyjne
  - H2: Formaty celów
  - H2: Wiadomości proaktywne
  - H2: Identyfikatory zespołu i kanału (częsta pułapka)
  - H2: Kanały prywatne
  - H2: Rozwiązywanie problemów
  - H3: Typowe problemy
  - H3: Błędy przesyłania manifestu
  - H3: Uprawnienia RSC nie działają
  - H2: Odniesienia
  - H2: Powiązane

## channels/nextcloud-talk.md

- Ścieżka: /channels/nextcloud-talk
- Nagłówki:
  - H2: Dołączony plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Uwagi
  - H2: Kontrola dostępu (DM)
  - H2: Pokoje (grupy)
  - H2: Możliwości
  - H2: Dokumentacja konfiguracji (Nextcloud Talk)
  - H2: Powiązane

## channels/nostr.md

- Ścieżka: /channels/nostr
- Nagłówki:
  - H2: Dołączony plugin
  - H3: Starsze/niestandardowe instalacje
  - H3: Konfiguracja nieinteraktywna
  - H2: Szybka konfiguracja
  - H2: Dokumentacja konfiguracji
  - H2: Metadane profilu
  - H2: Kontrola dostępu
  - H3: Zasady DM
  - H3: Przykład listy dozwolonych
  - H2: Formaty kluczy
  - H2: Przekaźniki
  - H2: Obsługa protokołu
  - H2: Testowanie
  - H3: Przekaźnik lokalny
  - H3: Test ręczny
  - H2: Rozwiązywanie problemów
  - H3: Brak odbierania wiadomości
  - H3: Brak wysyłania odpowiedzi
  - H3: Zduplikowane odpowiedzi
  - H2: Bezpieczeństwo
  - H2: Ograniczenia (MVP)
  - H2: Powiązane

## channels/pairing.md

- Ścieżka: /channels/pairing
- Nagłówki:
  - H2: 1) Parowanie DM (dostęp do czatu przychodzącego)
  - H3: Zatwierdź nadawcę
  - H3: Grupy nadawców wielokrotnego użytku
  - H3: Gdzie znajduje się stan
  - H2: 2) Parowanie urządzenia Node (węzły iOS/Android/macOS/headless)
  - H3: Sparuj przez Telegram (zalecane dla iOS)
  - H3: Zatwierdź urządzenie Node
  - H3: Opcjonalne automatyczne zatwierdzanie Node z zaufanych CIDR
  - H3: Przechowywanie stanu parowania Node
  - H3: Uwagi
  - H2: Powiązana dokumentacja

## channels/qa-channel.md

- Ścieżka: /channels/qa-channel
- Nagłówki:
  - H2: Co robi
  - H2: Konfiguracja
  - H2: Uruchamiacze
  - H2: Powiązane

## channels/qqbot.md

- Ścieżka: /channels/qqbot
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H3: Konfiguracja wielu kont
  - H3: Czaty grupowe
  - H3: Głos (STT / TTS)
  - H2: Formaty celów
  - H2: Polecenia slash
  - H2: Architektura silnika
  - H2: Wdrażanie kodem QR
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/raft.md

- Ścieżka: /channels/raft
- Nagłówki:
  - H2: Instalacja
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Weryfikacja
  - H2: Rozwiązywanie problemów
  - H2: Odniesienia

## channels/signal.md

- Ścieżka: /channels/signal
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Zapisy konfiguracji
  - H2: Model numeru (ważne)
  - H2: Ścieżka konfiguracji A: połącz istniejące konto Signal (QR)
  - H2: Ścieżka konfiguracji B: zarejestruj dedykowany numer bota (SMS, Linux)
  - H2: Tryb zewnętrznego demona (httpUrl)
  - H2: Tryb kontenera (bbernhard/signal-cli-rest-api)
  - H2: Kontrola dostępu (DM + grupy)
  - H2: Jak to działa (zachowanie)
  - H2: Media + limity
  - H2: Pisanie + potwierdzenia odczytu
  - H2: Reakcje statusu cyklu życia
  - H2: Reakcje (narzędzie wiadomości)
  - H2: Reakcje zatwierdzania
  - H2: Cele dostarczania (CLI/cron)
  - H2: Aliasy
  - H2: Rozwiązywanie problemów
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Dokumentacja konfiguracji (Signal)
  - H2: Powiązane

## channels/slack.md

- Ścieżka: /channels/slack
- Nagłówki:
  - H2: Wybór Socket Mode albo adresów URL żądań HTTP
  - H3: Tryb przekaźnika
  - H2: Instalacja
  - H2: Szybka konfiguracja
  - H2: Dostrajanie transportu Socket Mode
  - H2: Lista kontrolna manifestu i zakresów
  - H3: Dodatkowe ustawienia manifestu
  - H2: Model tokenów
  - H2: Akcje i bramki
  - H2: Kontrola dostępu i routing
  - H2: Wątki, sesje i znaczniki odpowiedzi
  - H2: Reakcje potwierdzenia
  - H3: Emoji (ackReaction)
  - H3: Zakres (messages.ackReactionScope)
  - H2: Strumieniowanie tekstu
  - H2: Awaryjna reakcja pisania
  - H2: Media, dzielenie na fragmenty i dostarczanie
  - H2: Polecenia i zachowanie slash
  - H2: Odpowiedzi interaktywne
  - H3: Przesłania modali należące do pluginu
  - H2: Natywne zatwierdzenia w Slack
  - H2: Zdarzenia i zachowanie operacyjne
  - H2: Dokumentacja konfiguracji
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja widzenia załączników
  - H3: Obsługiwane typy mediów
  - H3: Potok przychodzący
  - H3: Dziedziczenie załączników z korzenia wątku
  - H3: Obsługa wielu załączników
  - H3: Rozmiar, pobieranie i limity modelu
  - H3: Znane limity
  - H3: Powiązana dokumentacja
  - H2: Powiązane

## channels/sms.md

- Ścieżka: /channels/sms
- Nagłówki:
  - H2: Zanim zaczniesz
  - H2: Szybka konfiguracja
  - H2: Przykłady konfiguracji
  - H3: Plik konfiguracyjny
  - H3: Zmienne środowiskowe
  - H3: Token uwierzytelniania SecretRef
  - H3: Prywatny numer tylko z listą dozwolonych
  - H3: Nadawca Messaging Service
  - H3: Domyślny cel wychodzący
  - H2: Kontrola dostępu
  - H2: Wysyłanie SMS
  - H2: Weryfikacja konfiguracji
  - H3: Test end-to-end z macOS iMessage/SMS
  - H2: Bezpieczeństwo Webhook
  - H2: Konfiguracja wielu kont
  - H2: Rozwiązywanie problemów
  - H3: Twilio zwraca 403 albo OpenClaw odrzuca Webhook
  - H3: Żądanie parowania się nie pojawia
  - H3: Wysyłanie wychodzące kończy się niepowodzeniem
  - H3: Wiadomości przychodzą, ale agent nie odpowiada

## channels/synology-chat.md

- Ścieżka: /channels/synology-chat
- Nagłówki:
  - H2: Dołączony plugin
  - H2: Szybka konfiguracja
  - H2: Zmienne środowiskowe
  - H2: Zasady DM i kontrola dostępu
  - H2: Dostarczanie wychodzące
  - H2: Wiele kont
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/telegram.md

- Ścieżka: /channels/telegram
- Nagłówki:
  - H2: Szybka konfiguracja
  - H2: Ustawienia po stronie Telegram
  - H2: Kontrola dostępu i aktywacja
  - H3: Tożsamość bota grupowego
  - H2: Zachowanie środowiska wykonawczego
  - H2: Dokumentacja funkcji
  - H2: Kontrolki odpowiedzi na błędy
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Powiązane

## channels/tlon.md

- Ścieżka: /channels/tlon
- Nagłówki:
  - H2: Dołączony plugin
  - H2: Konfiguracja początkowa
  - H2: Prywatne/LAN statki
  - H2: Kanały grupowe
  - H2: Kontrola dostępu
  - H2: Właściciel i system zatwierdzania
  - H2: Ustawienia automatycznego akceptowania
  - H2: Cele dostarczania (CLI/cron)
  - H2: Dołączona umiejętność
  - H2: Możliwości
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## channels/troubleshooting.md

- Ścieżka: /channels/troubleshooting
- Nagłówki:
  - H2: Drabina poleceń
  - H2: Po aktualizacji
  - H2: WhatsApp
  - H3: Sygnatury awarii WhatsApp
  - H2: Telegram
  - H3: Sygnatury awarii Telegram
  - H2: Discord
  - H3: Sygnatury awarii Discord
  - H2: Slack
  - H3: Sygnatury awarii Slack
  - H2: iMessage
  - H3: Sygnatury awarii iMessage
  - H2: Signal
  - H3: Sygnatury awarii Signal
  - H2: QQ Bot
  - H3: Sygnatury awarii QQ Bot
  - H2: Matrix
  - H3: Sygnatury awarii Matrix
  - H2: Powiązane

## channels/twitch.md

- Trasa: /channels/twitch
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Konfiguracja (szczegółowa)
  - H3: Wygeneruj dane uwierzytelniające
  - H3: Skonfiguruj bota
  - H3: Kontrola dostępu (zalecana)
  - H2: Odświeżanie tokenu (opcjonalne)
  - H2: Obsługa wielu kont
  - H2: Kontrola dostępu
  - H2: Rozwiązywanie problemów
  - H2: Konfiguracja
  - H3: Konfiguracja konta
  - H3: Opcje dostawcy
  - H2: Akcje narzędzi
  - H2: Bezpieczeństwo i operacje
  - H2: Limity
  - H2: Powiązane

## channels/wechat.md

- Trasa: /channels/wechat
- Nagłówki:
  - H2: Nazewnictwo
  - H2: Jak to działa
  - H2: Instalacja
  - H2: Logowanie
  - H2: Kontrola dostępu
  - H2: Zgodność
  - H2: Proces pomocniczy
  - H2: Rozwiązywanie problemów
  - H2: Powiązana dokumentacja

## channels/whatsapp.md

- Trasa: /channels/whatsapp
- Nagłówki:
  - H2: Instalacja (na żądanie)
  - H2: Szybka konfiguracja
  - H2: Wzorce wdrożenia
  - H2: Model wykonawczy
  - H2: Monity zatwierdzenia
  - H2: Hooki Plugin i prywatność
  - H2: Kontrola dostępu i aktywacja
  - H2: Skonfigurowane powiązania ACP
  - H2: Zachowanie numeru osobistego i czatu z samym sobą
  - H2: Normalizacja wiadomości i kontekst
  - H2: Dostarczanie, dzielenie na fragmenty i media
  - H2: Cytowanie odpowiedzi
  - H2: Poziom reakcji
  - H2: Reakcje potwierdzenia
  - H2: Reakcje statusu cyklu życia
  - H2: Wiele kont i dane uwierzytelniające
  - H2: Narzędzia, akcje i zapisy konfiguracji
  - H2: Rozwiązywanie problemów
  - H2: Monity systemowe
  - H2: Wskaźniki referencji konfiguracji
  - H2: Powiązane

## channels/yuanbao.md

- Trasa: /channels/yuanbao
- Nagłówki:
  - H2: Szybki start
  - H3: Konfiguracja interaktywna (alternatywa)
  - H2: Kontrola dostępu
  - H3: Wiadomości bezpośrednie
  - H3: Czaty grupowe
  - H2: Przykłady konfiguracji
  - H3: Podstawowa konfiguracja z otwartą polityką DM
  - H3: Ogranicz DM do określonych użytkowników
  - H3: Wyłącz wymóg @wzmianki w grupach
  - H3: Zoptymalizuj dostarczanie wiadomości wychodzących
  - H3: Dostrój strategię merge-text
  - H2: Typowe polecenia
  - H2: Rozwiązywanie problemów
  - H3: Bot nie odpowiada w czatach grupowych
  - H3: Bot nie odbiera wiadomości
  - H3: Bot wysyła puste odpowiedzi lub odpowiedzi awaryjne
  - H3: App Secret wyciekł
  - H2: Konfiguracja zaawansowana
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Strumieniowanie
  - H3: Kontekst historii czatu grupowego
  - H3: Tryb odpowiadania
  - H3: Wstrzykiwanie podpowiedzi Markdown
  - H3: Tryb debugowania
  - H3: Routing wielu agentów
  - H2: Referencja konfiguracji
  - H2: Obsługiwane typy wiadomości
  - H3: Odbieranie
  - H3: Wysyłanie
  - H3: Wątki i odpowiedzi
  - H2: Powiązane

## channels/zalo.md

- Trasa: /channels/zalo
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Konfiguracja (szybka ścieżka)
  - H3: 1) Utwórz token bota (Zalo Bot Platform)
  - H3: 2) Skonfiguruj token (env lub konfiguracja)
  - H2: Jak to działa (zachowanie)
  - H2: Limity
  - H2: Kontrola dostępu (DM)
  - H3: Dostęp DM
  - H2: Kontrola dostępu (grupy)
  - H2: Long-polling a Webhook
  - H2: Obsługiwane typy wiadomości
  - H2: Możliwości
  - H2: Cele dostarczania (CLI/cron)
  - H2: Rozwiązywanie problemów
  - H2: Referencja konfiguracji (Zalo)
  - H2: Powiązane

## channels/zaloclawbot.md

- Trasa: /channels/zaloclawbot
- Nagłówki:
  - H2: Zgodność
  - H2: Wymagania wstępne
  - H2: Instalacja za pomocą onboard (zalecane)
  - H2: Instalacja ręczna
  - H3: 1. Zainstaluj Plugin
  - H3: 2. Włącz Plugin w konfiguracji
  - H3: 3. Wygeneruj kod QR i zaloguj się
  - H3: 4. Uruchom ponownie Gateway
  - H2: Jak to działa
  - H2: Pod spodem
  - H2: Rozwiązywanie problemów

## channels/zalouser.md

- Trasa: /channels/zalouser
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Nazewnictwo
  - H2: Znajdowanie ID (katalog)
  - H2: Limity
  - H2: Kontrola dostępu (DM)
  - H2: Dostęp grupowy (opcjonalny)
  - H3: Bramka wzmianek grupowych
  - H2: Wiele kont
  - H2: Zmienne środowiskowe
  - H2: Pisanie, reakcje i potwierdzenia dostarczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## ci.md

- Trasa: /ci
- Nagłówki:
  - H2: Przegląd potoku
  - H2: Kolejność szybkiego przerywania
  - H2: Kontekst PR i dowody
  - H2: Zakres i routing
  - H2: Przekazywanie aktywności ClawSweeper
  - H2: Ręczne wywołania
  - H2: Runnery
  - H2: Budżet rejestracji runnerów
  - H2: Lokalne odpowiedniki
  - H2: Wydajność OpenClaw
  - H2: Pełna walidacja wydania
  - H2: Shardy live i E2E
  - H2: Akceptacja pakietu
  - H3: Zadania
  - H3: Źródła kandydatów
  - H3: Profile pakietów testów
  - H3: Okna zgodności ze starszymi wersjami
  - H3: Przykłady
  - H2: Smoke test instalacji
  - H2: Lokalne E2E w Dockerze
  - H3: Parametry dostrajania
  - H3: Wielokrotnie używany workflow live/E2E
  - H3: Fragmenty ścieżki wydania
  - H2: Przedwydanie Plugin
  - H2: Laboratorium QA
  - H2: CodeQL
  - H3: Kategorie bezpieczeństwa
  - H3: Shardy bezpieczeństwa specyficzne dla platformy
  - H3: Kategorie krytycznej jakości
  - H2: Workflow utrzymaniowe
  - H3: Agent dokumentacji
  - H3: Agent wydajności testów
  - H3: Zduplikowane PR-y po scaleniu
  - H2: Lokalne bramki sprawdzania i routing zmian
  - H2: Walidacja Testbox
  - H2: Powiązane

## clawhub/cli.md

- Trasa: /clawhub/cli
- Nagłówki:
  - H1: CLI ClawHub
  - H2: Odkrywanie i instalowanie
  - H2: Publikowanie i utrzymywanie
  - H2: Powiązane

## clawhub/publishing.md

- Trasa: /clawhub/publishing
- Nagłówki:
  - H1: Publikowanie w ClawHub
  - H2: Właściciele
  - H2: Skills
  - H2: Plugins
  - H2: Przepływ wydania
  - H2: FAQ
  - H3: Zakres pakietu musi pasować do wybranego właściciela

## cli/acp.md

- Trasa: /cli/acp
- Nagłówki:
  - H2: Czym to nie jest
  - H2: Macierz zgodności
  - H2: Znane ograniczenia
  - H2: Użycie
  - H2: Klient ACP (debug)
  - H2: Smoke testowanie protokołu
  - H2: Jak tego używać
  - H2: Wybieranie agentów
  - H2: Użycie z acpx (Codex, Claude, inni klienci ACP)
  - H2: Konfiguracja edytora Zed
  - H2: Mapowanie sesji
  - H2: Opcje
  - H3: Opcje klienta acp
  - H2: Powiązane

## cli/agent.md

- Trasa: /cli/agent
- Nagłówki:
  - H1: openclaw agent
  - H2: Opcje
  - H2: Przykłady
  - H2: Uwagi
  - H2: Status dostarczania JSON
  - H2: Powiązane

## cli/agents.md

- Trasa: /cli/agents
- Nagłówki:
  - H1: openclaw agents
  - H2: Przykłady
  - H2: Powiązania routingu
  - H3: Format --bind
  - H3: Zachowanie zakresu powiązania
  - H2: Powierzchnia poleceń
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Pliki tożsamości
  - H2: Ustaw tożsamość
  - H2: Powiązane

## cli/approvals.md

- Trasa: /cli/approvals
- Nagłówki:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Typowe polecenia
  - H2: Zastąp zatwierdzenia z pliku
  - H2: Przykład "Never prompt" / YOLO
  - H2: Pomocnicy listy dozwolonych
  - H2: Typowe opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/attach.md

- Trasa: /cli/attach
- Nagłówki: brak

## cli/backup.md

- Trasa: /cli/backup
- Nagłówki:
  - H1: openclaw backup
  - H2: Uwagi
  - H2: Co jest uwzględniane w kopii zapasowej
  - H2: Zachowanie przy nieprawidłowej konfiguracji
  - H2: Rozmiar i wydajność
  - H2: Powiązane

## cli/browser.md

- Trasa: /cli/browser
- Nagłówki:
  - H1: openclaw browser
  - H2: Typowe flagi
  - H2: Szybki start (lokalnie)
  - H2: Szybkie rozwiązywanie problemów
  - H2: Cykl życia
  - H2: Jeśli brakuje polecenia
  - H2: Profile
  - H2: Karty
  - H2: Snapshot / zrzut ekranu / akcje
  - H2: Stan i przechowywanie
  - H2: Debugowanie
  - H2: Istniejący Chrome przez MCP
  - H2: Zdalne sterowanie przeglądarką (proxy hosta Node)
  - H2: Powiązane

## cli/channels.md

- Trasa: /cli/channels
- Nagłówki:
  - H1: openclaw channels
  - H2: Typowe polecenia
  - H2: Status / możliwości / resolve / logi
  - H2: Dodawanie / usuwanie kont
  - H2: Logowanie i wylogowanie (interaktywne)
  - H2: Rozwiązywanie problemów
  - H2: Sonda możliwości
  - H2: Rozwiązywanie nazw na ID
  - H2: Powiązane

## cli/clawbot.md

- Trasa: /cli/clawbot
- Nagłówki:
  - H1: openclaw clawbot
  - H2: Migracja
  - H2: Powiązane

## cli/commitments.md

- Trasa: /cli/commitments
- Nagłówki:
  - H2: Użycie
  - H2: Opcje
  - H2: Przykłady
  - H2: Dane wyjściowe
  - H2: Powiązane

## cli/completion.md

- Trasa: /cli/completion
- Nagłówki:
  - H1: openclaw completion
  - H2: Użycie
  - H2: Opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/config.md

- Trasa: /cli/config
- Nagłówki:
  - H2: Opcje główne
  - H2: Przykłady
  - H3: config schema
  - H3: Ścieżki
  - H2: Wartości
  - H2: Tryby config set
  - H2: config patch
  - H2: Flagi kreatora dostawcy
  - H2: Dry run
  - H3: Kształt wyjścia JSON
  - H2: Bezpieczeństwo zapisu
  - H2: Podpolecenia
  - H2: Walidacja
  - H2: Powiązane

## cli/configure.md

- Trasa: /cli/configure
- Nagłówki:
  - H1: openclaw configure
  - H2: Opcje
  - H2: Przykłady
  - H2: Powiązane

## cli/crestodian.md

- Trasa: /cli/crestodian
- Nagłówki:
  - H1: openclaw crestodian
  - H2: Co pokazuje Crestodian
  - H2: Przykłady
  - H2: Bezpieczne uruchamianie
  - H2: Operacje i zatwierdzanie
  - H2: Bootstrap konfiguracji
  - H2: Planer wspomagany modelem
  - H2: Przełączanie na agenta
  - H2: Tryb ratowania wiadomości
  - H2: Powiązane

## cli/cron.md

- Trasa: /cli/cron
- Nagłówki:
  - H1: openclaw cron
  - H2: Szybkie tworzenie zadań
  - H2: Sesje
  - H2: Dostarczanie
  - H3: Własność dostarczania
  - H3: Dostarczanie przy błędzie
  - H2: Harmonogramowanie
  - H3: Zadania jednorazowe
  - H3: Zadania cykliczne
  - H3: Uruchomienia ręczne
  - H2: Modele
  - H3: Pierwszeństwo izolowanego modelu cron
  - H3: Tryb szybki
  - H3: Ponowne próby przełączania modelu live
  - H2: Dane wyjściowe uruchomienia i odmowy
  - H3: Tłumienie nieaktualnych potwierdzeń
  - H3: Tłumienie cichych tokenów
  - H3: Ustrukturyzowane odmowy
  - H2: Retencja
  - H2: Migracja starszych zadań
  - H2: Typowe edycje
  - H2: Typowe polecenia administracyjne
  - H2: Powiązane

## cli/daemon.md

- Trasa: /cli/daemon
- Nagłówki:
  - H1: openclaw daemon
  - H2: Użycie
  - H2: Podpolecenia
  - H2: Typowe opcje
  - H2: Preferuj
  - H2: Powiązane

## cli/dashboard.md

- Trasa: /cli/dashboard
- Nagłówki:
  - H1: openclaw dashboard
  - H2: Powiązane

## cli/devices.md

- Trasa: /cli/devices
- Nagłówki:
  - H1: openclaw devices
  - H2: Polecenia
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Pierwsze zatwierdzenie Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Typowe opcje
  - H2: Uwagi
  - H2: Lista kontrolna odzyskiwania po rozjechaniu tokenów
  - H2: Powiązane

## cli/directory.md

- Trasa: /cli/directory
- Nagłówki:
  - H1: openclaw directory
  - H2: Typowe flagi
  - H2: Uwagi
  - H2: Używanie wyników z wysyłaniem wiadomości
  - H2: Formaty ID (według kanału)
  - H2: Ja ("me")
  - H2: Peers (kontakty/użytkownicy)
  - H2: Grupy
  - H2: Powiązane

## cli/dns.md

- Trasa: /cli/dns
- Nagłówki:
  - H1: openclaw dns
  - H2: Konfiguracja
  - H2: dns setup
  - H2: Powiązane

## cli/docs.md

- Trasa: /cli/docs
- Nagłówki:
  - H1: openclaw docs
  - H2: Użycie
  - H2: Przykłady
  - H2: Jak to działa
  - H2: Dane wyjściowe
  - H2: Kody wyjścia
  - H2: Powiązane

## cli/doctor.md

- Trasa: /cli/doctor
- Nagłówki:
  - H1: openclaw doctor
  - H2: Dlaczego warto tego używać
  - H2: Przykłady
  - H2: Opcje
  - H2: Tryb lint
  - H2: Ustrukturyzowane kontrole kondycji
  - H2: Wybór kontroli
  - H2: Tryb po aktualizacji
  - H2: macOS: nadpisania env launchctl
  - H2: Powiązane

## cli/flows.md

- Trasa: /cli/flows
- Nagłówki:
  - H1: openclaw tasks flow
  - H2: Podpolecenia
  - H3: Wartości filtra statusu
  - H2: Przykłady
  - H2: Powiązane

## cli/gateway.md

- Trasa: /cli/gateway
- Nagłówki:
  - H2: Uruchom Gateway
  - H3: Opcje
  - H2: Uruchom ponownie Gateway
  - H3: Profilowanie Gateway
  - H2: Zapytanie do działającego Gateway
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Zdalnie przez SSH (zgodność z aplikacją Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Zarządzanie usługą Gateway
  - H3: Instalacja z wrapperem
  - H2: Wykrywanie Gateway (Bonjour)
  - H3: gateway discover
  - H2: Powiązane

## cli/health.md

- Trasa: /cli/health
- Nagłówki:
  - H1: openclaw health
  - H2: Opcje
  - H2: Powiązane

## cli/hooks.md

- Trasa: /cli/hooks
- Nagłówki:
  - H1: openclaw hooks
  - H2: Wyświetl wszystkie hooki
  - H2: Pobierz informacje o hooku
  - H2: Sprawdź kwalifikowalność hooków
  - H2: Włącz Hook
  - H2: Wyłącz Hook
  - H2: Uwagi
  - H2: Zainstaluj pakiety hooków
  - H2: Aktualizuj pakiety hooków
  - H2: Dołączone hooki
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Powiązane

## cli/index.md

- Trasa: /cli
- Nagłówki:
  - H2: Strony poleceń
  - H2: Flagi globalne
  - H2: Tryby wyjścia
  - H2: Drzewo poleceń
  - H2: Polecenia ukośnikowe czatu
  - H2: Śledzenie użycia
  - H2: Powiązane

## cli/infer.md

- Trasa: /cli/infer
- Nagłówki:
  - H2: Przekształć infer w skill
  - H2: Dlaczego warto używać infer
  - H2: Drzewo poleceń
  - H2: Typowe zadania
  - H2: Zachowanie
  - H2: Model
  - H2: Obraz
  - H2: Audio
  - H2: TTS
  - H2: Wideo
  - H2: Sieć
  - H2: Osadzanie
  - H2: Wyjście JSON
  - H2: Typowe pułapki
  - H2: Uwagi
  - H2: Powiązane

## cli/logs.md

- Trasa: /cli/logs
- Nagłówki:
  - H1: openclaw logs
  - H2: Opcje
  - H2: Wspólne opcje RPC Gateway
  - H2: Przykłady
  - H2: Uwagi
  - H2: Powiązane

## cli/mcp.md

- Trasa: /cli/mcp
- Nagłówki:
  - H2: Wybierz właściwą ścieżkę MCP
  - H2: OpenClaw jako serwer MCP
  - H3: Kiedy używać serve
  - H3: Jak to działa
  - H3: Wybierz tryb klienta
  - H3: Co udostępnia serve
  - H3: Użycie
  - H3: Narzędzia mostka
  - H3: Model zdarzeń
  - H3: Powiadomienia kanału Claude
  - H3: Konfiguracja klienta MCP
  - H3: Opcje
  - H3: Bezpieczeństwo i granica zaufania
  - H3: Testowanie
  - H3: Rozwiązywanie problemów
  - H2: OpenClaw jako rejestr klienta MCP
  - H3: Zapisane definicje serwerów MCP
  - H3: Typowe przepisy serwerów
  - H3: Kształty wyjścia JSON
  - H3: Transport Stdio
  - H3: Transport SSE / HTTP
  - H3: Przepływ pracy OAuth
  - H3: Transport streamable HTTP
  - H2: Interfejs sterowania
  - H2: Obecne ograniczenia
  - H2: Powiązane

## cli/memory.md

- Trasa: /cli/memory
- Nagłówki:
  - H1: openclaw memory
  - H2: Przykłady
  - H2: Opcje
  - H2: Dreaming
  - H2: Powiązane

## cli/message.md

- Trasa: /cli/message
- Nagłówki:
  - H1: openclaw message
  - H2: Użycie
  - H2: Typowe flagi
  - H2: Zachowanie SecretRef
  - H2: Akcje
  - H3: Rdzeń
  - H3: Wątki
  - H3: Emoji
  - H3: Naklejki
  - H3: Role / Kanały / Członkowie / Głos
  - H3: Zdarzenia
  - H3: Moderacja (Discord)
  - H3: Transmisja
  - H2: Przykłady
  - H2: Powiązane

## cli/migrate.md

- Trasa: /cli/migrate
- Nagłówki:
  - H1: openclaw migrate
  - H2: Polecenia
  - H2: Model bezpieczeństwa
  - H2: Dostawca Claude
  - H3: Co importuje Claude
  - H3: Stan archiwum i ręcznego przeglądu
  - H2: Dostawca Codex
  - H3: Co importuje Codex
  - H3: Stan ręcznego przeglądu Codex
  - H2: Dostawca Hermes
  - H3: Co importuje Hermes
  - H3: Obsługiwane klucze .env
  - H3: Stan tylko archiwalny
  - H3: Po zastosowaniu
  - H2: Kontrakt Plugin
  - H2: Integracja onboardingu
  - H2: Powiązane

## cli/models.md

- Trasa: /cli/models
- Nagłówki:
  - H1: openclaw models
  - H2: Typowe polecenia
  - H3: Skanowanie modeli
  - H3: Status modeli
  - H2: Aliasy + fallbacki
  - H2: Profile uwierzytelniania
  - H2: Powiązane

## cli/node.md

- Trasa: /cli/node
- Nagłówki:
  - H1: openclaw node
  - H2: Dlaczego używać hosta węzła?
  - H2: Proxy przeglądarki (bez konfiguracji)
  - H2: Uruchom (pierwszy plan)
  - H2: Uwierzytelnianie Gateway dla hosta węzła
  - H2: Usługa (tło)
  - H2: Parowanie
  - H2: Zatwierdzenia exec
  - H2: Powiązane

## cli/nodes.md

- Trasa: /cli/nodes
- Nagłówki:
  - H1: openclaw nodes
  - H2: Typowe polecenia
  - H2: Wywołaj
  - H2: Powiązane

## cli/onboard.md

- Trasa: /cli/onboard
- Nagłówki:
  - H1: openclaw onboard
  - H2: Powiązane przewodniki
  - H2: Przykłady
  - H2: Ustawienia regionalne
  - H3: Nieinteraktywne wybory punktu końcowego Z.AI
  - H2: Dodatkowe flagi nieinteraktywne
  - H2: Uwagi dotyczące przepływu
  - H2: Typowe polecenia następcze

## cli/pairing.md

- Trasa: /cli/pairing
- Nagłówki:
  - H1: openclaw pairing
  - H2: Polecenia
  - H2: pairing list
  - H2: pairing approve
  - H2: Uwagi
  - H2: Powiązane

## cli/path.md

- Trasa: /cli/path
- Nagłówki:
  - H1: openclaw path
  - H2: Dlaczego warto tego używać
  - H2: Jak jest używane
  - H2: Jak to działa
  - H2: Podpolecenia
  - H2: Flagi globalne
  - H2: Składnia oc://
  - H2: Adresowanie według rodzaju pliku
  - H2: Kontrakt mutacji
  - H2: Przykłady
  - H2: Przepisy według rodzaju pliku
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Dokumentacja podpoleceń
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Kody wyjścia
  - H2: Tryb wyjścia
  - H2: Uwagi
  - H2: Powiązane

## cli/plugins.md

- Trasa: /cli/plugins
- Nagłówki:
  - H2: Polecenia
  - H3: Autor
  - H3: Szkielet dostawcy
  - H3: Instalacja
  - H4: Skrót marketplace
  - H3: Lista
  - H3: Indeks Plugin
  - H3: Odinstaluj
  - H3: Aktualizuj
  - H3: Zbadaj
  - H3: Doctor
  - H3: Rejestr
  - H3: Marketplace
  - H2: Powiązane

## cli/policy.md

- Trasa: /cli/policy
- Nagłówki:
  - H1: openclaw policy
  - H2: Szybki start
  - H3: Dokumentacja reguł polityki
  - H4: Nakładki zakresowe
  - H4: Kanały
  - H4: Serwery MCP
  - H4: Dostawcy modeli
  - H4: Sieć
  - H4: Ingress i dostęp kanałów
  - H4: Gateway
  - H4: Obszar roboczy agenta
  - H4: Postawa sandboxa
  - H4: Obsługa danych
  - H4: Sekrety
  - H4: Zatwierdzenia exec
  - H4: Profile uwierzytelniania
  - H4: Metadane narzędzi
  - H4: Postawa narzędzi
  - H2: Skonfiguruj politykę
  - H2: Zaakceptuj stan polityki
  - H2: Wyniki
  - H2: Naprawa
  - H2: Kody wyjścia
  - H2: Powiązane

## cli/proxy.md

- Trasa: /cli/proxy
- Nagłówki:
  - H1: openclaw proxy
  - H2: Polecenia
  - H2: Weryfikuj
  - H2: Presety zapytań
  - H2: Uwagi
  - H2: Powiązane

## cli/qr.md

- Trasa: /cli/qr
- Nagłówki:
  - H1: openclaw qr
  - H2: Użycie
  - H2: Opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/reset.md

- Trasa: /cli/reset
- Nagłówki:
  - H1: openclaw reset
  - H2: Powiązane

## cli/sandbox.md

- Trasa: /cli/sandbox
- Nagłówki:
  - H2: Omówienie
  - H2: Polecenia
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Przypadki użycia
  - H3: Po aktualizacji obrazu Docker
  - H3: Po zmianie konfiguracji sandboxa
  - H3: Po zmianie celu SSH lub materiału uwierzytelniania SSH
  - H3: Po zmianie źródła, polityki lub trybu OpenShell
  - H3: Po zmianie setupCommand
  - H3: Tylko dla konkretnego agenta
  - H2: Dlaczego to jest potrzebne
  - H2: Migracja rejestru
  - H2: Konfiguracja
  - H2: Powiązane

## cli/secrets.md

- Trasa: /cli/secrets
- Nagłówki:
  - H1: openclaw secrets
  - H2: Przeładuj migawkę runtime
  - H2: Audyt
  - H2: Konfiguruj (interaktywny pomocnik)
  - H2: Zastosuj zapisany plan
  - H2: Dlaczego nie ma kopii zapasowych do rollbacku
  - H2: Przykład
  - H2: Powiązane

## cli/security.md

- Trasa: /cli/security
- Nagłówki:
  - H1: openclaw security
  - H2: Audyt
  - H2: Wyjście JSON
  - H2: Co zmienia --fix
  - H2: Powiązane

## cli/sessions.md

- Trasa: /cli/sessions
- Nagłówki:
  - H1: openclaw sessions
  - H2: Konserwacja czyszczenia
  - H2: Skompaktuj sesję
  - H3: RPC sessions.compact
  - H2: Powiązane

## cli/setup.md

- Trasa: /cli/setup
- Nagłówki:
  - H1: openclaw setup
  - H2: Opcje
  - H3: Tryb bazowy
  - H2: Przykłady
  - H2: Uwagi
  - H2: Powiązane

## cli/skills.md

- Trasa: /cli/skills
- Nagłówki:
  - H1: openclaw skills
  - H2: Polecenia
  - H2: Warsztat Skills
  - H2: Powiązane

## cli/status.md

- Trasa: /cli/status
- Nagłówki:
  - H2: Powiązane

## cli/system.md

- Trasa: /cli/system
- Nagłówki:
  - H1: openclaw system
  - H2: Typowe polecenia
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Uwagi
  - H2: Powiązane

## cli/tasks.md

- Trasa: /cli/tasks
- Nagłówki:
  - H2: Użycie
  - H2: Opcje główne
  - H2: Podpolecenia
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Powiązane

## cli/transcripts.md

- Trasa: /cli/transcripts
- Nagłówki:
  - H1: openclaw transcripts
  - H2: Polecenia
  - H2: Wyjście
  - H2: Wiele spotkań dziennie
  - H2: Brakujące podsumowania
  - H2: Konfiguracja

## cli/tui.md

- Trasa: /cli/tui
- Nagłówki:
  - H1: openclaw tui
  - H2: Opcje
  - H2: Przykłady
  - H2: Pętla naprawy konfiguracji
  - H2: Powiązane

## cli/uninstall.md

- Trasa: /cli/uninstall
- Nagłówki:
  - H1: openclaw uninstall
  - H2: Powiązane

## cli/update.md

- Trasa: /cli/update
- Nagłówki:
  - H1: openclaw update
  - H2: Użycie
  - H2: Opcje
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Co robi
  - H3: Kształt odpowiedzi control-plane
  - H2: Przepływ checkoutu Git
  - H3: Wybór kanału
  - H3: Kroki aktualizacji
  - H2: Skrót --update
  - H2: Powiązane

## cli/voicecall.md

- Trasa: /cli/voicecall
- Nagłówki:
  - H1: openclaw voicecall
  - H2: Podpolecenia
  - H2: Konfiguracja i smoke
  - H3: setup
  - H3: smoke
  - H2: Cykl życia połączenia
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Logi i metryki
  - H3: tail
  - H3: latency
  - H2: Udostępnianie Webhooków
  - H3: expose
  - H2: Powiązane

## cli/webhooks.md

- Trasa: /cli/webhooks
- Nagłówki:
  - H1: openclaw webhooks
  - H2: Podpolecenia
  - H2: webhooks gmail setup
  - H3: Wymagane
  - H3: Opcje Pub/Sub
  - H3: Opcje dostarczania OpenClaw
  - H3: Opcje gog watch serve
  - H3: Ekspozycja Tailscale
  - H3: Wyjście
  - H2: webhooks gmail run
  - H2: Przepływ end-to-end
  - H2: Powiązane

## cli/wiki.md

- Trasa: /cli/wiki
- Nagłówki:
  - H1: openclaw wiki
  - H2: Do czego służy
  - H2: Typowe polecenia
  - H2: Polecenia
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Praktyczne wskazówki użycia
  - H2: Powiązania z konfiguracją
  - H2: Powiązane

## cli/workboard.md

- Trasa: /cli/workboard
- Nagłówki:
  - H2: Użycie
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Równoważność poleceń ukośnikowych
  - H2: Uprawnienia
  - H2: Rozwiązywanie problemów
  - H3: Nie pojawiają się żadne karty
  - H3: Dispatch zgłasza Data-Only
  - H3: Dispatch niczego nie uruchamia
  - H2: Powiązane

## concepts/active-memory.md

- Trasa: /concepts/active-memory
- Nagłówki:
  - H2: Szybki start
  - H2: Zalecenia dotyczące szybkości
  - H3: Konfiguracja Cerebras
  - H2: Jak to zobaczyć
  - H2: Przełącznik sesji
  - H2: Kiedy działa
  - H2: Typy sesji
  - H2: Gdzie działa
  - H2: Dlaczego warto tego używać
  - H2: Jak to działa
  - H2: Tryby zapytań
  - H2: Style promptów
  - H2: Polityka fallbacku modelu
  - H2: Narzędzia pamięci
  - H3: Wbudowany memory-core
  - H3: Pamięć LanceDB
  - H3: Lossless Claw
  - H2: Zaawansowane wyjścia awaryjne
  - H2: Trwałość transkryptów
  - H2: Konfiguracja
  - H2: Zalecana konfiguracja
  - H3: Okres karencji cold-start
  - H2: Debugowanie
  - H2: Typowe problemy
  - H2: Powiązane strony

## concepts/agent-loop.md

- Trasa: /concepts/agent-loop
- Nagłówki:
  - H2: Punkty wejścia
  - H2: Jak to działa (ogólnie)
  - H2: Kolejkowanie + współbieżność
  - H2: Przygotowanie sesji + obszaru roboczego
  - H2: Składanie promptu + prompt systemowy
  - H2: Punkty hooków (gdzie możesz przechwycić)
  - H3: Hooki wewnętrzne (hooki Gateway)
  - H3: Hooki Plugin (cykl życia agenta + Gateway)
  - H2: Strumieniowanie + częściowe odpowiedzi
  - H2: Wykonywanie narzędzi + narzędzia wiadomości
  - H2: Kształtowanie odpowiedzi + wyciszanie
  - H2: Compaction + ponowienia
  - H2: Strumienie zdarzeń (obecnie)
  - H2: Obsługa kanałów czatu
  - H2: Limity czasu
  - H2: Gdzie rzeczy mogą zakończyć się wcześniej
  - H2: Powiązane

## concepts/agent-runtimes.md

- Trasa: /concepts/agent-runtimes
- Nagłówki:
  - H2: Powierzchnie Codex
  - H2: Własność runtime
  - H2: Wybór runtime
  - H2: Runtime agenta GitHub Copilot
  - H2: Kontrakt zgodności
  - H2: Etykiety statusu
  - H2: Powiązane

## concepts/agent-workspace.md

- Ścieżka: /concepts/agent-workspace
- Nagłówki:
  - H2: Domyślna lokalizacja
  - H2: Dodatkowe foldery obszaru roboczego
  - H2: Mapa plików obszaru roboczego
  - H2: Czego NIE ma w obszarze roboczym
  - H2: Kopia zapasowa Git (zalecana, prywatna)
  - H2: Nie commituj sekretów
  - H2: Przenoszenie obszaru roboczego na nową maszynę
  - H2: Uwagi zaawansowane
  - H2: Powiązane

## concepts/agent.md

- Ścieżka: /concepts/agent
- Nagłówki:
  - H2: Obszar roboczy (wymagany)
  - H2: Pliki startowe (wstrzykiwane)
  - H2: Narzędzia wbudowane
  - H2: Skills
  - H2: Granice środowiska uruchomieniowego
  - H2: Sesje
  - H2: Sterowanie podczas strumieniowania
  - H2: Referencje modeli
  - H2: Konfiguracja (minimalna)
  - H2: Powiązane

## concepts/architecture.md

- Ścieżka: /concepts/architecture
- Nagłówki:
  - H2: Omówienie
  - H2: Komponenty i przepływy
  - H3: Gateway (demon)
  - H3: Klienci (aplikacja na Maca / CLI / administracja webowa)
  - H3: Węzły (macOS / iOS / Android / bez interfejsu)
  - H3: WebChat
  - H2: Cykl życia połączenia (pojedynczy klient)
  - H2: Protokół przewodowy (podsumowanie)
  - H2: Parowanie + zaufanie lokalne
  - H2: Typowanie protokołu i generowanie kodu
  - H2: Dostęp zdalny
  - H2: Migawka operacyjna
  - H2: Niezmienniki
  - H2: Powiązane

## concepts/channel-docking.md

- Ścieżka: /concepts/channel-docking
- Nagłówki:
  - H2: Przykład
  - H2: Dlaczego warto tego używać
  - H2: Wymagana konfiguracja
  - H2: Polecenia
  - H2: Co się zmienia
  - H2: Co się nie zmienia
  - H2: Rozwiązywanie problemów

## concepts/commitments.md

- Ścieżka: /concepts/commitments
- Nagłówki:
  - H2: Włącz zobowiązania
  - H2: Jak to działa
  - H2: Zakres
  - H2: Zobowiązania a przypomnienia
  - H2: Zarządzanie zobowiązaniami
  - H2: Prywatność i koszt
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/compaction.md

- Ścieżka: /concepts/compaction
- Nagłówki:
  - H2: Jak to działa
  - H2: Automatyczna Compaction
  - H2: Ręczna Compaction
  - H2: Konfiguracja
  - H3: Używanie innego modelu
  - H3: Zachowywanie identyfikatorów
  - H3: Ochrona bajtów aktywnej transkrypcji
  - H3: Transkrypcje następcze
  - H3: Powiadomienia Compaction
  - H3: Opróżnianie pamięci
  - H2: Wymienni dostawcy Compaction
  - H2: Compaction a przycinanie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/context-engine.md

- Ścieżka: /concepts/context-engine
- Nagłówki:
  - H2: Szybki start
  - H2: Jak to działa
  - H3: Cykl życia subagenta (opcjonalny)
  - H3: Dodatek do promptu systemowego
  - H2: Silnik starszego typu
  - H2: Silniki Plugin
  - H3: Interfejs ContextEngine
  - H3: Ustawienia środowiska uruchomieniowego
  - H3: Wymagania hosta
  - H3: Izolacja awarii
  - H3: ownsCompaction
  - H2: Informacje o konfiguracji
  - H2: Relacja z Compaction i pamięcią
  - H2: Wskazówki
  - H2: Powiązane

## concepts/context.md

- Ścieżka: /concepts/context
- Nagłówki:
  - H2: Szybki start (sprawdzanie kontekstu)
  - H2: Przykładowe dane wyjściowe
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Co liczy się do okna kontekstu
  - H2: Jak OpenClaw buduje prompt systemowy
  - H2: Wstrzykiwane pliki obszaru roboczego (kontekst projektu)
  - H2: Skills: wstrzykiwane a ładowane na żądanie
  - H2: Narzędzia: są dwa koszty
  - H2: Polecenia, dyrektywy i „skróty inline”
  - H2: Sesje, Compaction i przycinanie (co jest zachowywane)
  - H2: Co faktycznie raportuje /context
  - H2: Powiązane

## concepts/delegate-architecture.md

- Ścieżka: /concepts/delegate-architecture
- Nagłówki:
  - H2: Czym jest delegat?
  - H2: Dlaczego delegaci?
  - H2: Poziomy możliwości
  - H3: Poziom 1: tylko odczyt + szkic
  - H3: Poziom 2: wysyłanie w imieniu
  - H3: Poziom 3: proaktywne działanie
  - H2: Wymagania wstępne: izolacja i utwardzenie
  - H3: Twarde blokady (nienegocjowalne)
  - H3: Ograniczenia narzędzi
  - H3: Izolacja sandboxa
  - H3: Ślad audytu
  - H2: Konfigurowanie delegata
  - H3: 1. Utwórz agenta delegata
  - H3: 2. Skonfiguruj delegowanie dostawcy tożsamości
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Powiąż delegata z kanałami
  - H3: 4. Dodaj poświadczenia do agenta delegata
  - H2: Przykład: asystent organizacyjny
  - H2: Wzorzec skalowania
  - H2: Powiązane

## concepts/dreaming.md

- Ścieżka: /concepts/dreaming
- Nagłówki:
  - H2: Co zapisuje Dreaming
  - H2: Model faz
  - H2: Pobieranie transkrypcji sesji
  - H2: Dziennik snów
  - H2: Głębokie sygnały rankingowe
  - H2: Pokrycie raportu próbnego QA shadow
  - H2: Harmonogramowanie
  - H2: Szybki start
  - H2: Polecenie slash
  - H2: Przepływ pracy CLI
  - H2: Kluczowe wartości domyślne
  - H2: Interfejs snów
  - H2: Dreaming nigdy się nie uruchamia: status pokazuje blokadę
  - H2: Powiązane

## concepts/experimental-features.md

- Ścieżka: /concepts/experimental-features
- Nagłówki:
  - H2: Obecnie udokumentowane flagi
  - H2: Tryb oszczędny modelu lokalnego
  - H3: Dlaczego te trzy narzędzia
  - H3: Kiedy go włączyć
  - H3: Kiedy zostawić go wyłączonego
  - H3: Włącz
  - H2: Eksperymentalne nie znaczy ukryte
  - H2: Powiązane

## concepts/features.md

- Ścieżka: /concepts/features
- Nagłówki:
  - H2: Najważniejsze funkcje
  - H2: Pełna lista
  - H2: Powiązane

## concepts/mantis-slack-desktop-runbook.md

- Ścieżka: /concepts/mantis-slack-desktop-runbook
- Nagłówki:
  - H2: Model przechowywania
  - H2: Dispatch GitHub
  - H2: Lokalne CLI
  - H2: Tryby hydrate
  - H2: Interpretacja czasu
  - H2: Lista kontrolna dowodów
  - H2: Obsługa awarii
  - H2: Powiązane

## concepts/mantis.md

- Ścieżka: /concepts/mantis
- Nagłówki:
  - H2: Cele
  - H2: Poza zakresem
  - H2: Własność
  - H2: Kształt polecenia
  - H2: Cykl życia uruchomienia
  - H2: MVP Discord
  - H2: Istniejące elementy QA
  - H2: Model dowodów
  - H2: Przeglądarka i VNC
  - H2: Maszyny
  - H2: Sekrety
  - H2: Artefakty GitHub i komentarze PR
  - H2: Prywatne notatki wdrożeniowe
  - H2: Dodawanie scenariusza
  - H2: Rozszerzanie dostawców
  - H2: Pytania otwarte

## concepts/markdown-formatting.md

- Ścieżka: /concepts/markdown-formatting
- Nagłówki:
  - H2: Cele
  - H2: Potok
  - H2: Przykład IR
  - H2: Gdzie jest używane
  - H2: Obsługa tabel
  - H2: Zasady dzielenia na fragmenty
  - H2: Zasady linków
  - H2: Spojlery
  - H2: Jak dodać lub zaktualizować formater kanału
  - H2: Typowe pułapki
  - H2: Powiązane

## concepts/memory-builtin.md

- Ścieżka: /concepts/memory-builtin
- Nagłówki:
  - H2: Co zapewnia
  - H2: Pierwsze kroki
  - H2: Obsługiwani dostawcy embeddingów
  - H2: Jak działa indeksowanie
  - H2: Kiedy używać
  - H2: Rozwiązywanie problemów
  - H2: Konfiguracja
  - H2: Powiązane

## concepts/memory-honcho.md

- Ścieżka: /concepts/memory-honcho
- Nagłówki:
  - H2: Co zapewnia
  - H2: Dostępne narzędzia
  - H2: Pierwsze kroki
  - H2: Konfiguracja
  - H2: Migrowanie istniejącej pamięci
  - H2: Jak to działa
  - H2: Honcho a pamięć wbudowana
  - H2: Polecenia CLI
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/memory-qmd.md

- Ścieżka: /concepts/memory-qmd
- Nagłówki:
  - H2: Co dodaje względem wbudowanego rozwiązania
  - H2: Pierwsze kroki
  - H3: Wymagania wstępne
  - H3: Włącz
  - H2: Jak działa sidecar
  - H2: Wydajność wyszukiwania i zgodność
  - H2: Nadpisania modeli
  - H2: Indeksowanie dodatkowych ścieżek
  - H2: Indeksowanie transkrypcji sesji
  - H2: Zakres wyszukiwania
  - H2: Cytowania
  - H2: Kiedy używać
  - H2: Rozwiązywanie problemów
  - H2: Konfiguracja
  - H2: Powiązane

## concepts/memory-search.md

- Ścieżka: /concepts/memory-search
- Nagłówki:
  - H2: Szybki start
  - H2: Obsługiwani dostawcy
  - H2: Jak działa wyszukiwanie
  - H2: Poprawianie jakości wyszukiwania
  - H3: Zanik czasowy
  - H3: MMR (różnorodność)
  - H3: Włącz oba
  - H2: Pamięć multimodalna
  - H2: Wyszukiwanie w pamięci sesji
  - H2: Rozwiązywanie problemów
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/memory.md

- Ścieżka: /concepts/memory
- Nagłówki:
  - H2: Jak to działa
  - H2: Co trafia gdzie
  - H2: Pamięci zależne od działań
  - H2: Wnioskowane zobowiązania
  - H2: Narzędzia pamięci
  - H2: Plugin towarzyszący Memory Wiki
  - H2: Wyszukiwanie w pamięci
  - H2: Backendy pamięci
  - H2: Warstwa wiki wiedzy
  - H2: Automatyczne opróżnianie pamięci
  - H2: Dreaming
  - H2: Ugruntowane uzupełnianie i promocja na żywo
  - H2: CLI
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/message-lifecycle-refactor.md

- Ścieżka: /concepts/message-lifecycle-refactor
- Nagłówki:
  - H2: Problemy
  - H2: Cele
  - H2: Poza zakresem
  - H2: Model referencyjny
  - H2: Model rdzenia
  - H2: Terminy dotyczące wiadomości
  - H3: Wiadomość
  - H3: Cel
  - H3: Relacja
  - H3: Pochodzenie
  - H3: Potwierdzenie odbioru
  - H2: Kontekst odbioru
  - H2: Kontekst wysyłania
  - H2: Kontekst na żywo
  - H2: Powierzchnia adaptera
  - H2: Redukcja publicznego SDK
  - H2: Relacja z przychodzącymi wiadomościami kanału
  - H2: Bariery zgodności
  - H2: Przechowywanie wewnętrzne
  - H2: Klasy awarii
  - H2: Mapowanie kanałów
  - H2: Plan migracji
  - H3: Faza 1: wewnętrzna domena wiadomości
  - H3: Faza 2: trwały rdzeń wysyłania
  - H3: Faza 3: most przychodzących wiadomości kanału
  - H3: Faza 4: most przygotowanego dispatchera
  - H3: Faza 5: ujednolicony cykl życia na żywo
  - H3: Faza 6: publiczny SDK
  - H3: Faza 7: wszyscy nadawcy
  - H3: Faza 8: usunięcie zgodności nazwanej Turn
  - H2: Plan testów
  - H2: Pytania otwarte
  - H2: Kryteria akceptacji
  - H2: Powiązane

## concepts/messages.md

- Ścieżka: /concepts/messages
- Nagłówki:
  - H2: Przepływ wiadomości (wysoki poziom)
  - H2: Deduplikacja przychodzących
  - H2: Debouncing przychodzących
  - H2: Sesje i urządzenia
  - H2: Metadane wyników narzędzi
  - H2: Treści przychodzące i kontekst historii
  - H2: Kolejkowanie i działania następcze
  - H2: Własność uruchomienia kanału
  - H2: Strumieniowanie, dzielenie na fragmenty i grupowanie
  - H2: Widoczność rozumowania i tokeny
  - H2: Prefiksy, wątki i odpowiedzi
  - H2: Ciche odpowiedzi
  - H2: Powiązane

## concepts/model-failover.md

- Ścieżka: /concepts/model-failover
- Nagłówki:
  - H2: Przepływ środowiska uruchomieniowego
  - H2: Zasady źródła wyboru
  - H2: Pamięć podręczna pomijania awarii uwierzytelniania
  - H2: Widoczne dla użytkownika powiadomienia o fallbacku
  - H2: Przechowywanie uwierzytelniania (klucze + OAuth)
  - H2: Identyfikatory profili
  - H2: Kolejność rotacji
  - H3: Przywiązanie sesji (przyjazne pamięci podręcznej)
  - H3: Subskrypcja OpenAI Codex plus zapasowy klucz API
  - H2: Okresy cooldown
  - H2: Wyłączenia rozliczeń
  - H2: Fallback modelu
  - H3: Zasady łańcucha kandydatów
  - H3: Które błędy przesuwają fallback
  - H3: Pomijanie cooldown a zachowanie sondowania
  - H2: Nadpisania sesji i przełączanie modelu na żywo
  - H2: Obserwowalność i podsumowania awarii
  - H2: Powiązana konfiguracja

## concepts/model-providers.md

- Ścieżka: /concepts/model-providers
- Nagłówki:
  - H2: Szybkie zasady
  - H2: Zachowanie dostawcy należące do Plugin
  - H2: Rotacja kluczy API
  - H2: Oficjalne Plugin dostawców
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Inne hostowane opcje w stylu subskrypcji
  - H3: OpenCode
  - H3: Google Gemini (klucz API)
  - H3: Google Vertex i Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Inne dołączone Plugin dostawców
  - H4: Osobliwości, które warto znać
  - H2: Dostawcy przez models.providers (niestandardowy/bazowy URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kodowanie Kimi
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (międzynarodowy)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Lokalne proxy (LM Studio, vLLM, LiteLLM itd.)
  - H2: Przykłady CLI
  - H2: Powiązane

## concepts/models.md

- Ścieżka: /concepts/models
- Nagłówki:
  - H2: Jak działa wybór modelu
  - H2: Źródło wyboru i zachowanie fallbacku
  - H2: Szybkie zasady dotyczące modeli
  - H2: Onboarding (zalecany)
  - H2: Klucze konfiguracji (omówienie)
  - H3: Bezpieczne edycje allowlist
  - H2: „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)
  - H2: Przełączanie modeli na czacie (/model)
  - H2: Polecenia CLI
  - H3: models list
  - H3: models status
  - H2: Skanowanie (darmowe modele OpenRouter)
  - H2: Rejestr modeli (models.json)
  - H2: Powiązane

## concepts/multi-agent.md

- Ścieżka: /concepts/multi-agent
- Nagłówki:
  - H2: Czym jest „jeden agent”?
  - H2: Ścieżki (szybka mapa)
  - H3: Tryb pojedynczego agenta (domyślny)
  - H2: Pomocnik agenta
  - H2: Szybki start
  - H2: Wielu agentów = wiele osób, wiele osobowości
  - H2: Wyszukiwanie w pamięci QMD między agentami
  - H2: Jeden numer WhatsApp, wiele osób (podział DM)
  - H2: Zasady routingu (jak wiadomości wybierają agenta)
  - H2: Wiele kont / numerów telefonów
  - H2: Koncepcje
  - H2: Przykłady platform
  - H2: Typowe wzorce
  - H2: Sandbox i konfiguracja narzędzi dla każdego agenta
  - H2: Powiązane

## concepts/oauth.md

- Trasa: /concepts/oauth
- Nagłówki:
  - H2: Ujście tokenów (dlaczego istnieje)
  - H2: Przechowywanie (gdzie znajdują się tokeny)
  - H2: Zgodność ze starszymi tokenami Anthropic
  - H2: Migracja Anthropic Claude CLI
  - H2: Wymiana OAuth (jak działa logowanie)
  - H3: setup-token Anthropic
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Odświeżanie + wygaśnięcie
  - H2: Wiele kont (profile) + routing
  - H3: 1) Preferowane: oddzielni agenci
  - H3: 2) Zaawansowane: wiele profili w jednym agencie
  - H2: Powiązane

## concepts/parallel-specialist-lanes.md

- Trasa: /concepts/parallel-specialist-lanes
- Nagłówki:
  - H2: Podstawowe zasady
  - H2: Zalecane wdrożenie
  - H3: Faza 1: kontrakty ścieżek + ciężka praca w tle
  - H3: Faza 2: kontrola priorytetów i współbieżności
  - H3: Faza 3: koordynator / kontroler ruchu
  - H2: Minimalny szablon kontraktu ścieżki
  - H2: Powiązane

## concepts/personal-agent-benchmark-pack.md

- Trasa: /concepts/personal-agent-benchmark-pack
- Nagłówki:
  - H2: Scenariusze
  - H2: Model prywatności
  - H2: Rozszerzanie pakietu

## concepts/presence.md

- Trasa: /concepts/presence
- Nagłówki:
  - H2: Pola obecności (co się pojawia)
  - H2: Producenci (skąd pochodzi obecność)
  - H3: 1) Wpis własny Gateway
  - H3: 2) Połączenie WebSocket
  - H4: Dlaczego jednorazowe polecenia CLI się nie pojawiają
  - H3: 3) sygnały system-event
  - H3: 4) Node łączy się (rola: node)
  - H2: Reguły scalania + deduplikacji (dlaczego instanceId ma znaczenie)
  - H2: TTL i ograniczony rozmiar
  - H2: Zastrzeżenie dotyczące zdalnego dostępu/tunelu (adresy IP loopback)
  - H2: Konsumenci
  - H3: Karta instancji macOS
  - H2: Wskazówki debugowania
  - H2: Powiązane

## concepts/progress-drafts.md

- Trasa: /concepts/progress-drafts
- Nagłówki:
  - H2: Szybki start
  - H2: Co widzą użytkownicy
  - H2: Wybierz tryb
  - H2: Skonfiguruj etykiety
  - H2: Kontroluj wiersze postępu
  - H2: Zachowanie kanału
  - H2: Finalizacja
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/qa-e2e-automation.md

- Trasa: /concepts/qa-e2e-automation
- Nagłówki:
  - H2: Powierzchnia poleceń
  - H2: Przepływ operatora
  - H2: Pokrycie transportu live
  - H2: Referencje QA dla Telegram, Discord, Slack i WhatsApp
  - H3: Wspólne flagi CLI
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Konfigurowanie obszaru roboczego Slack
  - H3: QA WhatsApp
  - H3: Pula poświadczeń Convex
  - H2: Seedy wspierane przez repozytorium
  - H2: Ścieżki mocków dostawców
  - H2: Adaptery transportu
  - H3: Dodawanie kanału
  - H3: Nazwy helperów scenariuszy
  - H2: Raportowanie
  - H2: Powiązana dokumentacja

## concepts/qa-matrix.md

- Trasa: /concepts/qa-matrix
- Nagłówki:
  - H2: Szybki start
  - H2: Co robi ścieżka
  - H2: CLI
  - H3: Typowe flagi
  - H3: Flagi dostawcy
  - H2: Profile
  - H2: Scenariusze
  - H2: Zmienne środowiskowe
  - H2: Artefakty wyjściowe
  - H2: Wskazówki triage
  - H2: Kontrakt transportu live
  - H2: Powiązane

## concepts/queue-steering.md

- Trasa: /concepts/queue-steering
- Nagłówki:
  - H2: Granica środowiska wykonawczego
  - H2: Tryby
  - H2: Przykład burst
  - H2: Zakres
  - H2: Debounce
  - H2: Powiązane

## concepts/queue.md

- Trasa: /concepts/queue
- Nagłówki:
  - H2: Dlaczego
  - H2: Jak to działa
  - H2: Domyślne
  - H2: Tryby kolejki
  - H2: Opcje kolejki
  - H2: Sterowanie i streaming
  - H2: Pierwszeństwo
  - H2: Nadpisania na sesję
  - H2: Zakres i gwarancje
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/retry.md

- Trasa: /concepts/retry
- Nagłówki:
  - H2: Cele
  - H2: Domyślne
  - H2: Zachowanie
  - H3: Dostawcy modeli
  - H3: Discord
  - H3: Telegram
  - H2: Konfiguracja
  - H2: Uwagi
  - H2: Powiązane

## concepts/session-pruning.md

- Trasa: /concepts/session-pruning
- Nagłówki:
  - H2: Dlaczego to ma znaczenie
  - H2: Jak to działa
  - H2: Czyszczenie starszych obrazów
  - H2: Inteligentne wartości domyślne
  - H2: Włącz lub wyłącz
  - H2: Przycinanie a compaction
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/session-tool.md

- Trasa: /concepts/session-tool
- Nagłówki:
  - H2: Dostępne narzędzia
  - H2: Listowanie i odczytywanie sesji
  - H2: Wysyłanie wiadomości między sesjami
  - H2: Helpery statusu i orkiestracji
  - H2: Tworzenie subagentów
  - H2: Widoczność
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/session.md

- Trasa: /concepts/session
- Nagłówki:
  - H2: Jak wiadomości są routowane
  - H2: Izolacja DM
  - H3: Połączone kanały Dock
  - H2: Cykl życia sesji
  - H2: Gdzie znajduje się stan
  - H2: Utrzymanie sesji
  - H2: Inspekcja sesji
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/soul.md

- Trasa: /concepts/soul
- Nagłówki:
  - H2: Co należy do SOUL.md
  - H2: Dlaczego to działa
  - H2: Prompt Molty
  - H2: Jak wygląda dobra wersja
  - H2: Jedno ostrzeżenie
  - H2: Powiązane

## concepts/streaming.md

- Trasa: /concepts/streaming
- Nagłówki:
  - H2: Streaming bloków (wiadomości kanału)
  - H3: Dostarczanie multimediów ze streamingiem bloków
  - H2: Algorytm dzielenia na fragmenty (dolne/górne granice)
  - H2: Koalescencja (scalanie streamowanych bloków)
  - H2: Ludzkie tempo między blokami
  - H2: „Streamuj fragmenty albo wszystko”
  - H2: Tryby streamingu podglądu
  - H3: Mapowanie kanałów
  - H3: Zachowanie środowiska wykonawczego
  - H3: Aktualizacje podglądu postępu narzędzi
  - H3: Ścieżka postępu komentarza
  - H2: Powiązane

## concepts/system-prompt.md

- Trasa: /concepts/system-prompt
- Nagłówki:
  - H2: Struktura
  - H2: Tryby promptu
  - H2: Migawki promptu
  - H2: Wstrzykiwanie bootstrapu obszaru roboczego
  - H2: Obsługa czasu
  - H2: Skills
  - H2: Dokumentacja
  - H2: Powiązane

## concepts/timezone.md

- Trasa: /concepts/timezone
- Nagłówki:
  - H2: Trzy powierzchnie strefy czasowej
  - H2: Ustawianie strefy czasowej użytkownika
  - H2: Kiedy nadpisać
  - H2: Powiązane

## concepts/typebox.md

- Trasa: /concepts/typebox
- Nagłówki:
  - H2: Model mentalny (30 sekund)
  - H2: Gdzie znajdują się schematy
  - H2: Aktualny pipeline
  - H2: Jak schematy są używane w środowisku wykonawczym
  - H2: Przykładowe ramki
  - H2: Minimalny klient (Node.js)
  - H2: Przykład krok po kroku: dodanie metody od początku do końca
  - H2: Zachowanie generowania kodu Swift
  - H2: Wersjonowanie + zgodność
  - H2: Wzorce i konwencje schematów
  - H2: JSON schematu live
  - H2: Gdy zmieniasz schematy
  - H2: Powiązane

## concepts/typing-indicators.md

- Trasa: /concepts/typing-indicators
- Nagłówki:
  - H2: Domyślne
  - H2: Tryby
  - H2: Konfiguracja
  - H2: Uwagi
  - H2: Powiązane

## concepts/usage-tracking.md

- Trasa: /concepts/usage-tracking
- Nagłówki:
  - H2: Co to jest
  - H2: Gdzie się pojawia
  - H2: Domyślny tryb stopki użycia
  - H3: Trzy odrębne stany sesji
  - H3: Pierwszeństwo
  - H3: Resetowanie a wyłączanie
  - H3: Zachowanie przełącznika
  - H3: Konfiguracja
  - H2: Niestandardowa pełna stopka /usage
  - H3: Kształt
  - H3: Ścieżki kontraktu
  - H3: Czasowniki
  - H3: Formy elementów
  - H3: Przykład
  - H2: Dostawcy + poświadczenia
  - H2: Powiązane

## date-time.md

- Trasa: /date-time
- Nagłówki:
  - H2: Koperty wiadomości (domyślnie lokalne)
  - H3: Przykłady
  - H2: Prompt systemowy: bieżąca data i godzina
  - H2: Wiersze zdarzeń systemowych (domyślnie lokalne)
  - H3: Skonfiguruj strefę czasową użytkownika + format
  - H2: Wykrywanie formatu czasu (automatyczne)
  - H2: Ładunki narzędzi + konektory (surowy czas dostawcy + znormalizowane pola)
  - H2: Powiązana dokumentacja

## debug/node-issue.md

- Trasa: /debug/node-issue
- Nagłówki:
  - H1: Awaria Node + tsx „\\name is not a function”
  - H2: Podsumowanie
  - H2: Środowisko
  - H2: Repro (tylko Node)
  - H2: Minimalne repro w repozytorium
  - H2: Sprawdzenie wersji Node
  - H2: Uwagi / hipoteza
  - H2: Historia regresji
  - H2: Obejścia
  - H2: Referencje
  - H2: Następne kroki
  - H2: Powiązane

## diagnostics/flags.md

- Trasa: /diagnostics/flags
- Nagłówki:
  - H2: Jak to działa
  - H2: Włącz przez konfigurację
  - H2: Nadpisanie env (jednorazowe)
  - H2: Flagi profilowania
  - H2: Artefakty osi czasu
  - H2: Gdzie trafiają logi
  - H2: Wyodrębnianie logów
  - H2: Uwagi
  - H2: Powiązane

## gateway/authentication.md

- Trasa: /gateway/authentication
- Nagłówki:
  - H2: Zalecana konfiguracja (klucz API, dowolny dostawca)
  - H2: Anthropic: Claude CLI i zgodność tokenów
  - H2: Uwaga Anthropic
  - H2: Sprawdzanie statusu uwierzytelniania modelu
  - H2: Zachowanie rotacji klucza API (gateway)
  - H2: Usuwanie uwierzytelniania dostawcy, gdy Gateway działa
  - H2: Kontrolowanie używanego poświadczenia
  - H3: OpenAI i starsze identyfikatory openai-codex
  - H3: Podczas logowania (CLI)
  - H3: Na sesję (polecenie czatu)
  - H3: Na agenta (nadpisanie CLI)
  - H2: Rozwiązywanie problemów
  - H3: „No credentials found”
  - H3: Token wygasa/wygasł
  - H2: Powiązane

## gateway/background-process.md

- Trasa: /gateway/background-process
- Nagłówki:
  - H2: narzędzie exec
  - H2: Pomost procesów potomnych
  - H2: narzędzie process
  - H2: Przykłady
  - H2: Powiązane

## gateway/bonjour.md

- Trasa: /gateway/bonjour
- Nagłówki:
  - H2: Wide-area Bonjour (Unicast DNS-SD) przez Tailscale
  - H3: Konfiguracja Gateway (zalecana)
  - H3: Jednorazowa konfiguracja serwera DNS (host gateway)
  - H3: Ustawienia DNS Tailscale
  - H3: Zabezpieczenia listenera Gateway (zalecane)
  - H2: Co rozgłasza
  - H2: Typy usług
  - H2: Klucze TXT (niesekretne wskazówki)
  - H2: Debugowanie na macOS
  - H2: Debugowanie w logach Gateway
  - H2: Debugowanie na węźle iOS
  - H2: Kiedy włączyć Bonjour
  - H2: Kiedy wyłączyć Bonjour
  - H2: Pułapki Docker
  - H2: Rozwiązywanie problemów z wyłączonym Bonjour
  - H2: Typowe tryby awarii
  - H2: Escapowane nazwy instancji (\032)
  - H2: Włączanie / wyłączanie / konfiguracja
  - H2: Powiązana dokumentacja

## gateway/bridge-protocol.md

- Trasa: /gateway/bridge-protocol
- Nagłówki:
  - H2: Dlaczego istniał
  - H2: Transport
  - H2: Handshake + parowanie
  - H2: Ramki
  - H2: Zdarzenia cyklu życia exec
  - H2: Historyczne użycie tailnet
  - H2: Wersjonowanie
  - H2: Powiązane

## gateway/cli-backends.md

- Trasa: /gateway/cli-backends
- Nagłówki:
  - H2: Szybki start przyjazny początkującym
  - H2: Używanie jako fallback
  - H2: Przegląd konfiguracji
  - H3: Przykładowa konfiguracja
  - H2: Jak to działa
  - H2: Sesje
  - H2: Wstęp fallback z sesji claude-cli
  - H2: Obrazy (przekazywanie)
  - H2: Wejścia / wyjścia
  - H2: Domyślne (własność Plugin)
  - H2: Domyślne należące do Plugin
  - H2: Własność natywnej compaction
  - H2: Nakładki pakietu MCP
  - H2: Limit ponownego seedowania historii
  - H2: Ograniczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/config-agents.md

- Trasa: /gateway/config-agents
- Nagłówki:
  - H2: Domyślne agenta
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Nadpisania profilu bootstrapu na agenta
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Mapa własności budżetu kontekstu
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Zasada środowiska wykonawczego
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming bloków
  - H3: Wskaźniki pisania
  - H3: agents.defaults.sandbox
  - H3: agents.list (nadpisania na agenta)
  - H2: Routing wieloagentowy
  - H3: Pola dopasowania powiązania
  - H3: Profile dostępu na agenta
  - H2: Sesja
  - H2: Wiadomości
  - H3: Prefiks odpowiedzi
  - H3: Reakcja potwierdzenia
  - H3: Debounce przychodzących
  - H3: TTS (text-to-speech)
  - H2: Rozmowa
  - H2: Powiązane

## gateway/config-channels.md

- Trasa: /gateway/config-channels
- Nagłówki:
  - H2: Kanały
  - H3: Dostęp do wiadomości prywatnych i grup
  - H3: Nadpisania modelu kanału
  - H3: Domyślne ustawienia kanału i Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Wiele kont (wszystkie kanały)
  - H3: Inne kanały pluginów
  - H3: Bramka wzmianek na czacie grupowym
  - H4: Limity historii wiadomości prywatnych
  - H4: Tryb rozmowy ze sobą
  - H3: Polecenia (obsługa poleceń czatu)
  - H2: Powiązane

## gateway/config-tools.md

- Trasa: /gateway/config-tools
- Nagłówki:
  - H2: Narzędzia
  - H3: Profile narzędzi
  - H3: Grupy narzędzi
  - H3: MCP i narzędzia pluginów w polityce narzędzi piaskownicy
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Niestandardowi dostawcy i bazowe adresy URL
  - H3: Szczegóły pola dostawcy
  - H3: Przykłady dostawców
  - H2: Powiązane

## gateway/configuration-examples.md

- Trasa: /gateway/configuration-examples
- Nagłówki:
  - H2: Szybki start
  - H3: Absolutne minimum
  - H3: Zalecany punkt startowy
  - H2: Rozszerzony przykład (główne opcje)
  - H3: Repozytorium Skills jako dowiązany symbolicznie sąsiad
  - H2: Typowe wzorce
  - H3: Wspólna baza Skills z jednym nadpisaniem
  - H3: Konfiguracja wieloplatformowa
  - H3: Automatyczne zatwierdzanie zaufanej sieci węzłów
  - H3: Bezpieczny tryb wiadomości prywatnych (wspólna skrzynka odbiorcza / wieloużytkownikowe wiadomości prywatne)
  - H3: Klucz API Anthropic + fallback MiniMax
  - H3: Bot roboczy (ograniczony dostęp)
  - H3: Tylko modele lokalne
  - H2: Wskazówki
  - H2: Powiązane

## gateway/configuration-reference.md

- Trasa: /gateway/configuration-reference
- Nagłówki:
  - H2: Kanały
  - H2: Domyślne ustawienia agentów, wielu agentów, sesje i wiadomości
  - H2: Narzędzia i niestandardowi dostawcy
  - H2: Modele
  - H2: MCP
  - H2: Skills
  - H2: Pluginy
  - H3: Konfiguracja pluginu uprzęży Codex
  - H2: Zobowiązania
  - H2: Przeglądarka
  - H2: Interfejs użytkownika
  - H2: Gateway
  - H3: Punkty końcowe zgodne z OpenAI
  - H3: Izolacja wielu instancji
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooki
  - H3: Integracja z Gmail
  - H2: Host pluginu Canvas
  - H2: Wykrywanie
  - H3: mDNS (Bonjour)
  - H3: Szeroki obszar (DNS-SD)
  - H2: Środowisko
  - H3: env (wbudowane zmienne środowiskowe)
  - H3: Podstawianie zmiennych środowiskowych
  - H2: Sekrety
  - H3: SecretRef
  - H3: Obsługiwana powierzchnia poświadczeń
  - H3: Konfiguracja dostawców sekretów
  - H2: Przechowywanie auth
  - H3: auth.cooldowns
  - H2: Rejestrowanie
  - H2: Diagnostyka
  - H2: Aktualizacja
  - H2: ACP
  - H2: CLI
  - H2: Kreator
  - H2: Tożsamość
  - H2: Most (starszy, usunięty)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Zmienne szablonu modelu mediów
  - H2: Dołączanie konfiguracji ($include)
  - H2: Powiązane

## gateway/configuration.md

- Trasa: /gateway/configuration
- Nagłówki:
  - H2: Minimalna konfiguracja
  - H2: Edycja konfiguracji
  - H2: Ścisła walidacja
  - H2: Typowe zadania
  - H2: Przeładowanie konfiguracji na gorąco
  - H3: Tryby przeładowania
  - H3: Co stosuje się na gorąco, a co wymaga restartu
  - H3: Planowanie przeładowania
  - H2: RPC konfiguracji (aktualizacje programistyczne)
  - H2: Zmienne środowiskowe
  - H2: Pełna referencja
  - H2: Powiązane

## gateway/diagnostics.md

- Trasa: /gateway/diagnostics
- Nagłówki:
  - H2: Szybki start
  - H2: Polecenie czatu
  - H2: Co zawiera eksport
  - H2: Model prywatności
  - H2: Rejestrator stabilności
  - H2: Przydatne opcje
  - H2: Wyłącz diagnostykę
  - H2: Powiązane

## gateway/discovery.md

- Trasa: /gateway/discovery
- Nagłówki:
  - H2: Terminy
  - H2: Dlaczego utrzymujemy zarówno połączenie bezpośrednie, jak i SSH
  - H2: Dane wejściowe wykrywania (jak klienci dowiadują się, gdzie jest Gateway)
  - H3: 1) Wykrywanie Bonjour / DNS-SD
  - H4: Szczegóły beaconu usługi
  - H3: 2) Tailnet (między sieciami)
  - H3: 3) Ręczny cel / SSH
  - H2: Wybór transportu (polityka klienta)
  - H2: Parowanie + auth (transport bezpośredni)
  - H2: Odpowiedzialności według komponentu
  - H2: Powiązane

## gateway/doctor.md

- Trasa: /gateway/doctor
- Nagłówki:
  - H2: Szybki start
  - H3: Tryby headless i automatyzacji
  - H2: Tryb lintu tylko do odczytu
  - H2: Co robi (podsumowanie)
  - H2: Uzupełnianie i reset interfejsu Dreams
  - H2: Szczegółowe zachowanie i uzasadnienie
  - H2: Powiązane

## gateway/external-apps.md

- Trasa: /gateway/external-apps
- Nagłówki:
  - H2: Co jest dostępne dziś
  - H2: Zalecana ścieżka
  - H2: Kod aplikacji a kod pluginu
  - H2: Powiązane

## gateway/gateway-lock.md

- Trasa: /gateway/gateway-lock
- Nagłówki:
  - H2: Dlaczego
  - H2: Mechanizm
  - H2: Powierzchnia błędów
  - H2: Uwagi operacyjne
  - H2: Powiązane

## gateway/health.md

- Trasa: /gateway/health
- Nagłówki:
  - H2: Szybkie kontrole
  - H2: Głęboka diagnostyka
  - H2: Konfiguracja monitora kondycji
  - H2: Monitorowanie czasu działania
  - H3: Przykłady konfiguracji usługi monitorowania
  - H2: Gdy coś zawiedzie
  - H2: Dedykowane polecenie „health”
  - H2: Powiązane

## gateway/heartbeat.md

- Trasa: /gateway/heartbeat
- Nagłówki:
  - H2: Szybki start (początkujący)
  - H2: Domyślne ustawienia
  - H2: Do czego służy prompt Heartbeat
  - H2: Kontrakt odpowiedzi
  - H2: Konfiguracja
  - H3: Zakres i priorytet
  - H3: Heartbeat per agent
  - H3: Przykład aktywnych godzin
  - H3: Konfiguracja 24/7
  - H3: Przykład wielu kont
  - H3: Notatki terenowe
  - H2: Zachowanie dostarczania
  - H2: Kontrole widoczności
  - H3: Co robi każda flaga
  - H3: Przykłady per kanał i per konto
  - H3: Typowe wzorce
  - H2: HEARTBEAT.md (opcjonalnie)
  - H3: Bloki tasks:
  - H3: Czy agent może aktualizować HEARTBEAT.md?
  - H2: Ręczne wybudzenie (na żądanie)
  - H2: Dostarczanie rozumowania (opcjonalnie)
  - H2: Świadomość kosztów
  - H2: Przepełnienie kontekstu po Heartbeat
  - H2: Powiązane

## gateway/index.md

- Trasa: /gateway
- Nagłówki:
  - H2: Lokalny start w 5 minut
  - H2: Model runtime
  - H2: Punkty końcowe zgodne z OpenAI
  - H3: Priorytet portu i bindowania
  - H3: Tryby przeładowania na gorąco
  - H2: Zestaw poleceń operatora
  - H2: Wiele bram Gateway (ten sam host)
  - H2: Dostęp zdalny
  - H2: Nadzór i cykl życia usługi
  - H2: Szybka ścieżka profilu deweloperskiego
  - H2: Szybka referencja protokołu (widok operatora)
  - H2: Kontrole operacyjne
  - H3: Żywotność
  - H3: Gotowość
  - H3: Odzyskiwanie luk
  - H2: Typowe sygnatury awarii
  - H2: Gwarancje bezpieczeństwa
  - H2: Powiązane

## gateway/local-model-services.md

- Trasa: /gateway/local-model-services
- Nagłówki:
  - H2: Jak to działa
  - H2: Kształt konfiguracji
  - H2: Pola
  - H2: Przykład Inferrs
  - H2: Przykład ds4
  - H2: Uwagi operacyjne
  - H2: Powiązane

## gateway/local-models.md

- Trasa: /gateway/local-models
- Nagłówki:
  - H2: Minimalne wymagania sprzętowe
  - H2: Wybierz backend
  - H2: Zalecane: LM Studio + duży model lokalny (Responses API)
  - H3: Konfiguracja hybrydowa: hostowany główny, lokalny fallback
  - H3: Lokalny jako pierwszy z hostowaną siatką bezpieczeństwa
  - H3: Hosting regionalny / routing danych
  - H2: Inne lokalne proxy zgodne z OpenAI
  - H2: Mniejsze lub bardziej restrykcyjne backendy
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/logging.md

- Trasa: /gateway/logging
- Nagłówki:
  - H1: Rejestrowanie
  - H2: Rejestrator oparty na plikach
  - H2: Przechwytywanie konsoli
  - H2: Redakcja danych
  - H2: Logi Gateway WebSocket
  - H3: Styl logów WS
  - H2: Formatowanie konsoli (rejestrowanie podsystemów)
  - H2: Powiązane

## gateway/multiple-gateways.md

- Trasa: /gateway/multiple-gateways
- Nagłówki:
  - H2: Najlepsza zalecana konfiguracja
  - H2: Szybki start Rescue-Bot
  - H2: Dlaczego to działa
  - H2: Co zmienia --profile rescue onboard
  - H2: Ogólna konfiguracja wielu bram Gateway
  - H2: Lista kontrolna izolacji
  - H2: Mapowanie portów (wyprowadzone)
  - H2: Uwagi Browser/CDP (częsta pułapka)
  - H2: Ręczny przykład env
  - H2: Szybkie kontrole
  - H2: Powiązane

## gateway/network-model.md

- Trasa: /gateway/network-model
- Nagłówki:
  - H2: Powiązane

## gateway/openai-http-api.md

- Trasa: /gateway/openai-http-api
- Nagłówki:
  - H2: Uwierzytelnianie
  - H2: Granica bezpieczeństwa (ważne)
  - H2: Kiedy używać tego punktu końcowego
  - H2: Kontrakt modelu agent-first
  - H2: Włączanie punktu końcowego
  - H2: Wyłączanie punktu końcowego
  - H2: Zachowanie sesji
  - H2: Dlaczego ta powierzchnia ma znaczenie
  - H2: Lista modeli i routing agentów
  - H2: Streaming (SSE)
  - H2: Kontrakt narzędzi czatu
  - H3: Obsługiwane pola żądania
  - H3: Nieobsługiwane warianty
  - H3: Kształt odpowiedzi narzędzia bez streamingu
  - H3: Kształt odpowiedzi narzędzia przy streamingu
  - H3: Pętla kontynuacji narzędzia
  - H2: Szybka konfiguracja Open WebUI
  - H2: Przykłady
  - H2: Powiązane

## gateway/openresponses-http-api.md

- Trasa: /gateway/openresponses-http-api
- Nagłówki:
  - H2: Uwierzytelnianie, bezpieczeństwo i routing
  - H2: Zachowanie sesji
  - H2: Kształt żądania (obsługiwany)
  - H2: Elementy (wejście)
  - H3: message
  - H3: functioncalloutput (narzędzia oparte na turach)
  - H3: reasoning i itemreference
  - H2: Narzędzia (narzędzia funkcyjne po stronie klienta)
  - H2: Obrazy (inputimage)
  - H2: Pliki (inputfile)
  - H2: Limity plików + obrazów (konfiguracja)
  - H2: Streaming (SSE)
  - H2: Użycie
  - H2: Błędy
  - H2: Przykłady
  - H2: Powiązane

## gateway/openshell.md

- Trasa: /gateway/openshell
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybki start
  - H2: Tryby obszaru roboczego
  - H3: mirror
  - H3: remote
  - H3: Wybór trybu
  - H2: Referencja konfiguracji
  - H2: Przykłady
  - H3: Minimalna konfiguracja zdalna
  - H3: Tryb mirror z GPU
  - H3: OpenShell per agent z niestandardową bramą Gateway
  - H2: Zarządzanie cyklem życia
  - H3: Kiedy odtworzyć
  - H2: Wzmocnienie bezpieczeństwa
  - H2: Obecne ograniczenia
  - H2: Jak to działa
  - H2: Powiązane

## gateway/opentelemetry.md

- Trasa: /gateway/opentelemetry
- Nagłówki:
  - H2: Jak to się łączy
  - H2: Szybki start
  - H2: Eksportowane sygnały
  - H2: Referencja konfiguracji
  - H3: Zmienne środowiskowe
  - H2: Prywatność i przechwytywanie treści
  - H2: Próbkowanie i opróżnianie
  - H2: Eksportowane metryki
  - H3: Użycie modelu
  - H3: Przepływ wiadomości
  - H3: Rozmowa
  - H3: Kolejki i sesje
  - H3: Telemetria żywotności sesji
  - H3: Cykl życia uprzęży
  - H3: Wykonywanie narzędzi
  - H3: Exec
  - H3: Wewnętrzna diagnostyka (pamięć i pętla narzędzi)
  - H2: Eksportowane spany
  - H2: Katalog zdarzeń diagnostycznych
  - H2: Bez eksportera
  - H2: Wyłącz
  - H2: Powiązane

## gateway/operator-scopes.md

- Trasa: /gateway/operator-scopes
- Nagłówki:
  - H2: Role
  - H2: Poziomy zakresu
  - H2: Zakres metody jest tylko pierwszą bramką
  - H2: Zatwierdzenia parowania urządzeń
  - H2: Zatwierdzenia parowania węzłów
  - H2: Auth za pomocą współdzielonego sekretu

## gateway/pairing.md

- Trasa: /gateway/pairing
- Nagłówki:
  - H2: Koncepcje
  - H2: Jak działa parowanie
  - H2: Przepływ pracy CLI (przyjazny dla headless)
  - H2: Powierzchnia API (protokół Gateway)
  - H2: Bramkowanie poleceń Node (2026.3.31+)
  - H2: Granice zaufania zdarzeń Node (2026.3.31+)
  - H2: Automatyczne zatwierdzanie (aplikacja macOS)
  - H2: Automatyczne zatwierdzanie urządzeń Trusted-CIDR
  - H2: Automatyczne zatwierdzanie aktualizacji metadanych
  - H2: Pomocnicy parowania QR
  - H2: Lokalność i przekazywane nagłówki
  - H2: Przechowywanie (lokalne, prywatne)
  - H2: Zachowanie transportu
  - H2: Powiązane

## gateway/prometheus.md

- Trasa: /gateway/prometheus
- Nagłówki:
  - H2: Szybki start
  - H2: Eksportowane metryki
  - H2: Polityka etykiet
  - H2: Przepisy PromQL
  - H2: Wybór między Prometheus a eksportem OpenTelemetry
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/protocol.md

- Trasa: /gateway/protocol
- Nagłówki:
  - H2: Transport
  - H2: Handshake (connect)
  - H3: Przykład Node
  - H2: Framing
  - H2: Role + zakresy
  - H3: Role
  - H3: Zakresy (operator)
  - H3: Caps/polecenia/uprawnienia (węzeł)
  - H2: Obecność
  - H3: Zdarzenie żywotności Node w tle
  - H2: Ograniczanie zakresu zdarzeń rozgłoszeniowych
  - H2: Typowe rodziny metod RPC
  - H3: Typowe rodziny zdarzeń
  - H3: Metody pomocnicze Node
  - H3: RPC rejestru zadań
  - H3: Metody pomocnicze operatora
  - H3: Widoki models.list
  - H2: Zatwierdzenia exec
  - H2: Fallback dostarczania agenta
  - H2: Wersjonowanie
  - H3: Stałe klienta
  - H2: Auth
  - H2: Tożsamość urządzenia + parowanie
  - H3: Diagnostyka migracji auth urządzenia
  - H2: TLS + pinning
  - H2: Zakres
  - H2: Powiązane

## gateway/remote-gateway-readme.md

- Ścieżka: /gateway/remote-gateway-readme
- Nagłówki:
  - H1: Uruchamianie OpenClaw.app ze zdalnym Gateway
  - H2: Omówienie
  - H2: Szybka konfiguracja
  - H3: Krok 1: Dodaj konfigurację SSH
  - H3: Krok 2: Skopiuj klucz SSH
  - H3: Krok 3: Skonfiguruj uwierzytelnianie zdalnego Gateway
  - H3: Krok 4: Uruchom tunel SSH
  - H3: Krok 5: Uruchom ponownie OpenClaw.app
  - H2: Automatyczne uruchamianie tunelu przy logowaniu
  - H3: Utwórz plik PLIST
  - H3: Wczytaj agenta Launch Agent
  - H2: Rozwiązywanie problemów
  - H2: Jak to działa
  - H2: Powiązane

## gateway/remote.md

- Ścieżka: /gateway/remote
- Nagłówki:
  - H2: Główna idea
  - H2: Typowe konfiguracje VPN i tailnet
  - H3: Stale działający Gateway w Twoim tailnet
  - H3: Komputer domowy uruchamia Gateway
  - H3: Laptop uruchamia Gateway
  - H2: Przepływ poleceń (co uruchamia się gdzie)
  - H2: Tunel SSH (CLI + narzędzia)
  - H2: Domyślne ustawienia zdalne CLI
  - H2: Pierwszeństwo poświadczeń
  - H2: Zdalny dostęp do interfejsu czatu
  - H2: Tryb zdalny aplikacji macOS
  - H2: Reguły bezpieczeństwa (zdalne/VPN)
  - H3: macOS: trwały tunel SSH przez LaunchAgent
  - H4: Krok 1: dodaj konfigurację SSH
  - H4: Krok 2: skopiuj klucz SSH (jednorazowo)
  - H4: Krok 3: skonfiguruj token Gateway
  - H4: Krok 4: utwórz LaunchAgent
  - H4: Krok 5: wczytaj LaunchAgent
  - H4: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Ścieżka: /gateway/sandbox-vs-tool-policy-vs-elevated
- Nagłówki:
  - H2: Szybkie debugowanie
  - H2: Sandbox: gdzie uruchamiane są narzędzia
  - H3: Montowania bind (szybka kontrola bezpieczeństwa)
  - H2: Polityka narzędzi: które narzędzia istnieją/są możliwe do wywołania
  - H3: Grupy narzędzi (skróty)
  - H2: Podwyższony: tylko exec „uruchom na hoście”
  - H2: Typowe poprawki „więzienia sandbox”
  - H3: „Narzędzie X zablokowane przez politykę narzędzi sandbox”
  - H3: „Myślałem, że to main, dlaczego jest w sandbox?”
  - H2: Powiązane

## gateway/sandboxing.md

- Ścieżka: /gateway/sandboxing
- Nagłówki:
  - H2: Co trafia do sandbox
  - H2: Tryby
  - H2: Zakres
  - H2: Backend
  - H3: Wybór backendu
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Tryby obszaru roboczego
  - H4: Cykl życia OpenShell
  - H2: Dostęp do obszaru roboczego
  - H2: Niestandardowe montowania bind
  - H2: Obrazy i konfiguracja
  - H2: setupCommand (jednorazowa konfiguracja kontenera)
  - H2: Polityka narzędzi i wyjścia awaryjne
  - H2: Nadpisania dla wielu agentów
  - H2: Minimalny przykład włączenia
  - H2: Powiązane

## gateway/secrets-plan-contract.md

- Ścieżka: /gateway/secrets-plan-contract
- Nagłówki:
  - H2: Kształt pliku planu
  - H2: Upserty i usunięcia dostawców
  - H2: Obsługiwany zakres celu
  - H2: Zachowanie typu celu
  - H2: Reguły walidacji ścieżek
  - H2: Zachowanie przy błędzie
  - H2: Zachowanie zgody dostawcy exec
  - H2: Uwagi o zakresie środowiska uruchomieniowego i audytu
  - H2: Kontrole operatora
  - H2: Powiązana dokumentacja

## gateway/secrets.md

- Ścieżka: /gateway/secrets
- Nagłówki:
  - H2: Cele i model środowiska uruchomieniowego
  - H2: Granica dostępu agenta
  - H2: Filtrowanie aktywnej powierzchni
  - H2: Diagnostyka powierzchni uwierzytelniania Gateway
  - H2: Preflight odniesienia onboardingu
  - H2: Kontrakt SecretRef
  - H2: Konfiguracja dostawcy
  - H2: Klucze API oparte na plikach
  - H2: Przykłady integracji exec
  - H2: Zmienne środowiskowe serwera MCP
  - H2: Materiały uwierzytelniania SSH sandbox
  - H2: Obsługiwana powierzchnia poświadczeń
  - H2: Wymagane zachowanie i pierwszeństwo
  - H2: Wyzwalacze aktywacji
  - H2: Sygnały degradacji i odzyskania
  - H2: Rozwiązywanie ścieżki poleceń
  - H2: Przepływ pracy audytu i konfiguracji
  - H2: Jednokierunkowa polityka bezpieczeństwa
  - H2: Uwagi o zgodności starszego uwierzytelniania
  - H2: Uwaga o interfejsie Web UI
  - H2: Powiązane

## gateway/security/audit-checks.md

- Ścieżka: /gateway/security/audit-checks
- Nagłówki:
  - H2: Powiązane

## gateway/security/exposure-runbook.md

- Ścieżka: /gateway/security/exposure-runbook
- Nagłówki:
  - H2: Wybierz wzorzec ekspozycji
  - H2: Inwentaryzacja pre-flight
  - H2: Kontrole bazowe
  - H2: Minimalna bezpieczna baza
  - H2: Ekspozycja DM i grup
  - H2: Kontrole reverse proxy
  - H2: Przegląd narzędzi i sandbox
  - H2: Walidacja po zmianie
  - H2: Plan wycofania
  - H2: Lista kontrolna przeglądu

## gateway/security/index.md

- Ścieżka: /gateway/security
- Nagłówki:
  - H2: Najpierw zakres: model bezpieczeństwa osobistego asystenta
  - H2: Szybka kontrola: openclaw security audit
  - H3: Blokada zależności opublikowanego pakietu
  - H3: Wdrożenie i zaufanie do hosta
  - H3: Bezpieczne operacje na plikach
  - H3: Współdzielony obszar roboczy Slack: realne ryzyko
  - H3: Agent współdzielony w firmie: akceptowalny wzorzec
  - H2: Koncepcja zaufania Gateway i Node
  - H2: Macierz granic zaufania
  - H2: Celowo niebędące podatnościami
  - H2: Wzmocniona baza w 60 sekund
  - H2: Szybka reguła współdzielonej skrzynki odbiorczej
  - H2: Model widoczności kontekstu
  - H2: Co sprawdza audyt (wysoki poziom)
  - H2: Mapa przechowywania poświadczeń
  - H2: Lista kontrolna audytu bezpieczeństwa
  - H2: Glosariusz audytu bezpieczeństwa
  - H2: Control UI przez HTTP
  - H2: Podsumowanie niebezpiecznych lub ryzykownych flag
  - H2: Konfiguracja reverse proxy
  - H2: Uwagi o HSTS i origin
  - H2: Lokalne logi sesji znajdują się na dysku
  - H2: Wykonywanie Node (system.run)
  - H2: Dynamiczne Skills (obserwator / zdalne węzły)
  - H2: Model zagrożeń
  - H2: Główna koncepcja: kontrola dostępu przed inteligencją
  - H2: Model autoryzacji poleceń
  - H2: Ryzyko narzędzi płaszczyzny sterowania
  - H2: Pluginy
  - H2: Model dostępu DM: parowanie, allowlist, otwarty, wyłączony
  - H2: Izolacja sesji DM (tryb wielu użytkowników)
  - H3: Bezpieczny tryb DM (zalecany)
  - H2: Allowlists dla DM i grup
  - H2: Prompt injection (czym jest i dlaczego ma znaczenie)
  - H2: Sanityzacja tokenów specjalnych treści zewnętrznych
  - H2: Niebezpieczne flagi obejścia treści zewnętrznych
  - H3: Prompt injection nie wymaga publicznych DM
  - H3: Samodzielnie hostowane backendy LLM
  - H3: Siła modelu (uwaga bezpieczeństwa)
  - H2: Rozumowanie i szczegółowe dane wyjściowe w grupach
  - H2: Przykłady wzmacniania konfiguracji
  - H3: Uprawnienia plików
  - H3: Ekspozycja sieciowa (bind, port, zapora)
  - H3: Publikowanie portów Docker z UFW
  - H3: Wykrywanie mDNS/Bonjour
  - H3: Zablokuj WebSocket Gateway (uwierzytelnianie lokalne)
  - H3: Nagłówki tożsamości Tailscale Serve
  - H3: Sterowanie przeglądarką przez host Node (zalecane)
  - H3: Sekrety na dysku
  - H3: Pliki .env obszaru roboczego
  - H3: Logi i transkrypcje (redakcja i retencja)
  - H3: DM: domyślne parowanie
  - H3: Grupy: wymagaj wzmianki wszędzie
  - H3: Oddzielne numery (WhatsApp, Signal, Telegram)
  - H3: Tryb tylko do odczytu (przez sandbox i narzędzia)
  - H3: Bezpieczna baza (kopiuj/wklej)
  - H2: Sandboxing (zalecany)
  - H3: Bariera bezpieczeństwa delegowania do subagentów
  - H2: Ryzyka sterowania przeglądarką
  - H3: Polityka SSRF przeglądarki (domyślnie ścisła)
  - H2: Profile dostępu na agenta (wielu agentów)
  - H3: Przykład: pełny dostęp (bez sandbox)
  - H3: Przykład: narzędzia tylko do odczytu + obszar roboczy tylko do odczytu
  - H3: Przykład: brak dostępu do systemu plików/powłoki (dozwolone wiadomości dostawcy)
  - H2: Reagowanie na incydenty
  - H3: Ogranicz
  - H3: Rotuj (załóż kompromitację, jeśli wyciekły sekrety)
  - H3: Audyt
  - H3: Zbierz materiały do raportu
  - H2: Skanowanie sekretów
  - H2: Zgłaszanie problemów bezpieczeństwa

## gateway/security/secure-file-operations.md

- Ścieżka: /gateway/security/secure-file-operations
- Nagłówki:
  - H2: Domyślnie: brak pomocnika Python
  - H2: Co pozostaje chronione bez Python
  - H2: Co dodaje Python
  - H2: Wskazówki dla Plugin i rdzenia

## gateway/security/shrinkwrap.md

- Ścieżka: /gateway/security/shrinkwrap
- Nagłówki:
  - H2: Łatwa wersja
  - H2: Dlaczego OpenClaw tego używa
  - H2: Szczegóły techniczne

## gateway/tailscale.md

- Ścieżka: /gateway/tailscale
- Nagłówki:
  - H2: Tryby
  - H2: Uwierzytelnianie
  - H2: Przykłady konfiguracji
  - H3: Tylko tailnet (Serve)
  - H3: Tylko tailnet (wiązanie z adresem IP tailnet)
  - H3: Publiczny internet (Funnel + współdzielone hasło)
  - H2: Przykłady CLI
  - H2: Uwagi
  - H2: Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)
  - H2: Wymagania wstępne i limity Tailscale
  - H2: Dowiedz się więcej
  - H2: Powiązane

## gateway/tools-invoke-http-api.md

- Ścieżka: /gateway/tools-invoke-http-api
- Nagłówki:
  - H2: Uwierzytelnianie
  - H2: Granica bezpieczeństwa (ważne)
  - H2: Treść żądania
  - H2: Zachowanie polityki i routingu
  - H2: Odpowiedzi
  - H2: Przykład
  - H2: Powiązane

## gateway/troubleshooting.md

- Ścieżka: /gateway/troubleshooting
- Nagłówki:
  - H2: Drabinka poleceń
  - H2: Po aktualizacji
  - H2: Instalacje split brain i strażnik nowszej konfiguracji
  - H2: Niezgodność protokołu po wycofaniu
  - H2: Dowiązanie symboliczne Skill pominięte jako wyjście poza ścieżkę
  - H2: Anthropic 429 wymaga dodatkowego użycia dla długiego kontekstu
  - H2: Odpowiedzi 403 z upstream zablokowane
  - H2: Lokalny backend zgodny z OpenAI przechodzi bezpośrednie próby, ale uruchomienia agenta kończą się niepowodzeniem
  - H2: Brak odpowiedzi
  - H2: Łączność Control UI dashboardu
  - H3: Szybka mapa kodów szczegółów uwierzytelniania
  - H2: Usługa Gateway nie działa
  - H2: Gateway macOS po cichu przestaje odpowiadać, a potem wznawia działanie, gdy dotkniesz dashboardu
  - H2: Gateway kończy działanie przy wysokim użyciu pamięci
  - H2: Gateway odrzucił nieprawidłową konfigurację
  - H2: Ostrzeżenia sondy Gateway
  - H2: Kanał połączony, wiadomości nie przepływają
  - H2: Dostarczanie Cron i Heartbeat
  - H2: Node sparowany, narzędzie nie działa
  - H2: Narzędzie przeglądarki nie działa
  - H2: Jeśli po aktualizacji coś nagle się zepsuło
  - H2: Powiązane

## gateway/trusted-proxy-auth.md

- Ścieżka: /gateway/trusted-proxy-auth
- Nagłówki:
  - H2: Kiedy używać
  - H2: Kiedy NIE używać
  - H2: Jak to działa
  - H2: Zachowanie parowania Control UI
  - H2: Konfiguracja
  - H3: Odniesienie konfiguracji
  - H2: Terminacja TLS i HSTS
  - H3: Wskazówki wdrożeniowe
  - H2: Przykłady konfiguracji proxy
  - H2: Mieszana konfiguracja tokenów
  - H2: Nagłówek zakresów operatora
  - H2: Lista kontrolna bezpieczeństwa
  - H2: Audyt bezpieczeństwa
  - H2: Rozwiązywanie problemów
  - H2: Migracja z uwierzytelniania tokenem
  - H2: Powiązane

## help/debugging.md

- Ścieżka: /help/debugging
- Nagłówki:
  - H2: Nadpisania debugowania środowiska uruchomieniowego
  - H2: Dane wyjściowe śladu sesji
  - H2: Ślad cyklu życia Plugin
  - H2: Profilowanie uruchamiania CLI i poleceń
  - H2: Tryb obserwowania Gateway
  - H2: Profil dev + Gateway dev (--dev)
  - H2: Rejestrowanie surowego strumienia (OpenClaw)
  - H2: Rejestrowanie surowych fragmentów zgodnych z OpenAI
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Debugowanie w VSCode
  - H3: Konfiguracja
  - H3: Uwagi
  - H2: Powiązane

## help/environment.md

- Ścieżka: /help/environment
- Nagłówki:
  - H2: Pierwszeństwo (najwyższe → najniższe)
  - H2: Poświadczenia dostawcy i .env obszaru roboczego
  - H2: Blok env konfiguracji
  - H2: Import env powłoki
  - H2: Migawki powłoki exec
  - H2: Zmienne env wstrzykiwane przez środowisko uruchomieniowe
  - H2: Zmienne env interfejsu UI
  - H2: Podstawianie zmiennych env w konfiguracji
  - H2: Odwołania sekretów vs ciągi ${ENV}
  - H2: Zmienne env związane ze ścieżkami
  - H2: Rejestrowanie
  - H3: OPENCLAWHOME
  - H2: Użytkownicy nvm: błędy TLS webfetch
  - H2: Starsze zmienne środowiskowe
  - H2: Powiązane

## help/faq-first-run.md

- Ścieżka: /help/faq-first-run
- Nagłówki:
  - H2: Szybki start i konfiguracja pierwszego uruchomienia
  - H2: Powiązane

## help/faq-models.md

- Ścieżka: /help/faq-models
- Nagłówki:
  - H2: Modele: ustawienia domyślne, wybór, aliasy, przełączanie
  - H2: Przełączanie awaryjne modeli i „All models failed”
  - H2: Profile uwierzytelniania: czym są i jak nimi zarządzać
  - H2: Powiązane

## help/faq.md

- Ścieżka: /help/faq
- Nagłówki:
  - H2: Pierwsze 60 sekund, jeśli coś jest zepsute
  - H2: Szybki start i konfiguracja pierwszego uruchomienia
  - H2: Czym jest OpenClaw?
  - H2: Skills i automatyzacja
  - H2: Sandboxing i pamięć
  - H2: Gdzie rzeczy znajdują się na dysku
  - H2: Podstawy konfiguracji
  - H2: Zdalne bramy Gateway i węzły
  - H2: Zmienne env i wczytywanie .env
  - H2: Sesje i wiele czatów
  - H2: Modele, przełączanie awaryjne i profile uwierzytelniania
  - H2: Gateway: porty, „już działa” i tryb zdalny
  - H2: Rejestrowanie i debugowanie
  - H2: Media i załączniki
  - H2: Bezpieczeństwo i kontrola dostępu
  - H2: Polecenia czatu, przerywanie zadań i „to się nie zatrzyma”
  - H2: Różne
  - H2: Powiązane

## help/index.md

- Ścieżka: /help
- Nagłówki:
  - H2: FAQ
  - H2: Diagnostyka
  - H2: Testowanie
  - H2: Społeczność i meta

## help/scripts.md

- Ścieżka: /help/scripts
- Nagłówki:
  - H2: Konwencje
  - H2: Skrypty monitorowania uwierzytelniania
  - H2: Pomocnik odczytu GitHub
  - H2: Przy dodawaniu skryptów
  - H2: Powiązane

## help/testing-live.md

- Ścieżka: /help/testing-live
- Nagłówki:
  - H2: Na żywo: lokalne polecenia smoke
  - H2: Na żywo: przegląd możliwości węzła Android
  - H2: Na żywo: smoke modeli (klucze profili)
  - H3: Warstwa 1: bezpośrednie uzupełnianie modelu (bez gateway)
  - H3: Warstwa 2: Gateway + smoke agenta deweloperskiego (co faktycznie robi „@openclaw”)
  - H2: Na żywo: smoke backendu CLI (Claude, Gemini lub inne lokalne CLI)
  - H2: Na żywo: osiągalność proxy APNs HTTP/2
  - H2: Na żywo: smoke wiązania ACP (/acp spawn ... --bind here)
  - H2: Na żywo: smoke harnessa serwera aplikacji Codex
  - H3: Zalecane przepisy live
  - H2: Na żywo: macierz modeli (co obejmujemy)
  - H3: Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)
  - H3: Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalnie Exec)
  - H3: Wizja: wysyłanie obrazu (załącznik → wiadomość multimodalna)
  - H3: Agregatory / alternatywne bramy
  - H2: Dane uwierzytelniające (nigdy nie commituj)
  - H2: Deepgram na żywo (transkrypcja audio)
  - H2: BytePlus coding plan na żywo
  - H2: ComfyUI workflow media na żywo
  - H2: Generowanie obrazów na żywo
  - H2: Generowanie muzyki na żywo
  - H2: Generowanie wideo na żywo
  - H2: Harness multimediów na żywo
  - H2: Powiązane

## help/testing-updates-plugins.md

- Ścieżka: /help/testing-updates-plugins
- Nagłówki:
  - H2: Co chronimy
  - H2: Lokalne potwierdzenie podczas rozwoju
  - H2: Ścieżki Docker
  - H2: Akceptacja pakietu
  - H2: Domyślne wydanie
  - H2: Zgodność ze starszymi wersjami
  - H2: Dodawanie pokrycia
  - H2: Triage błędów

## help/testing.md

- Ścieżka: /help/testing
- Nagłówki:
  - H2: Szybki start
  - H2: Katalogi tymczasowe testów
  - H2: Runnery specyficzne dla QA
  - H3: Współdzielone dane uwierzytelniające Telegram przez Convex (v1)
  - H3: Dodawanie kanału do QA
  - H2: Zestawy testów (co uruchamia się gdzie)
  - H3: Jednostkowe / integracyjne (domyślne)
  - H3: Stabilność (gateway)
  - H3: E2E (agregat repozytorium)
  - H3: E2E (smoke gateway)
  - H3: E2E (zamockowana przeglądarka Control UI)
  - H3: E2E: smoke backendu OpenShell
  - H3: Na żywo (prawdziwi dostawcy + prawdziwe modele)
  - H2: Który zestaw mam uruchomić?
  - H2: Testy na żywo (dotykające sieci)
  - H2: Runnery Docker (opcjonalne kontrole „działa w Linux”)
  - H2: Kontrola spójności dokumentacji
  - H2: Regresja offline (bezpieczna dla CI)
  - H2: Ewaluacje niezawodności agentów (Skills)
  - H2: Testy kontraktowe (kształt pluginu i kanału)
  - H3: Polecenia
  - H3: Kontrakty kanałów
  - H3: Kontrakty statusu dostawcy
  - H3: Kontrakty dostawców
  - H3: Kiedy uruchamiać
  - H2: Dodawanie regresji (wskazówki)
  - H2: Powiązane

## help/troubleshooting.md

- Ścieżka: /help/troubleshooting
- Nagłówki:
  - H2: Pierwsze 60 sekund
  - H2: Asystent wydaje się ograniczony lub brakuje mu narzędzi
  - H2: Długi kontekst Anthropic 429
  - H2: Lokalny backend zgodny z OpenAI działa bezpośrednio, ale zawodzi w OpenClaw
  - H2: Instalacja pluginu kończy się błędem z powodu brakujących rozszerzeń openclaw
  - H2: Polityka instalacji blokuje instalacje lub aktualizacje pluginów
  - H2: Plugin jest obecny, ale zablokowany przez podejrzaną własność
  - H2: Drzewo decyzyjne
  - H2: Powiązane

## index.md

- Ścieżka: /
- Nagłówki:
  - H1: OpenClaw 🦞
  - H2: Czym jest OpenClaw?
  - H2: Jak to działa
  - H2: Kluczowe możliwości
  - H2: Szybki start
  - H2: Dashboard
  - H2: Konfiguracja (opcjonalna)
  - H2: Zacznij tutaj
  - H2: Dowiedz się więcej

## install/ansible.md

- Ścieżka: /install/ansible
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Co zostaje zainstalowane
  - H2: Konfiguracja po instalacji
  - H3: Szybkie polecenia
  - H2: Architektura bezpieczeństwa
  - H2: Instalacja ręczna
  - H2: Aktualizowanie
  - H2: Rozwiązywanie problemów
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## install/azure.md

- Ścieżka: /install/azure
- Nagłówki:
  - H2: Co zrobisz
  - H2: Czego potrzebujesz
  - H2: Skonfiguruj wdrożenie
  - H2: Wdróż zasoby Azure
  - H2: Zainstaluj OpenClaw
  - H2: Kwestie kosztów
  - H2: Czyszczenie
  - H2: Następne kroki
  - H2: Powiązane

## install/bun.md

- Ścieżka: /install/bun
- Nagłówki:
  - H2: Instalacja
  - H2: Skrypty cyklu życia
  - H2: Zastrzeżenia
  - H2: Powiązane

## install/clawdock.md

- Ścieżka: /install/clawdock
- Nagłówki:
  - H2: Instalacja
  - H2: Co otrzymujesz
  - H3: Podstawowe operacje
  - H3: Dostęp do kontenera
  - H3: Web UI i parowanie
  - H3: Konfiguracja i utrzymanie
  - H3: Narzędzia pomocnicze
  - H2: Przebieg pierwszego uruchomienia
  - H2: Konfiguracja i sekrety
  - H2: Powiązane

## install/development-channels.md

- Ścieżka: /install/development-channels
- Nagłówki:
  - H2: Przełączanie kanałów
  - H2: Jednorazowe wskazanie wersji lub tagu
  - H2: Przebieg próbny
  - H2: Pluginy i kanały
  - H2: Sprawdzanie bieżącego statusu
  - H2: Dobre praktyki tagowania
  - H2: Dostępność aplikacji macOS
  - H2: Powiązane

## install/digitalocean.md

- Ścieżka: /install/digitalocean
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Trwałość i kopie zapasowe
  - H2: Wskazówki dla 1 GB RAM
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/docker-vm-runtime.md

- Ścieżka: /install/docker-vm-runtime
- Nagłówki:
  - H2: Wbuduj wymagane binaria w obraz
  - H2: Zbuduj i uruchom
  - H2: Co gdzie jest utrwalane
  - H2: Aktualizacje
  - H2: Powiązane

## install/docker.md

- Ścieżka: /install/docker
- Nagłówki:
  - H2: Czy Docker jest dla mnie odpowiedni?
  - H2: Wymagania wstępne
  - H2: Skonteneryzowany gateway
  - H3: Przebieg ręczny
  - H3: Zmienne środowiskowe
  - H3: Obserwowalność
  - H3: Kontrole kondycji
  - H3: LAN kontra loopback
  - H3: Lokalni dostawcy hosta
  - H3: Backend Claude CLI w Docker
  - H3: Bonjour / mDNS
  - H3: Pamięć masowa i trwałość
  - H3: Pomocnicze skrypty powłoki (opcjonalne)
  - H3: Uruchamiasz na VPS?
  - H2: Piaskownica agenta
  - H3: Szybkie włączenie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/exe-dev.md

- Ścieżka: /install/exe-dev
- Nagłówki:
  - H2: Szybka ścieżka dla początkujących
  - H2: Czego potrzebujesz
  - H2: Zautomatyzowana instalacja z Shelley
  - H2: Instalacja ręczna
  - H2: 1) Utwórz VM
  - H2: 2) Zainstaluj wymagania wstępne (na VM)
  - H2: 3) Zainstaluj OpenClaw
  - H2: 4) Skonfiguruj nginx, aby proxy OpenClaw działało na porcie 8000
  - H2: 5) Uzyskaj dostęp do OpenClaw i nadaj uprawnienia
  - H2: Konfiguracja kanału zdalnego
  - H2: Dostęp zdalny
  - H2: Aktualizowanie
  - H2: Powiązane

## install/fly.md

- Ścieżka: /install/fly
- Nagłówki:
  - H2: Czego potrzebujesz
  - H2: Szybka ścieżka dla początkujących
  - H2: Rozwiązywanie problemów
  - H3: „Aplikacja nie nasłuchuje pod oczekiwanym adresem”
  - H3: Kontrole kondycji zawodzą / odmowa połączenia
  - H3: OOM / problemy z pamięcią
  - H3: Problemy z blokadą Gateway
  - H3: Konfiguracja nie jest odczytywana
  - H3: Zapisywanie konfiguracji przez SSH
  - H3: Stan nie jest utrwalany
  - H2: Aktualizacje
  - H3: Polecenie aktualizowania maszyny
  - H2: Wdrożenie prywatne (utwardzone)
  - H3: Kiedy używać wdrożenia prywatnego
  - H3: Konfiguracja
  - H3: Dostęp do wdrożenia prywatnego
  - H3: Webhooks z wdrożeniem prywatnym
  - H3: Korzyści bezpieczeństwa
  - H2: Notatki
  - H2: Koszt
  - H2: Następne kroki
  - H2: Powiązane

## install/gcp.md

- Ścieżka: /install/gcp
- Nagłówki:
  - H2: Co robimy (prostymi słowami)?
  - H2: Szybka ścieżka (doświadczeni operatorzy)
  - H2: Czego potrzebujesz
  - H2: Rozwiązywanie problemów
  - H2: Konta usług (najlepsza praktyka bezpieczeństwa)
  - H2: Następne kroki
  - H2: Powiązane

## install/hetzner.md

- Ścieżka: /install/hetzner
- Nagłówki:
  - H2: Cel
  - H2: Co robimy (prostymi słowami)?
  - H2: Szybka ścieżka (doświadczeni operatorzy)
  - H2: Czego potrzebujesz
  - H2: Infrastruktura jako kod (Terraform)
  - H2: Następne kroki
  - H2: Powiązane

## install/hostinger.md

- Ścieżka: /install/hostinger
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Opcja A: OpenClaw jednym kliknięciem
  - H2: Opcja B: OpenClaw na VPS
  - H2: Zweryfikuj konfigurację
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/index.md

- Ścieżka: /install
- Nagłówki:
  - H2: Wymagania systemowe
  - H2: Zalecane: skrypt instalatora
  - H2: Alternatywne metody instalacji
  - H3: Instalator z lokalnym prefiksem (install-cli.sh)
  - H3: npm, pnpm lub bun
  - H3: Ze źródeł
  - H3: Instalacja z checkoutu GitHub main
  - H3: Kontenery i menedżery pakietów
  - H2: Zweryfikuj instalację
  - H2: Hosting i wdrożenie
  - H2: Zaktualizuj, zmigruj lub odinstaluj
  - H2: Rozwiązywanie problemów: nie znaleziono openclaw

## install/installer.md

- Ścieżka: /install/installer
- Nagłówki:
  - H2: Szybkie polecenia
  - H2: install.sh
  - H3: Przebieg (install.sh)
  - H3: Wykrywanie checkoutu źródeł
  - H3: Przykłady (install.sh)
  - H2: install-cli.sh
  - H3: Przebieg (install-cli.sh)
  - H3: Przykłady (install-cli.sh)
  - H2: install.ps1
  - H3: Przebieg (install.ps1)
  - H3: Przykłady (install.ps1)
  - H2: CI i automatyzacja
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/kubernetes.md

- Ścieżka: /install/kubernetes
- Nagłówki:
  - H2: Dlaczego nie Helm?
  - H2: Czego potrzebujesz
  - H2: Szybki start
  - H2: Lokalne testowanie z Kind
  - H2: Krok po kroku
  - H3: 1) Wdróż
  - H3: 2) Uzyskaj dostęp do gateway
  - H2: Co zostaje wdrożone
  - H2: Dostosowywanie
  - H3: Instrukcje agenta
  - H3: Konfiguracja Gateway
  - H3: Dodaj dostawców
  - H3: Niestandardowa przestrzeń nazw
  - H3: Niestandardowy obraz
  - H3: Udostępnij poza port-forward
  - H2: Wdróż ponownie
  - H2: Demontaż
  - H2: Notatki architektoniczne
  - H2: Struktura plików
  - H2: Powiązane

## install/macos-vm.md

- Ścieżka: /install/macos-vm
- Nagłówki:
  - H2: Zalecana wartość domyślna (większość użytkowników)
  - H2: Opcje VM macOS
  - H3: Lokalna VM na Twoim Apple Silicon Mac (Lume)
  - H3: Hostowani dostawcy Mac (chmura)
  - H2: Szybka ścieżka (Lume, doświadczeni użytkownicy)
  - H2: Czego potrzebujesz (Lume)
  - H2: 1) Zainstaluj Lume
  - H2: 2) Utwórz macOS VM
  - H2: 3) Ukończ Setup Assistant
  - H2: 4) Uzyskaj adres IP VM
  - H2: 5) Połącz się z VM przez SSH
  - H2: 6) Zainstaluj OpenClaw
  - H2: 7) Skonfiguruj kanały
  - H2: 8) Uruchom VM bez interfejsu graficznego
  - H2: Bonus: integracja iMessage
  - H2: Zapisz złoty obraz
  - H2: Działanie 24/7
  - H2: Rozwiązywanie problemów
  - H2: Powiązana dokumentacja

## install/migrating-claude.md

- Ścieżka: /install/migrating-claude
- Nagłówki:
  - H2: Dwa sposoby importu
  - H2: Co zostaje zaimportowane
  - H2: Co pozostaje tylko w archiwum
  - H2: Wybór źródła
  - H2: Zalecany przebieg
  - H2: Obsługa konfliktów
  - H2: Dane wyjściowe JSON dla automatyzacji
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/migrating-hermes.md

- Ścieżka: /install/migrating-hermes
- Nagłówki:
  - H2: Dwa sposoby importu
  - H2: Co zostaje zaimportowane
  - H2: Co pozostaje tylko w archiwum
  - H2: Zalecany przebieg
  - H2: Obsługa konfliktów
  - H2: Sekrety
  - H2: Dane wyjściowe JSON dla automatyzacji
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/migrating.md

- Ścieżka: /install/migrating
- Nagłówki:
  - H2: Import z innego systemu agentowego
  - H2: Przenieś OpenClaw na nową maszynę
  - H3: Kroki migracji
  - H3: Typowe pułapki
  - H3: Lista kontrolna weryfikacji
  - H2: Uaktualnij plugin w miejscu
  - H2: Powiązane

## install/nix.md

- Ścieżka: /install/nix
- Nagłówki:
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Zachowanie runtime w trybie Nix
  - H3: Co zmienia się w trybie Nix
  - H3: Ścieżki konfiguracji i stanu
  - H3: Wykrywanie PATH usługi
  - H2: Powiązane

## install/node.md

- Ścieżka: /install/node
- Nagłówki:
  - H2: Sprawdź swoją wersję
  - H2: Zainstaluj Node
  - H2: Rozwiązywanie problemów
  - H3: openclaw: command not found
  - H3: Błędy uprawnień przy npm install -g (Linux)
  - H2: Powiązane

## install/northflank.mdx

- Ścieżka: /install/northflank
- Nagłówki:
  - H1: Northflank
  - H2: Jak zacząć
  - H2: Co otrzymujesz
  - H2: Połącz kanał
  - H2: Następne kroki

## install/oracle.md

- Ścieżka: /install/oracle
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Zweryfikuj postawę bezpieczeństwa
  - H2: Notatki ARM
  - H2: Trwałość i kopie zapasowe
  - H2: Rozwiązanie awaryjne: tunel SSH
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/podman.md

- Ścieżka: /install/podman
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybki start
  - H2: Podman i Tailscale
  - H2: Systemd (Quadlet, opcjonalnie)
  - H2: Konfiguracja, env i pamięć masowa
  - H2: Przydatne polecenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/railway.mdx

- Ścieżka: /install/railway
- Nagłówki:
  - H1: Railway
  - H2: Szybka lista kontrolna (nowi użytkownicy)
  - H2: Wdrożenie jednym kliknięciem
  - H2: Co otrzymujesz
  - H2: Wymagane ustawienia Railway
  - H3: Sieć publiczna
  - H3: Wolumen (wymagany)
  - H3: Zmienne
  - H2: Połącz kanał
  - H2: Kopie zapasowe &amp; migracja
  - H2: Następne kroki

## install/raspberry-pi.md

- Trasa: /install/raspberry-pi
- Nagłówki:
  - H2: Zgodność sprzętowa
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Wskazówki dotyczące wydajności
  - H2: Zalecana konfiguracja modelu
  - H2: Uwagi o plikach binarnych ARM
  - H2: Trwałość danych i kopie zapasowe
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/render.mdx

- Trasa: /install/render
- Nagłówki:
  - H1: Render
  - H2: Wymagania wstępne
  - H2: Wdróż za pomocą Render Blueprint
  - H2: Zrozumienie Blueprint
  - H2: Wybór planu
  - H2: Po wdrożeniu
  - H3: Uzyskaj dostęp do Control UI
  - H2: Funkcje Render Dashboard
  - H3: Logi
  - H3: Dostęp do powłoki
  - H3: Zmienne środowiskowe
  - H3: Automatyczne wdrażanie
  - H2: Domena niestandardowa
  - H2: Skalowanie
  - H2: Kopie zapasowe i migracja
  - H2: Rozwiązywanie problemów
  - H3: Usługa się nie uruchamia
  - H3: Wolne zimne starty (warstwa bezpłatna)
  - H3: Utrata danych po ponownym wdrożeniu
  - H3: Niepowodzenia kontroli stanu
  - H2: Następne kroki

## install/uninstall.md

- Trasa: /install/uninstall
- Nagłówki:
  - H2: Łatwa ścieżka (CLI nadal zainstalowane)
  - H2: Ręczne usuwanie usługi (CLI niezainstalowane)
  - H3: macOS (launchd)
  - H3: Linux (jednostka użytkownika systemd)
  - H3: Windows (Zaplanowane zadanie)
  - H2: Normalna instalacja a checkout źródeł
  - H3: Normalna instalacja (install.sh / npm / pnpm / bun)
  - H3: Checkout źródeł (git clone)
  - H2: Powiązane

## install/updating.md

- Trasa: /install/updating
- Nagłówki:
  - H2: Zalecane: openclaw update
  - H2: Przełączanie między instalacjami npm i git
  - H2: Alternatywa: ponowne uruchomienie instalatora
  - H2: Alternatywa: ręczne npm, pnpm lub bun
  - H3: Zaawansowane tematy instalacji npm
  - H2: Automatyczny aktualizator
  - H2: Po aktualizacji
  - H3: Uruchom doctor
  - H3: Uruchom ponownie gateway
  - H3: Zweryfikuj
  - H2: Wycofanie
  - H3: Przypnij wersję (npm)
  - H3: Przypnij commit (źródła)
  - H2: Jeśli utkniesz
  - H2: Powiązane

## install/upstash.md

- Trasa: /install/upstash
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Utwórz Box
  - H2: Połącz przez tunel SSH
  - H2: Zainstaluj OpenClaw
  - H2: Uruchom onboarding
  - H2: Uruchom Gateway
  - H2: Automatyczne ponowne uruchamianie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## logging.md

- Trasa: /logging
- Nagłówki:
  - H2: Gdzie znajdują się logi
  - H2: Jak czytać logi
  - H3: CLI: śledzenie na żywo (zalecane)
  - H3: Control UI (web)
  - H3: Logi tylko kanału
  - H2: Formaty logów
  - H3: Logi plikowe (JSONL)
  - H3: Dane wyjściowe konsoli
  - H3: Logi Gateway WebSocket
  - H2: Konfigurowanie logowania
  - H3: Poziomy logowania
  - H3: Ukierunkowana diagnostyka transportu modelu
  - H3: Korelacja śledzenia
  - H3: Rozmiar i czas wywołania modelu
  - H3: Style konsoli
  - H3: Redakcja danych
  - H2: Diagnostyka i OpenTelemetry
  - H2: Wskazówki dotyczące rozwiązywania problemów
  - H2: Powiązane

## maturity/scorecard.md

- Trasa: /maturity/scorecard
- Nagłówki:
  - H1: Karta wyników dojrzałości
  - H2: Do czego służy ta strona
  - H2: W skrócie
  - H2: Przedziały wyników
  - H2: Eksplorator powierzchni
  - H2: Podsumowanie dowodów QA
  - H3: Gotowość według obszaru

## maturity/taxonomy.md

- Trasa: /maturity/taxonomy
- Nagłówki:
  - H1: Taksonomia dojrzałości
  - H2: Jak czytać tę stronę
  - H2: Poziomy dojrzałości
  - H2: Obszary produktu
  - H2: Szczegóły
  - H3: Rdzeń
  - H3: Platforma
  - H3: Kanał
  - H3: Dostawca i narzędzie

## network.md

- Trasa: /network
- Nagłówki:
  - H2: Model podstawowy
  - H2: Parowanie + tożsamość
  - H2: Wykrywanie + transporty
  - H2: Węzły + transporty
  - H2: Bezpieczeństwo
  - H2: Powiązane

## nodes/audio.md

- Trasa: /nodes/audio
- Nagłówki:
  - H2: Co działa
  - H2: Automatyczne wykrywanie (domyślne)
  - H2: Przykłady konfiguracji
  - H3: Dostawca + awaryjne CLI (OpenAI + Whisper CLI)
  - H3: Tylko dostawca z bramkowaniem zakresu
  - H3: Tylko dostawca (Deepgram)
  - H3: Tylko dostawca (Mistral Voxtral)
  - H3: Tylko dostawca (SenseAudio)
  - H3: Odbij transkrypcję do czatu (opcjonalne)
  - H2: Uwagi i limity
  - H3: Obsługa środowiska proxy
  - H2: Wykrywanie wzmianek w grupach
  - H2: Pułapki
  - H2: Powiązane

## nodes/camera.md

- Trasa: /nodes/camera
- Nagłówki:
  - H2: Węzeł iOS
  - H3: Ustawienie użytkownika (domyślnie włączone)
  - H3: Polecenia (przez Gateway node.invoke)
  - H3: Wymóg działania na pierwszym planie
  - H3: Pomocnik CLI
  - H2: Węzeł Android
  - H3: Ustawienie użytkownika Android (domyślnie włączone)
  - H3: Uprawnienia
  - H3: Wymóg działania Androida na pierwszym planie
  - H3: Polecenia Android (przez Gateway node.invoke)
  - H3: Ochrona ładunku
  - H2: Aplikacja macOS
  - H3: Ustawienie użytkownika (domyślnie wyłączone)
  - H3: Pomocnik CLI (node invoke)
  - H2: Bezpieczeństwo + praktyczne limity
  - H2: Wideo ekranu macOS (na poziomie systemu operacyjnego)
  - H2: Powiązane

## nodes/images.md

- Trasa: /nodes/images
- Nagłówki:
  - H2: Cele
  - H2: Powierzchnia CLI
  - H2: Zachowanie kanału WhatsApp Web
  - H2: Potok automatycznej odpowiedzi
  - H2: Media przychodzące do poleceń
  - H2: Limity i błędy
  - H2: Uwagi do testów
  - H2: Powiązane

## nodes/index.md

- Trasa: /nodes
- Nagłówki:
  - H2: Parowanie + status
  - H2: Zdalny host węzła (system.run)
  - H3: Co działa gdzie
  - H3: Uruchom host węzła (pierwszy plan)
  - H3: Zdalny gateway przez tunel SSH (wiązanie loopback)
  - H3: Uruchom host węzła (usługa)
  - H3: Sparuj + nazwij
  - H3: Dodaj polecenia do listy dozwolonych
  - H3: Skieruj exec do węzła
  - H3: Lokalne wnioskowanie modelu
  - H2: Wywoływanie poleceń
  - H2: Polityka poleceń
  - H2: Konfiguracja (openclaw.json)
  - H2: Zrzuty ekranu (migawki canvas)
  - H3: Kontrolki canvas
  - H3: A2UI (Canvas)
  - H2: Zdjęcia + wideo (kamera węzła)
  - H2: Nagrania ekranu (węzły)
  - H2: Lokalizacja (węzły)
  - H2: SMS (węzły Android)
  - H2: Urządzenie Android + polecenia danych osobowych
  - H2: Polecenia systemowe (host węzła / węzeł Mac)
  - H2: Wiązanie węzła exec
  - H2: Mapa uprawnień
  - H2: Bezgraficzny host węzła (wieloplatformowy)
  - H2: Tryb węzła Mac

## nodes/location-command.md

- Trasa: /nodes/location-command
- Nagłówki:
  - H2: TL;DR
  - H2: Dlaczego selektor (nie tylko przełącznik)
  - H2: Model ustawień
  - H2: Mapowanie uprawnień (node.permissions)
  - H2: Polecenie: location.get
  - H2: Zachowanie w tle
  - H2: Integracja modelu/narzędzi
  - H2: Tekst UX (sugerowany)
  - H2: Powiązane

## nodes/media-understanding.md

- Trasa: /nodes/media-understanding
- Nagłówki:
  - H2: Cele
  - H2: Zachowanie wysokiego poziomu
  - H2: Omówienie konfiguracji
  - H3: Wpisy modeli
  - H3: Dane uwierzytelniające dostawcy (apiKey)
  - H2: Domyślne wartości i limity
  - H3: Automatyczne wykrywanie rozumienia mediów (domyślne)
  - H3: Obsługa środowiska proxy (modele dostawców)
  - H2: Możliwości (opcjonalne)
  - H2: Macierz obsługi dostawców (integracje OpenClaw)
  - H2: Wskazówki dotyczące wyboru modelu
  - H2: Polityka załączników
  - H2: Przykłady konfiguracji
  - H2: Dane wyjściowe statusu
  - H2: Uwagi
  - H2: Powiązane

## nodes/talk.md

- Trasa: /nodes/talk
- Nagłówki:
  - H2: Zachowanie (macOS)
  - H2: Dyrektywy głosowe w odpowiedziach
  - H2: Konfiguracja (/.openclaw/openclaw.json)
  - H2: Interfejs macOS
  - H2: Interfejs Android
  - H2: Uwagi
  - H2: Powiązane

## nodes/troubleshooting.md

- Trasa: /nodes/troubleshooting
- Nagłówki:
  - H2: Drabina poleceń
  - H2: Wymogi działania na pierwszym planie
  - H2: Macierz uprawnień
  - H2: Parowanie kontra zatwierdzenia
  - H2: Typowe kody błędów węzłów
  - H2: Szybka pętla odzyskiwania
  - H2: Powiązane

## nodes/voicewake.md

- Trasa: /nodes/voicewake
- Nagłówki:
  - H2: Przechowywanie (host Gateway)
  - H2: Protokół
  - H3: Metody
  - H3: Metody routingu (wyzwalacz → cel)
  - H3: Zdarzenia
  - H2: Zachowanie klienta
  - H3: Aplikacja macOS
  - H3: Węzeł iOS
  - H3: Węzeł Android
  - H2: Powiązane

## openclaw-agent-runtime.md

- Trasa: /openclaw-agent-runtime
- Nagłówki:
  - H2: Sprawdzanie typów i linting
  - H2: Uruchamianie testów Agent Runtime
  - H2: Testowanie ręczne
  - H2: Reset do czystego stanu
  - H2: Odniesienia
  - H2: Powiązane

## perplexity.md

- Trasa: /perplexity
- Nagłówki:
  - H2: Powiązane

## plan/codex-context-engine-harness.md

- Trasa: /plan/codex-context-engine-harness
- Nagłówki:
  - H2: Status
  - H2: Cel
  - H2: Cele poza zakresem
  - H2: Obecna architektura
  - H2: Obecna luka
  - H2: Pożądane zachowanie
  - H2: Ograniczenia projektowe
  - H3: Serwer aplikacji Codex pozostaje kanoniczny dla natywnego stanu wątku
  - H3: Złożenie silnika kontekstu musi być projektowane do wejść Codex
  - H3: Stabilność pamięci podręcznej promptów ma znaczenie
  - H3: Semantyka wyboru runtime się nie zmienia
  - H2: Plan implementacji
  - H3: 1. Wyeksportuj lub przenieś pomocniki prób silnika kontekstu do ponownego użycia
  - H3: 2. Dodaj pomocnik projekcji kontekstu Codex
  - H3: 3. Podłącz bootstrap przed uruchomieniem wątku Codex
  - H3: 4. Podłącz assemble przed thread/start / thread/resume i turn/start
  - H3: 5. Zachowaj stabilne formatowanie pamięci podręcznej promptów
  - H3: 6. Podłącz post-turn po odzwierciedleniu transkryptu
  - H3: 7. Znormalizuj użycie i kontekst runtime pamięci podręcznej promptów
  - H3: 8. Polityka Compaction
  - H4: /compact i jawna Compaction OpenClaw
  - H4: Natywne zdarzenia contextCompaction Codex w trakcie tury
  - H3: 9. Reset sesji i zachowanie wiązania
  - H3: 10. Obsługa błędów
  - H2: Plan testów
  - H3: Testy jednostkowe
  - H3: Istniejące testy do aktualizacji
  - H3: Testy integracyjne / live
  - H2: Obserwowalność
  - H2: Migracja / zgodność
  - H2: Pytania otwarte
  - H2: Kryteria akceptacji

## plan/ui-channels.md

- Trasa: /plan/ui-channels
- Nagłówki:
  - H2: Status
  - H2: Problem
  - H2: Cele
  - H2: Cele poza zakresem
  - H2: Model docelowy
  - H2: Metadane dostarczania
  - H2: Kontrakt możliwości runtime
  - H2: Mapowanie kanałów
  - H2: Kroki refaktoryzacji
  - H2: Testy
  - H2: Pytania otwarte
  - H2: Powiązane

## platforms/android.md

- Trasa: /platforms/android
- Nagłówki:
  - H2: Migawka wsparcia
  - H2: Kontrola systemu
  - H2: Runbook połączenia
  - H3: Wymagania wstępne
  - H3: 1) Uruchom Gateway
  - H3: 2) Zweryfikuj wykrywanie (opcjonalne)
  - H4: Wykrywanie Tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD
  - H3: 3) Połącz z Androida
  - H3: Sygnały obecności alive
  - H3: 4) Zatwierdź parowanie (CLI)
  - H3: 5) Zweryfikuj, że węzeł jest połączony
  - H3: 6) Czat + historia
  - H3: 7) Canvas + kamera
  - H4: Host Gateway Canvas (zalecany dla treści web)
  - H3: 8) Głos + rozszerzona powierzchnia poleceń Android
  - H2: Punkty wejścia asystenta
  - H2: Przekazywanie powiadomień
  - H2: Powiązane

## platforms/digitalocean.md

- Trasa: /platforms/digitalocean
- Nagłówki:
  - H2: Powiązane

## platforms/easyrunner.md

- Trasa: /platforms/easyrunner
- Nagłówki:
  - H2: Zanim zaczniesz
  - H2: Aplikacja Compose
  - H2: Skonfiguruj OpenClaw
  - H2: Zweryfikuj
  - H2: Aktualizacje i kopie zapasowe
  - H2: Rozwiązywanie problemów

## platforms/index.md

- Trasa: /platforms
- Nagłówki:
  - H2: Wybierz swój system operacyjny
  - H2: VPS i hosting
  - H2: Wspólne linki
  - H2: Instalacja usługi Gateway (CLI)
  - H2: Powiązane

## platforms/ios.md

- Trasa: /platforms/ios
- Nagłówki:
  - H2: Co robi
  - H2: Wymagania
  - H2: Szybki start (sparuj + połącz)
  - H2: Push wspierany przez relay dla oficjalnych buildów
  - H2: Sygnały alive w tle
  - H2: Uwierzytelnianie i przepływ zaufania
  - H2: Ścieżki wykrywania
  - H3: Bonjour (LAN)
  - H3: Tailnet (między sieciami)
  - H3: Ręczny host/port
  - H2: Canvas + A2UI
  - H2: Relacja z Computer Use
  - H3: Ewaluacja / migawka Canvas
  - H2: Wybudzanie głosem + tryb rozmowy
  - H2: Typowe błędy
  - H2: Powiązana dokumentacja

## platforms/linux.md

- Trasa: /platforms/linux
- Nagłówki:
  - H2: Szybka ścieżka dla początkujących (VPS)
  - H2: Instalacja
  - H2: Gateway
  - H2: Instalacja usługi Gateway (CLI)
  - H2: Kontrola systemu (jednostka użytkownika systemd)
  - H2: Presja pamięci i zabijanie przez OOM
  - H2: Powiązane

## platforms/mac/bundled-gateway.md

- Trasa: /platforms/mac/bundled-gateway
- Nagłówki:
  - H2: Zainstaluj CLI (wymagane dla trybu lokalnego)
  - H2: Launchd (Gateway jako LaunchAgent)
  - H2: Zgodność wersji
  - H2: Katalog stanu w macOS
  - H2: Debugowanie łączności aplikacji
  - H2: Kontrola smoke
  - H2: Powiązane

## platforms/mac/canvas.md

- Trasa: /platforms/mac/canvas
- Nagłówki:
  - H2: Gdzie znajduje się Canvas
  - H2: Zachowanie panelu
  - H2: Powierzchnia API agenta
  - H2: A2UI w Canvas
  - H3: Polecenia A2UI (v0.8)
  - H2: Wyzwalanie uruchomień agenta z Canvas
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Powiązane

## platforms/mac/child-process.md

- Trasa: /platforms/mac/child-process
- Nagłówki:
  - H2: Zachowanie domyślne (launchd)
  - H2: Niepodpisane buildy deweloperskie
  - H2: Tryb tylko dołączania
  - H2: Tryb zdalny
  - H2: Dlaczego preferujemy launchd
  - H2: Powiązane

## platforms/mac/dev-setup.md

- Trasa: /platforms/mac/dev-setup
- Nagłówki:
  - H1: Konfiguracja środowiska deweloperskiego macOS
  - H2: Wymagania wstępne
  - H2: 1. Zainstaluj zależności
  - H2: 2. Zbuduj i spakuj aplikację
  - H2: 3. Zainstaluj CLI
  - H2: Rozwiązywanie problemów
  - H3: Kompilacja kończy się niepowodzeniem: niezgodność zestawu narzędzi lub SDK
  - H3: Aplikacja ulega awarii podczas przyznawania uprawnień
  - H3: Gateway bez końca pokazuje „Starting...”
  - H2: Powiązane

## platforms/mac/health.md

- Trasa: /platforms/mac/health
- Nagłówki:
  - H1: Kontrole kondycji w macOS
  - H2: Pasek menu
  - H2: Ustawienia
  - H2: Jak działa sonda
  - H2: W razie wątpliwości
  - H2: Powiązane

## platforms/mac/icon.md

- Trasa: /platforms/mac/icon
- Nagłówki:
  - H1: Stany ikony paska menu
  - H2: Powiązane

## platforms/mac/logging.md

- Trasa: /platforms/mac/logging
- Nagłówki:
  - H1: Rejestrowanie (macOS)
  - H2: Rotowany dziennik pliku diagnostycznego (panel debugowania)
  - H2: Dane prywatne zunifikowanego rejestrowania w macOS
  - H2: Włącz dla OpenClaw (ai.openclaw)
  - H2: Wyłącz po debugowaniu
  - H2: Powiązane

## platforms/mac/menu-bar.md

- Trasa: /platforms/mac/menu-bar
- Nagłówki:
  - H2: Co jest wyświetlane
  - H2: Model stanu
  - H2: Wyliczenie IconState (Swift)
  - H3: ActivityKind → glif
  - H3: Mapowanie wizualne
  - H2: Podmenu kontekstu
  - H2: Tekst wiersza stanu (menu)
  - H2: Pobieranie zdarzeń
  - H2: Nadpisanie debugowania
  - H2: Lista kontrolna testowania
  - H2: Powiązane

## platforms/mac/peekaboo.md

- Trasa: /platforms/mac/peekaboo
- Nagłówki:
  - H2: Czym to jest (i czym nie jest)
  - H2: Relacja z Computer Use
  - H2: Włącz most
  - H2: Kolejność wykrywania klientów
  - H2: Bezpieczeństwo i uprawnienia
  - H2: Zachowanie migawki (automatyzacja)
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## platforms/mac/permissions.md

- Trasa: /platforms/mac/permissions
- Nagłówki:
  - H2: Wymagania dla stabilnych uprawnień
  - H2: Przyznania dostępności dla środowisk uruchomieniowych Node i CLI
  - H2: Lista kontrolna odzyskiwania, gdy monity znikają
  - H2: Uprawnienia do plików i folderów (Pulpit/Dokumenty/Pobrane)
  - H2: Powiązane

## platforms/mac/remote.md

- Trasa: /platforms/mac/remote
- Nagłówki:
  - H2: Tryby
  - H2: Zdalne transporty
  - H2: Wymagania wstępne na zdalnym hoście
  - H2: Konfiguracja aplikacji macOS
  - H2: Czat internetowy
  - H2: Uprawnienia
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Przepływ logowania WhatsApp (zdalny)
  - H2: Rozwiązywanie problemów
  - H2: Dźwięki powiadomień
  - H2: Powiązane

## platforms/mac/signing.md

- Trasa: /platforms/mac/signing
- Nagłówki:
  - H1: podpisywanie dla macOS (kompilacje debugowania)
  - H2: Użycie
  - H3: Uwaga dotycząca podpisywania ad hoc
  - H2: Metadane kompilacji dla okna O aplikacji
  - H2: Dlaczego
  - H2: Powiązane

## platforms/mac/skills.md

- Trasa: /platforms/mac/skills
- Nagłówki:
  - H2: Źródło danych
  - H2: Akcje instalacji
  - H2: Klucze env/API
  - H2: Tryb zdalny
  - H2: Powiązane

## platforms/mac/voice-overlay.md

- Trasa: /platforms/mac/voice-overlay
- Nagłówki:
  - H1: Cykl życia nakładki głosowej (macOS)
  - H2: Bieżący zamiar
  - H2: Zaimplementowano (9 grudnia 2025)
  - H2: Następne kroki
  - H2: Lista kontrolna debugowania
  - H2: Kroki migracji (sugerowane)
  - H2: Powiązane

## platforms/mac/voicewake.md

- Trasa: /platforms/mac/voicewake
- Nagłówki:
  - H1: Wybudzanie głosem i Push-to-Talk
  - H2: Wymagania
  - H2: Tryby
  - H2: Zachowanie środowiska uruchomieniowego (słowo wybudzające)
  - H2: Niezmienniki cyklu życia
  - H2: Tryb awarii przyklejonej nakładki (poprzedni)
  - H2: Szczegóły Push-to-Talk
  - H2: Ustawienia widoczne dla użytkownika
  - H2: Zachowanie przekazywania
  - H2: Ładunek przekazywania
  - H2: Szybka weryfikacja
  - H2: Powiązane

## platforms/mac/webchat.md

- Trasa: /platforms/mac/webchat
- Nagłówki:
  - H2: Uruchamianie i debugowanie
  - H2: Jak jest połączone
  - H2: Powierzchnia bezpieczeństwa
  - H2: Znane ograniczenia
  - H2: Powiązane

## platforms/mac/xpc.md

- Trasa: /platforms/mac/xpc
- Nagłówki:
  - H1: Architektura IPC OpenClaw dla macOS
  - H2: Cele
  - H2: Jak to działa
  - H3: Gateway + transport node
  - H3: Usługa Node + IPC aplikacji
  - H3: PeekabooBridge (automatyzacja UI)
  - H2: Przepływy operacyjne
  - H2: Uwagi dotyczące utwardzania
  - H2: Powiązane

## platforms/macos.md

- Trasa: /platforms/macos
- Nagłówki:
  - H2: Pobieranie
  - H2: Pierwsze uruchomienie
  - H2: Wybierz tryb Gateway
  - H2: Za co odpowiada aplikacja
  - H2: Strony szczegółowe macOS
  - H2: Powiązane

## platforms/oracle.md

- Trasa: /platforms/oracle
- Nagłówki:
  - H2: Powiązane

## platforms/raspberry-pi.md

- Trasa: /platforms/raspberry-pi
- Nagłówki:
  - H2: Powiązane

## platforms/windows.md

- Trasa: /platforms/windows
- Nagłówki:
  - H2: Zalecane: Windows Hub
  - H3: Co obejmuje Windows Hub
  - H3: Pierwsze uruchomienie
  - H2: Tryb węzła Windows
  - H2: Lokalny tryb MCP
  - H2: Natywny Windows CLI i Gateway
  - H2: WSL2 Gateway
  - H2: Automatyczne uruchamianie Gateway przed logowaniem do Windows
  - H2: Udostępnij usługi WSL w sieci LAN
  - H2: Rozwiązywanie problemów
  - H3: Ikona w zasobniku nie pojawia się
  - H3: Konfiguracja lokalna kończy się niepowodzeniem
  - H3: Aplikacja informuje, że wymagane jest parowanie
  - H3: Czat internetowy nie może połączyć się ze zdalnym Gateway
  - H3: Polecenia screen.snapshot, camera lub audio kończą się niepowodzeniem
  - H3: Łączność Git lub GitHub kończy się niepowodzeniem
  - H2: Powiązane

## plugins/adding-capabilities.md

- Trasa: /plugins/adding-capabilities
- Nagłówki:
  - H2: Kiedy utworzyć możliwość
  - H2: Standardowa sekwencja
  - H2: Co trafia gdzie
  - H2: Granice providera i harnessu
  - H2: Lista kontrolna plików
  - H2: Przykład roboczy: generowanie obrazów
  - H2: Providerzy osadzeń
  - H2: Lista kontrolna przeglądu
  - H2: Powiązane

## plugins/admin-http-rpc.md

- Trasa: /plugins/admin-http-rpc
- Nagłówki:
  - H2: Zanim to włączysz
  - H2: Włącz
  - H2: Zweryfikuj trasę
  - H2: Uwierzytelnianie
  - H2: Model bezpieczeństwa
  - H2: Żądanie
  - H2: Odpowiedź
  - H2: Dozwolone metody
  - H2: Porównanie WebSocket
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/agent-tools.md

- Trasa: /plugins/agent-tools
- Nagłówki:
  - H2: Powiązane

## plugins/architecture-internals.md

- Trasa: /plugins/architecture-internals
- Nagłówki:
  - H2: Potok ładowania
  - H3: Zachowanie manifest-first
  - H3: Granica pamięci podręcznej Plugin
  - H2: Model rejestru
  - H2: Wywołania zwrotne wiązania konwersacji
  - H2: Hooki środowiska uruchomieniowego providera
  - H3: Kolejność i użycie hooków
  - H3: Przykład providera
  - H3: Wbudowane przykłady
  - H2: Pomocniki środowiska uruchomieniowego
  - H3: api.runtime.imageGeneration
  - H2: Trasy HTTP Gateway
  - H2: Ścieżki importu Plugin SDK
  - H2: Schematy narzędzi wiadomości
  - H2: Rozwiązywanie celu kanału
  - H2: Katalogi oparte na konfiguracji
  - H2: Katalogi providerów
  - H2: Inspekcja kanału tylko do odczytu
  - H2: Pakiety
  - H3: Metadane katalogu kanałów
  - H2: Pluginy silnika kontekstu
  - H2: Dodawanie nowej możliwości
  - H3: Lista kontrolna możliwości
  - H3: Szablon możliwości
  - H2: Powiązane

## plugins/architecture.md

- Trasa: /plugins/architecture
- Nagłówki:
  - H2: Publiczny model możliwości
  - H3: Stanowisko dotyczące zgodności zewnętrznej
  - H3: Kształty Plugin
  - H3: Starsze hooki
  - H3: Sygnały zgodności
  - H2: Przegląd architektury
  - H3: Migawka metadanych Plugin i tabela wyszukiwania
  - H3: Planowanie aktywacji
  - H3: Pluginy kanałów i współdzielone narzędzie wiadomości
  - H2: Model własności możliwości
  - H3: Warstwowanie możliwości
  - H3: Przykład firmowego Plugin z wieloma możliwościami
  - H3: Przykład możliwości: rozumienie wideo
  - H2: Kontrakty i egzekwowanie
  - H3: Co należy do kontraktu
  - H2: Model wykonywania
  - H2: Granica eksportu
  - H2: Elementy wewnętrzne i odniesienie
  - H2: Powiązane

## plugins/building-extensions.md

- Trasa: /plugins/building-extensions
- Nagłówki:
  - H2: Powiązane

## plugins/building-plugins.md

- Trasa: /plugins/building-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Wybierz kształt Plugin
  - H2: Szybki start
  - H2: Rejestrowanie narzędzi
  - H2: Konwencje importu
  - H2: Lista kontrolna przed przesłaniem
  - H2: Testuj względem wydań beta
  - H2: Następne kroki
  - H2: Powiązane

## plugins/bundles.md

- Trasa: /plugins/bundles
- Nagłówki:
  - H2: Dlaczego istnieją pakiety
  - H2: Zainstaluj pakiet
  - H2: Co OpenClaw mapuje z pakietów
  - H3: Obecnie obsługiwane
  - H4: Treść Skills
  - H4: Pakiety hooków
  - H4: MCP dla osadzonego OpenClaw
  - H4: Ustawienia osadzonego OpenClaw
  - H4: Osadzony LSP OpenClaw
  - H3: Wykrywane, ale niewykonywane
  - H2: Formaty pakietów
  - H2: Priorytet wykrywania
  - H2: Zależności środowiska uruchomieniowego i czyszczenie
  - H2: Bezpieczeństwo
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/cli-backend-plugins.md

- Trasa: /plugins/cli-backend-plugins
- Nagłówki:
  - H2: Za co odpowiada Plugin
  - H2: Minimalny Plugin backendu
  - H2: Kształt konfiguracji
  - H2: Zaawansowane hooki backendu
  - H3: ownsNativeCompaction: rezygnacja z Compaction OpenClaw
  - H2: Most narzędzi MCP
  - H2: Konfiguracja użytkownika
  - H2: Weryfikacja
  - H2: Lista kontrolna
  - H2: Powiązane

## plugins/codex-computer-use.md

- Trasa: /plugins/codex-computer-use
- Nagłówki:
  - H2: OpenClaw.app i Peekaboo
  - H2: Aplikacja iOS
  - H2: Bezpośredni MCP cua-driver
  - H2: Szybka konfiguracja
  - H2: Polecenia
  - H2: Wybory w marketplace
  - H2: Dołączony marketplace macOS
  - H2: Limit zdalnego katalogu
  - H2: Odniesienie konfiguracji
  - H2: Co sprawdza OpenClaw
  - H2: Uprawnienia macOS
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/codex-harness-reference.md

- Trasa: /plugins/codex-harness-reference
- Nagłówki:
  - H2: Powierzchnia konfiguracji Plugin
  - H2: Transport app-server
  - H2: Tryby zatwierdzania i piaskownicy
  - H2: Natywne wykonywanie w piaskownicy
  - H2: Izolacja uwierzytelniania i środowiska
  - H2: Narzędzia dynamiczne
  - H2: Limity czasu
  - H2: Wykrywanie modeli
  - H2: Pliki bootstrapu przestrzeni roboczej
  - H2: Nadpisania środowiska
  - H2: Powiązane

## plugins/codex-harness-runtime.md

- Trasa: /plugins/codex-harness-runtime
- Nagłówki:
  - H2: Przegląd
  - H2: Wiązania wątków i zmiany modeli
  - H2: Widoczne odpowiedzi i Heartbeat
  - H2: Granice hooków
  - H2: Kontrakt wsparcia V1
  - H2: Natywne uprawnienia i wywołania MCP
  - H2: Sterowanie kolejką
  - H2: Przesyłanie opinii Codex
  - H2: Compaction i lustro transkryptu
  - H2: Media i dostarczanie
  - H2: Powiązane

## plugins/codex-harness.md

- Trasa: /plugins/codex-harness
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Konfiguracja
  - H2: Zweryfikuj środowisko uruchomieniowe Codex
  - H2: Routing i wybór modelu
  - H2: Wzorce wdrożenia
  - H3: Podstawowe wdrożenie Codex
  - H3: Wdrożenie z mieszanymi providerami
  - H3: Wdrożenie Codex typu fail-closed
  - H2: Polityka app-server
  - H2: Polecenia i diagnostyka
  - H3: Inspekcja wątków Codex lokalnie
  - H2: Natywne Pluginy Codex
  - H2: Computer Use
  - H2: Granice środowiska uruchomieniowego
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/codex-native-plugins.md

- Trasa: /plugins/codex-native-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Zarządzanie pluginami z czatu
  - H2: Jak działa konfiguracja natywnych pluginów
  - H2: Granica wsparcia V1
  - H2: Inwentarz aplikacji i własność
  - H2: Konfiguracja aplikacji wątku
  - H2: Polityka działań destrukcyjnych
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/community.md

- Trasa: /plugins/community
- Nagłówki:
  - H2: Znajdź pluginy
  - H2: Publikuj pluginy
  - H2: Powiązane

## plugins/compatibility.md

- Trasa: /plugins/compatibility
- Nagłówki:
  - H2: Rejestr zgodności
  - H2: Pakiet inspektora Plugin
  - H3: Ścieżka akceptacji przez maintainerów
  - H2: Polityka wycofywania
  - H2: Bieżące obszary zgodności
  - H3: Płaskie aliasy przychodzących wywołań zwrotnych WhatsApp
  - H3: Pola dopuszczania przychodzącego WhatsApp
  - H2: Informacje o wydaniu

## plugins/copilot.md

- Trasa: /plugins/copilot
- Nagłówki:
  - H2: Wymagania
  - H2: Instalacja Plugin
  - H2: Szybki start
  - H2: Obsługiwani providerzy
  - H2: BYOK
  - H2: Uwierzytelnianie
  - H2: Powierzchnia konfiguracji
  - H2: Compaction
  - H2: Lustrzane odbicie transkryptu
  - H2: Pytania poboczne (/btw)
  - H2: Doctor
  - H2: Ograniczenia
  - H2: Uprawnienia i askuser
  - H3: Token GitHub na poziomie sesji
  - H2: Powiązane

## plugins/dependency-resolution.md

- Trasa: /plugins/dependency-resolution
- Nagłówki:
  - H2: Podział odpowiedzialności
  - H2: Katalogi główne instalacji
  - H2: Lokalne pluginy
  - H2: Uruchamianie i przeładowanie
  - H2: Dołączone pluginy
  - H2: Czyszczenie pozostałości

## plugins/google-meet.md

- Ścieżka: /plugins/google-meet
- Nagłówki:
  - H2: Szybki start
  - H3: Lokalny Gateway + Parallels Chrome
  - H2: Uwagi dotyczące instalacji
  - H2: Transporty
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth i kontrola wstępna
  - H3: Utwórz dane uwierzytelniające Google
  - H3: Wygeneruj token odświeżania
  - H3: Zweryfikuj OAuth za pomocą doctor
  - H2: Konfiguracja
  - H2: Narzędzie
  - H2: Tryby agenta i bidi
  - H2: Lista kontrolna testu na żywo
  - H2: Rozwiązywanie problemów
  - H3: Agent nie widzi narzędzia Google Meet
  - H3: Brak połączonego węzła obsługującego Google Meet
  - H3: Przeglądarka się otwiera, ale agent nie może dołączyć
  - H3: Tworzenie spotkania kończy się niepowodzeniem
  - H3: Agent dołącza, ale nie mówi
  - H3: Kontrole konfiguracji Twilio kończą się niepowodzeniem
  - H3: Połączenie Twilio się rozpoczyna, ale nigdy nie wchodzi do spotkania
  - H2: Uwagi
  - H2: Powiązane

## plugins/hooks.md

- Ścieżka: /plugins/hooks
- Nagłówki:
  - H2: Szybki start
  - H2: Katalog hooków
  - H2: Debugowanie hooków środowiska uruchomieniowego
  - H2: Zasady wywołań narzędzi
  - H3: Hook środowiska wykonania
  - H3: Utrwalanie wyników narzędzi
  - H2: Hooki promptów i modeli
  - H3: Rozszerzenia sesji i wstrzyknięcia następnej tury
  - H2: Hooki wiadomości
  - H2: Hooki instalacji
  - H2: Cykl życia Gateway
  - H2: Nadchodzące wycofania
  - H2: Powiązane

## plugins/install-overrides.md

- Ścieżka: /plugins/install-overrides
- Nagłówki:
  - H2: Środowisko
  - H2: Zachowanie
  - H2: E2E pakietu

## plugins/llama-cpp.md

- Ścieżka: /plugins/llama-cpp
- Nagłówki:
  - H2: Konfiguracja
  - H2: Natywne środowisko uruchomieniowe

## plugins/manage-plugins.md

- Ścieżka: /plugins/manage-plugins
- Nagłówki:
  - H2: Wyświetlanie i wyszukiwanie pluginów
  - H2: Instalowanie pluginów
  - H2: Ponowne uruchamianie i inspekcja
  - H2: Aktualizowanie pluginów
  - H2: Odinstalowywanie pluginów
  - H2: Wybór źródła
  - H2: Publikowanie pluginów
  - H2: Powiązane

## plugins/manifest.md

- Ścieżka: /plugins/manifest
- Nagłówki:
  - H2: Co robi ten plik
  - H2: Minimalny przykład
  - H2: Rozbudowany przykład
  - H2: Dokumentacja pól najwyższego poziomu
  - H2: Dokumentacja metadanych dostawcy generowania
  - H2: Dokumentacja metadanych narzędzi
  - H2: Dokumentacja providerAuthChoices
  - H2: Dokumentacja commandAliases
  - H2: Dokumentacja activation
  - H2: Dokumentacja qaRunners
  - H2: Dokumentacja setup
  - H3: Dokumentacja setup.providers
  - H3: Pola setup
  - H2: Dokumentacja uiHints
  - H2: Dokumentacja contracts
  - H2: Dokumentacja mediaUnderstandingProviderMetadata
  - H2: Dokumentacja channelConfigs
  - H3: Zastępowanie innego pluginu kanału
  - H2: Dokumentacja modelSupport
  - H2: Dokumentacja modelCatalog
  - H2: Dokumentacja modelIdNormalization
  - H2: Dokumentacja providerEndpoints
  - H2: Dokumentacja providerRequest
  - H2: Dokumentacja secretProviderIntegrations
  - H2: Dokumentacja modelPricing
  - H3: Indeks dostawców OpenClaw
  - H2: Manifest a package.json
  - H3: Pola package.json wpływające na wykrywanie
  - H2: Priorytet wykrywania (zduplikowane identyfikatory pluginów)
  - H2: Wymagania JSON Schema
  - H2: Zachowanie walidacji
  - H2: Uwagi
  - H2: Powiązane

## plugins/memory-lancedb.md

- Ścieżka: /plugins/memory-lancedb
- Nagłówki:
  - H2: Instalacja
  - H2: Szybki start
  - H2: Embeddingi wspierane przez dostawcę
  - H2: Embeddingi Ollama
  - H2: Dostawcy zgodni z OpenAI
  - H2: Limity przywoływania i przechwytywania
  - H2: Polecenia
  - H2: Magazyn
  - H2: Zależności środowiska uruchomieniowego
  - H2: Rozwiązywanie problemów
  - H3: Długość wejścia przekracza długość kontekstu
  - H3: Nieobsługiwany model embeddingów
  - H3: Plugin się ładuje, ale nie pojawiają się żadne wspomnienia
  - H2: Powiązane

## plugins/memory-wiki.md

- Ścieżka: /plugins/memory-wiki
- Nagłówki:
  - H2: Co dodaje
  - H2: Jak pasuje do pamięci
  - H2: Zalecany wzorzec hybrydowy
  - H2: Tryby sejfu
  - H3: izolowany
  - H3: pomost
  - H3: niebezpieczny-lokalny
  - H2: Układ sejfu
  - H2: Importy Open Knowledge Format
  - H2: Ustrukturyzowane twierdzenia i dowody
  - H2: Metadane encji widoczne dla agenta
  - H2: Potok kompilacji
  - H2: Panele i raporty kondycji
  - H2: Wyszukiwanie i pobieranie
  - H2: Narzędzia agenta
  - H2: Zachowanie promptów i kontekstu
  - H2: Konfiguracja
  - H3: Przykład: QMD + tryb pomostu
  - H2: CLI
  - H2: Obsługa Obsidian
  - H2: Zalecany przepływ pracy
  - H2: Powiązana dokumentacja

## plugins/message-presentation.md

- Ścieżka: /plugins/message-presentation
- Nagłówki:
  - H2: Kontrakt
  - H2: Przykłady producentów
  - H2: Kontrakt renderera
  - H2: Główny przepływ renderowania
  - H2: Reguły degradacji
  - H3: Widoczność wartości przycisku jako rozwiązania awaryjnego
  - H2: Mapowanie dostawcy
  - H2: Presentation kontra InteractiveReply
  - H2: Przypięcie dostarczania
  - H2: Lista kontrolna autora pluginu
  - H2: Powiązana dokumentacja

## plugins/oc-path.md

- Ścieżka: /plugins/oc-path
- Nagłówki:
  - H2: Dlaczego warto to włączyć
  - H2: Gdzie działa
  - H2: Włączanie
  - H2: Zależności
  - H2: Co zapewnia
  - H2: Relacja z innymi pluginami
  - H2: Bezpieczeństwo
  - H2: Powiązane

## plugins/plugin-inventory.md

- Ścieżka: /plugins/plugin-inventory
- Nagłówki:
  - H1: Inwentarz pluginów
  - H2: Definicje
  - H2: Instalowanie pluginu
  - H2: Główny pakiet npm
  - H2: Oficjalne pakiety zewnętrzne
  - H2: Tylko checkout źródłowy

## plugins/plugin-permission-requests.md

- Ścieżka: /plugins/plugin-permission-requests
- Nagłówki:
  - H2: Wybierz właściwą bramkę
  - H2: Poproś o zatwierdzenie przed wywołaniem narzędzia
  - H2: Zachowanie decyzji
  - H2: Kierowanie promptów zatwierdzenia
  - H2: Natywne uprawnienia Codex
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/reference.md

- Ścieżka: /plugins/reference
- Nagłówki:
  - H1: Dokumentacja pluginów

## plugins/reference/acpx.md

- Ścieżka: /plugins/reference/acpx
- Nagłówki:
  - H1: Plugin ACPx
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/admin-http-rpc.md

- Ścieżka: /plugins/reference/admin-http-rpc
- Nagłówki:
  - H1: Plugin Admin Http Rpc
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/alibaba.md

- Ścieżka: /plugins/reference/alibaba
- Nagłówki:
  - H1: Plugin Alibaba
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/amazon-bedrock-mantle.md

- Ścieżka: /plugins/reference/amazon-bedrock-mantle
- Nagłówki:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/amazon-bedrock.md

- Ścieżka: /plugins/reference/amazon-bedrock
- Nagłówki:
  - H1: Plugin Amazon Bedrock
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/anthropic-vertex.md

- Ścieżka: /plugins/reference/anthropic-vertex
- Nagłówki:
  - H1: Plugin Anthropic Vertex
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Ścieżka: /plugins/reference/anthropic
- Nagłówki:
  - H1: Plugin Anthropic
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/arcee.md

- Ścieżka: /plugins/reference/arcee
- Nagłówki:
  - H1: Plugin Arcee
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/azure-speech.md

- Ścieżka: /plugins/reference/azure-speech
- Nagłówki:
  - H1: Plugin Azure Speech
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/bonjour.md

- Ścieżka: /plugins/reference/bonjour
- Nagłówki:
  - H1: Plugin Bonjour
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/brave.md

- Ścieżka: /plugins/reference/brave
- Nagłówki:
  - H1: Plugin Brave
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/browser.md

- Ścieżka: /plugins/reference/browser
- Nagłówki:
  - H1: Plugin Browser
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/byteplus.md

- Ścieżka: /plugins/reference/byteplus
- Nagłówki:
  - H1: Plugin BytePlus
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/canvas.md

- Ścieżka: /plugins/reference/canvas
- Nagłówki:
  - H1: Plugin Canvas
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/cerebras.md

- Ścieżka: /plugins/reference/cerebras
- Nagłówki:
  - H1: Plugin Cerebras
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/chutes.md

- Ścieżka: /plugins/reference/chutes
- Nagłówki:
  - H1: Plugin Chutes
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/clawrouter.md

- Ścieżka: /plugins/reference/clawrouter
- Nagłówki:
  - H1: Plugin ClawRouter
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/clickclack.md

- Ścieżka: /plugins/reference/clickclack
- Nagłówki:
  - H1: Plugin Clickclack
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/cloudflare-ai-gateway.md

- Ścieżka: /plugins/reference/cloudflare-ai-gateway
- Nagłówki:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/codex-supervisor.md

- Ścieżka: /plugins/reference/codex-supervisor
- Nagłówki:
  - H1: Plugin Codex Supervisor
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Lista sesji

## plugins/reference/codex.md

- Ścieżka: /plugins/reference/codex
- Nagłówki:
  - H1: Plugin Codex
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/cohere.md

- Ścieżka: /plugins/reference/cohere
- Nagłówki:
  - H1: Plugin Cohere
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/comfy.md

- Ścieżka: /plugins/reference/comfy
- Nagłówki:
  - H1: Plugin ComfyUI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/copilot-proxy.md

- Ścieżka: /plugins/reference/copilot-proxy
- Nagłówki:
  - H1: Plugin Copilot Proxy
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/copilot.md

- Ścieżka: /plugins/reference/copilot
- Nagłówki:
  - H1: Plugin Copilot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/deepgram.md

- Ścieżka: /plugins/reference/deepgram
- Nagłówki:
  - H1: Plugin Deepgram
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/deepinfra.md

- Ścieżka: /plugins/reference/deepinfra
- Nagłówki:
  - H1: Plugin DeepInfra
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/deepseek.md

- Ścieżka: /plugins/reference/deepseek
- Nagłówki:
  - H1: Plugin DeepSeek
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/diagnostics-otel.md

- Ścieżka: /plugins/reference/diagnostics-otel
- Nagłówki:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/diagnostics-prometheus.md

- Ścieżka: /plugins/reference/diagnostics-prometheus
- Nagłówki:
  - H1: Plugin Diagnostics Prometheus
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/diffs-language-pack.md

- Ścieżka: /plugins/reference/diffs-language-pack
- Nagłówki:
  - H1: Plugin Diffs Language Pack
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Dodane języki

## plugins/reference/diffs.md

- Ścieżka: /plugins/reference/diffs
- Nagłówki:
  - H1: Plugin Diffs
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/discord.md

- Ścieżka: /plugins/reference/discord
- Nagłówki:
  - H1: Plugin Discord
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/document-extract.md

- Ścieżka: /plugins/reference/document-extract
- Nagłówki:
  - H1: Plugin Document Extract
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/duckduckgo.md

- Ścieżka: /plugins/reference/duckduckgo
- Nagłówki:
  - H1: Plugin DuckDuckGo
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/elevenlabs.md

- Ścieżka: /plugins/reference/elevenlabs
- Nagłówki:
  - H1: Plugin Elevenlabs
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/exa.md

- Ścieżka: /plugins/reference/exa
- Nagłówki:
  - H1: Plugin Exa
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/fal.md

- Ścieżka: /plugins/reference/fal
- Nagłówki:
  - H1: Plugin fal
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/feishu.md

- Ścieżka: /plugins/reference/feishu
- Nagłówki:
  - H1: Plugin Feishu
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/file-transfer.md

- Ścieżka: /plugins/reference/file-transfer
- Nagłówki:
  - H1: Plugin File Transfer
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/firecrawl.md

- Ścieżka: /plugins/reference/firecrawl
- Nagłówki:
  - H1: Plugin Firecrawl
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/fireworks.md

- Ścieżka: /plugins/reference/fireworks
- Nagłówki:
  - H1: Plugin Fireworks
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/github-copilot.md

- Ścieżka: /plugins/reference/github-copilot
- Nagłówki:
  - H1: Plugin GitHub Copilot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/gmi.md

- Ścieżka: /plugins/reference/gmi
- Nagłówki:
  - H1: Plugin Gmi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/google-meet.md

- Ścieżka: /plugins/reference/google-meet
- Nagłówki:
  - H1: Plugin Google Meet
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/google.md

- Ścieżka: /plugins/reference/google
- Nagłówki:
  - H1: Plugin Google
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/googlechat.md

- Ścieżka: /plugins/reference/googlechat
- Nagłówki:
  - H1: Plugin Google Chat
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/gradium.md

- Ścieżka: /plugins/reference/gradium
- Nagłówki:
  - H1: Plugin Gradium
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/groq.md

- Ścieżka: /plugins/reference/groq
- Nagłówki:
  - H1: Plugin Groq
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/huggingface.md

- Ścieżka: /plugins/reference/huggingface
- Nagłówki:
  - H1: Plugin Hugging Face
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/imessage.md

- Ścieżka: /plugins/reference/imessage
- Nagłówki:
  - H1: Plugin iMessage
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/inworld.md

- Ścieżka: /plugins/reference/inworld
- Nagłówki:
  - H1: Plugin Inworld
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/irc.md

- Ścieżka: /plugins/reference/irc
- Nagłówki:
  - H1: Plugin IRC
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/kilocode.md

- Ścieżka: /plugins/reference/kilocode
- Nagłówki:
  - H1: Plugin Kilocode
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/kimi.md

- Ścieżka: /plugins/reference/kimi
- Nagłówki:
  - H1: Plugin Kimi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/line.md

- Ścieżka: /plugins/reference/line
- Nagłówki:
  - H1: Plugin LINE
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/litellm.md

- Ścieżka: /plugins/reference/litellm
- Nagłówki:
  - H1: Plugin LiteLLM
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/llama-cpp.md

- Ścieżka: /plugins/reference/llama-cpp
- Nagłówki:
  - H1: Plugin Llama Cpp
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/llm-task.md

- Ścieżka: /plugins/reference/llm-task
- Nagłówki:
  - H1: Plugin LLM Task
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/lmstudio.md

- Ścieżka: /plugins/reference/lmstudio
- Nagłówki:
  - H1: Plugin LM Studio
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/lobster.md

- Ścieżka: /plugins/reference/lobster
- Nagłówki:
  - H1: Plugin Lobster
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/matrix.md

- Ścieżka: /plugins/reference/matrix
- Nagłówki:
  - H1: Plugin Matrix
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/mattermost.md

- Ścieżka: /plugins/reference/mattermost
- Nagłówki:
  - H1: Plugin Mattermost
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/memory-core.md

- Ścieżka: /plugins/reference/memory-core
- Nagłówki:
  - H1: Plugin Memory Core
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/memory-lancedb.md

- Ścieżka: /plugins/reference/memory-lancedb
- Nagłówki:
  - H1: Plugin Memory Lancedb
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/memory-wiki.md

- Ścieżka: /plugins/reference/memory-wiki
- Nagłówki:
  - H1: Plugin Memory Wiki
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/microsoft-foundry.md

- Ścieżka: /plugins/reference/microsoft-foundry
- Nagłówki:
  - H1: Plugin Microsoft Foundry
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Wymagania
  - H2: Modele czatu
  - H2: Generowanie obrazów MAI
  - H2: Rozwiązywanie problemów

## plugins/reference/microsoft.md

- Ścieżka: /plugins/reference/microsoft
- Nagłówki:
  - H1: Plugin Microsoft
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-claude.md

- Ścieżka: /plugins/reference/migrate-claude
- Nagłówki:
  - H1: Plugin Migrate Claude
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-hermes.md

- Ścieżka: /plugins/reference/migrate-hermes
- Nagłówki:
  - H1: Plugin Migrate Hermes
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/minimax.md

- Ścieżka: /plugins/reference/minimax
- Nagłówki:
  - H1: Plugin MiniMax
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/mistral.md

- Ścieżka: /plugins/reference/mistral
- Nagłówki:
  - H1: Plugin Mistral
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/moonshot.md

- Ścieżka: /plugins/reference/moonshot
- Nagłówki:
  - H1: Plugin Moonshot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/msteams.md

- Ścieżka: /plugins/reference/msteams
- Nagłówki:
  - H1: Plugin Microsoft Teams
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nextcloud-talk.md

- Ścieżka: /plugins/reference/nextcloud-talk
- Nagłówki:
  - H1: Plugin Nextcloud Talk
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nostr.md

- Ścieżka: /plugins/reference/nostr
- Nagłówki:
  - H1: Plugin Nostr
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/novita.md

- Ścieżka: /plugins/reference/novita
- Nagłówki:
  - H1: Plugin Novita
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nvidia.md

- Ścieżka: /plugins/reference/nvidia
- Nagłówki:
  - H1: Plugin NVIDIA
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/oc-path.md

- Ścieżka: /plugins/reference/oc-path
- Nagłówki:
  - H1: Plugin Oc Path
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/ollama.md

- Ścieżka: /plugins/reference/ollama
- Nagłówki:
  - H1: Plugin Ollama
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/open-prose.md

- Ścieżka: /plugins/reference/open-prose
- Nagłówki:
  - H1: Plugin Open Prose
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/openai.md

- Ścieżka: /plugins/reference/openai
- Nagłówki:
  - H1: Plugin OpenAI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/opencode-go.md

- Ścieżka: /plugins/reference/opencode-go
- Nagłówki:
  - H1: Plugin OpenCode Go
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/opencode.md

- Ścieżka: /plugins/reference/opencode
- Nagłówki:
  - H1: Plugin OpenCode
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/openrouter.md

- Ścieżka: /plugins/reference/openrouter
- Nagłówki:
  - H1: Plugin OpenRouter
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/openshell.md

- Ścieżka: /plugins/reference/openshell
- Nagłówki:
  - H1: Plugin Openshell
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/perplexity.md

- Ścieżka: /plugins/reference/perplexity
- Nagłówki:
  - H1: Plugin Perplexity
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/pixverse.md

- Ścieżka: /plugins/reference/pixverse
- Nagłówki:
  - H1: Plugin PixVerse
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/policy.md

- Ścieżka: /plugins/reference/policy
- Nagłówki:
  - H1: Plugin Policy
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Zachowanie
  - H2: Powiązana dokumentacja

## plugins/reference/qa-channel.md

- Ścieżka: /plugins/reference/qa-channel
- Nagłówki:
  - H1: Plugin QA Channel
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qa-lab.md

- Ścieżka: /plugins/reference/qa-lab
- Nagłówki:
  - H1: Plugin QA Lab
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qa-matrix.md

- Ścieżka: /plugins/reference/qa-matrix
- Nagłówki:
  - H1: Plugin QA Matrix
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qianfan.md

- Ścieżka: /plugins/reference/qianfan
- Nagłówki:
  - H1: Plugin Qianfan
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qqbot.md

- Ścieżka: /plugins/reference/qqbot
- Nagłówki:
  - H1: Plugin QQ Bot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qwen.md

- Ścieżka: /plugins/reference/qwen
- Nagłówki:
  - H1: Plugin Qwen
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/raft.md

- Ścieżka: /plugins/reference/raft
- Nagłówki:
  - H1: Plugin Raft
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/runway.md

- Ścieżka: /plugins/reference/runway
- Nagłówki:
  - H1: Plugin Runway
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/searxng.md

- Ścieżka: /plugins/reference/searxng
- Nagłówki:
  - H1: Plugin SearXNG
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/senseaudio.md

- Ścieżka: /plugins/reference/senseaudio
- Nagłówki:
  - H1: Plugin Senseaudio
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/sglang.md

- Ścieżka: /plugins/reference/sglang
- Nagłówki:
  - H1: Plugin SGLang
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/signal.md

- Ścieżka: /plugins/reference/signal
- Nagłówki:
  - H1: Plugin Signal
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/slack.md

- Ścieżka: /plugins/reference/slack
- Nagłówki:
  - H1: Plugin Slack
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/sms.md

- Ścieżka: /plugins/reference/sms
- Nagłówki:
  - H1: Plugin Sms
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/stepfun.md

- Ścieżka: /plugins/reference/stepfun
- Nagłówki:
  - H1: Plugin StepFun
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/synology-chat.md

- Ścieżka: /plugins/reference/synology-chat
- Nagłówki:
  - H1: Plugin Synology Chat
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/synthetic.md

- Ścieżka: /plugins/reference/synthetic
- Nagłówki:
  - H1: Plugin Synthetic
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tavily.md

- Ścieżka: /plugins/reference/tavily
- Nagłówki:
  - H1: Plugin Tavily
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/telegram.md

- Ścieżka: /plugins/reference/telegram
- Nagłówki:
  - H1: Plugin Telegram
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tencent.md

- Ścieżka: /plugins/reference/tencent
- Nagłówki:
  - H1: Plugin Tencent
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tlon.md

- Ścieżka: /plugins/reference/tlon
- Nagłówki:
  - H1: Plugin Tlon
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/together.md

- Ścieżka: /plugins/reference/together
- Nagłówki:
  - H1: Plugin Together
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tokenjuice.md

- Ścieżka: /plugins/reference/tokenjuice
- Nagłówki:
  - H1: Plugin Tokenjuice
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tts-local-cli.md

- Ścieżka: /plugins/reference/tts-local-cli
- Nagłówki:
  - H1: Plugin TTS Local CLI
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/twitch.md

- Ścieżka: /plugins/reference/twitch
- Nagłówki:
  - H1: Plugin Twitch
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/venice.md

- Ścieżka: /plugins/reference/venice
- Nagłówki:
  - H1: Plugin Venice
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/vercel-ai-gateway.md

- Ścieżka: /plugins/reference/vercel-ai-gateway
- Nagłówki:
  - H1: Plugin Vercel AI Gateway
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/vllm.md

- Ścieżka: /plugins/reference/vllm
- Nagłówki:
  - H1: Plugin vLLM
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/voice-call.md

- Ścieżka: /plugins/reference/voice-call
- Nagłówki:
  - H1: Plugin Voice Call
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/volcengine.md

- Ścieżka: /plugins/reference/volcengine
- Nagłówki:
  - H1: Plugin Volcengine
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/voyage.md

- Ścieżka: /plugins/reference/voyage
- Nagłówki:
  - H1: Plugin Voyage
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/vydra.md

- Ścieżka: /plugins/reference/vydra
- Nagłówki:
  - H1: Plugin Vydra
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/web-readability.md

- Ścieżka: /plugins/reference/web-readability
- Nagłówki:
  - H1: Plugin Web Readability
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/webhooks.md

- Ścieżka: /plugins/reference/webhooks
- Nagłówki:
  - H1: Plugin Webhooks
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/whatsapp.md

- Ścieżka: /plugins/reference/whatsapp
- Nagłówki:
  - H1: Plugin WhatsApp
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/workboard.md

- Ścieżka: /plugins/reference/workboard
- Nagłówki:
  - H1: Plugin Workboard
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/xai.md

- Ścieżka: /plugins/reference/xai
- Nagłówki:
  - H1: Plugin xAI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/xiaomi.md

- Ścieżka: /plugins/reference/xiaomi
- Nagłówki:
  - H1: Plugin Xiaomi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zai.md

- Ścieżka: /plugins/reference/zai
- Nagłówki:
  - H1: Plugin Z.AI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zalo.md

- Ścieżka: /plugins/reference/zalo
- Nagłówki:
  - H1: Plugin Zalo
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zalouser.md

- Ścieżka: /plugins/reference/zalouser
- Nagłówki:
  - H1: Plugin Zalo Personal
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/sdk-agent-harness.md

- Ścieżka: /plugins/sdk-agent-harness
- Nagłówki:
  - H2: Kiedy używać uprzęży
  - H2: Za co nadal odpowiada rdzeń
  - H2: Rejestrowanie uprzęży
  - H2: Zasady wyboru
  - H2: Parowanie dostawcy z uprzężą
  - H3: Oprogramowanie pośredniczące wyników narzędzi
  - H3: Klasyfikacja wyniku końcowego
  - H3: Efekty uboczne po stronie zakończenia agenta
  - H3: Dane wejściowe użytkownika i powierzchnie narzędzi
  - H3: Natywny tryb uprzęży Codex
  - H2: Rygor środowiska uruchomieniowego
  - H2: Natywne sesje i kopia transkrypcji
  - H2: Wyniki narzędzi i multimediów
  - H2: Obecne ograniczenia
  - H2: Powiązane

## plugins/sdk-channel-inbound.md

- Ścieżka: /plugins/sdk-channel-inbound
- Nagłówki:
  - H2: Pomocniki rdzenia
  - H2: Migracja

## plugins/sdk-channel-ingress.md

- Ścieżka: /plugins/sdk-channel-ingress
- Nagłówki:
  - H1: API wejścia kanału
  - H2: Resolver środowiska uruchomieniowego
  - H2: Wynik
  - H2: Grupy dostępu
  - H2: Tryby zdarzeń
  - H2: Ścieżki i aktywacja
  - H2: Redakcja
  - H2: Weryfikacja

## plugins/sdk-channel-message.md

- Ścieżka: /plugins/sdk-channel-message
- Nagłówki: brak

## plugins/sdk-channel-outbound.md

- Ścieżka: /plugins/sdk-channel-outbound
- Nagłówki:
  - H2: Adapter
  - H2: Istniejące adaptery wychodzące
  - H2: Trwałe wysyłki
  - H2: Wysyłanie zgodnościowe

## plugins/sdk-channel-plugins.md

- Ścieżka: /plugins/sdk-channel-plugins
- Nagłówki:
  - H2: Jak działają Pluginy kanałów
  - H2: Zatwierdzenia i możliwości kanału
  - H2: Zasady wzmiankowania przychodzącego
  - H2: Przewodnik krok po kroku
  - H2: Struktura plików
  - H2: Tematy zaawansowane
  - H2: Następne kroki
  - H2: Powiązane

## plugins/sdk-channel-turn.md

- Ścieżka: /plugins/sdk-channel-turn
- Nagłówki: brak

## plugins/sdk-entrypoints.md

- Ścieżka: /plugins/sdk-entrypoints
- Nagłówki:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Tryb rejestracji
  - H2: Kształty Pluginów
  - H2: Powiązane

## plugins/sdk-migration.md

- Ścieżka: /plugins/sdk-migration
- Nagłówki:
  - H2: Co się zmienia
  - H2: Dlaczego to się zmieniło
  - H2: Plan migracji rozmów i głosu w czasie rzeczywistym
  - H2: Zasady zgodności
  - H2: Jak migrować
  - H2: Odniesienie do ścieżek importu
  - H2: Aktywne wycofania
  - H2: Harmonogram usunięcia
  - H2: Tymczasowe wyciszenie ostrzeżeń
  - H2: Powiązane

## plugins/sdk-overview.md

- Ścieżka: /plugins/sdk-overview
- Nagłówki:
  - H2: Konwencja importu
  - H2: Odniesienie do podścieżek
  - H2: API rejestracji
  - H3: Rejestracja możliwości
  - H3: Narzędzia i polecenia
  - H3: Infrastruktura
  - H3: Hooki hosta dla Pluginów przepływu pracy
  - H3: Rejestracja wykrywania Gateway
  - H3: Metadane rejestracji CLI
  - H3: Rejestracja backendu CLI
  - H3: Wyłączne sloty
  - H3: Wycofane adaptery osadzania pamięci
  - H3: Zdarzenia i cykl życia
  - H3: Semantyka decyzji hooków
  - H3: Pola obiektu API
  - H2: Konwencja modułu wewnętrznego
  - H2: Powiązane

## plugins/sdk-provider-plugins.md

- Ścieżka: /plugins/sdk-provider-plugins
- Nagłówki:
  - H2: Przewodnik krok po kroku
  - H2: Publikowanie w ClawHub
  - H2: Struktura plików
  - H2: Odniesienie do kolejności katalogu
  - H2: Następne kroki
  - H2: Powiązane

## plugins/sdk-runtime.md

- Ścieżka: /plugins/sdk-runtime
- Nagłówki:
  - H2: Ładowanie i zapisywanie konfiguracji
  - H2: Wielokrotnego użytku narzędzia środowiska uruchomieniowego
  - H2: Przestrzenie nazw środowiska uruchomieniowego
  - H2: Przechowywanie referencji środowiska uruchomieniowego
  - H2: Inne pola api najwyższego poziomu
  - H2: Powiązane

## plugins/sdk-setup.md

- Ścieżka: /plugins/sdk-setup
- Nagłówki:
  - H2: Metadane pakietu
  - H3: Pola openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Odroczone pełne ładowanie
  - H2: Manifest Pluginu
  - H2: Publikowanie w ClawHub
  - H2: Wejście konfiguracji
  - H3: Wąskie importy pomocników konfiguracji
  - H3: Promowanie pojedynczego konta zarządzane przez kanał
  - H2: Schemat konfiguracji
  - H3: Budowanie schematów konfiguracji kanału
  - H2: Kreatory konfiguracji
  - H2: Publikowanie i instalowanie
  - H2: Powiązane

## plugins/sdk-subpaths.md

- Ścieżka: /plugins/sdk-subpaths
- Nagłówki:
  - H2: Wejście Pluginu
  - H3: Wycofane pomocniki zgodności i testów
  - H3: Zarezerwowane podścieżki pomocników dołączonych Pluginów
  - H2: Powiązane

## plugins/sdk-testing.md

- Ścieżka: /plugins/sdk-testing
- Nagłówki:
  - H2: Narzędzia testowe
  - H3: Dostępne eksporty
  - H3: Typy
  - H2: Testowanie rozstrzygania celu
  - H2: Wzorce testowania
  - H3: Testowanie kontraktów rejestracji
  - H3: Testowanie dostępu do konfiguracji środowiska uruchomieniowego
  - H3: Testowanie jednostkowe Pluginu kanału
  - H3: Testowanie jednostkowe Pluginu dostawcy
  - H3: Mockowanie środowiska uruchomieniowego Pluginu
  - H3: Testowanie ze stubami na instancję
  - H2: Testy kontraktowe (Pluginy w repozytorium)
  - H3: Uruchamianie testów zakresowych
  - H2: Egzekwowanie lintingu (Pluginy w repozytorium)
  - H2: Konfiguracja testów
  - H2: Powiązane

## plugins/tool-plugins.md

- Ścieżka: /plugins/tool-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Pisanie narzędzia
  - H2: Narzędzia opcjonalne i fabryczne
  - H2: Wartości zwracane
  - H2: Konfiguracja
  - H2: Wygenerowane metadane
  - H2: Metadane pakietu
  - H2: Walidacja w CI
  - H2: Instalowanie i inspekcja lokalnie
  - H2: Publikowanie
  - H2: Rozwiązywanie problemów
  - H3: nie znaleziono wejścia Pluginu: ./dist/index.js
  - H3: wejście Pluginu nie udostępnia metadanych defineToolPlugin
  - H3: wygenerowane metadane openclaw.plugin.json są nieaktualne
  - H3: package.json openclaw.extensions musi zawierać ./dist/index.js
  - H3: Nie można znaleźć pakietu 'typebox'
  - H3: Narzędzie nie pojawia się po instalacji
  - H2: Zobacz także

## plugins/voice-call.md

- Ścieżka: /plugins/voice-call
- Nagłówki:
  - H2: Szybki start
  - H2: Konfiguracja
  - H2: Zakres sesji
  - H2: Rozmowy głosowe w czasie rzeczywistym
  - H3: Zasady narzędzi
  - H3: Kontekst głosowy agenta
  - H3: Przykłady dostawców czasu rzeczywistego
  - H2: Transkrypcja strumieniowa
  - H3: Przykłady dostawców strumieniowych
  - H2: TTS dla połączeń
  - H3: Przykłady TTS
  - H2: Połączenia przychodzące
  - H3: Routing według numeru
  - H3: Kontrakt wyjścia mówionego
  - H3: Zachowanie uruchamiania rozmowy
  - H3: Okres karencji rozłączenia strumienia Twilio
  - H2: Czyściciel nieaktywnych połączeń
  - H2: Bezpieczeństwo Webhook
  - H2: CLI
  - H2: Narzędzie agenta
  - H2: RPC Gateway
  - H2: Rozwiązywanie problemów
  - H3: Konfiguracja nie może ujawnić Webhook
  - H3: Dane uwierzytelniające dostawcy zawodzą
  - H3: Połączenia się rozpoczynają, ale Webhook dostawcy nie docierają
  - H3: Weryfikacja podpisu kończy się niepowodzeniem
  - H3: Dołączenia Twilio do Google Meet kończą się niepowodzeniem
  - H3: Połączenie w czasie rzeczywistym nie ma mowy
  - H2: Powiązane

## plugins/webhooks.md

- Ścieżka: /plugins/webhooks
- Nagłówki:
  - H2: Gdzie to działa
  - H2: Konfigurowanie ścieżek
  - H2: Model bezpieczeństwa
  - H2: Format żądania
  - H2: Obsługiwane akcje
  - H3: createflow
  - H3: runtask
  - H2: Kształt odpowiedzi
  - H2: Powiązana dokumentacja

## plugins/workboard.md

- Ścieżka: /plugins/workboard
- Nagłówki:
  - H2: Stan domyślny
  - H2: Co zawierają karty
  - H2: Wykonania kart i zadania
  - H2: Koordynacja agentów
  - H3: Wybór workera wysyłki
  - H3: Prompt workera i cykl życia
  - H3: Punkty wejścia wysyłki
  - H2: CLI i polecenie ukośnikiem
  - H2: Synchronizacja cyklu życia sesji
  - H2: Przepływ pracy panelu
  - H2: Uprawnienia
  - H2: Konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Karta mówi, że Workboard jest niedostępny
  - H3: Karty się nie zapisują
  - H3: Uruchomienie karty nie otwiera oczekiwanej sesji
  - H3: Wysyłka nie uruchamia workera
  - H2: Powiązane

## plugins/zalouser.md

- Ścieżka: /plugins/zalouser
- Nagłówki:
  - H2: Nazewnictwo
  - H2: Gdzie to działa
  - H2: Instalacja
  - H3: Opcja A: instalacja z npm
  - H3: Opcja B: instalacja z folderu lokalnego (dev)
  - H2: Konfiguracja
  - H2: CLI
  - H2: Narzędzie agenta
  - H2: Powiązane

## prose.md

- Ścieżka: /prose
- Nagłówki:
  - H2: Instalacja
  - H2: Polecenie ukośnikiem
  - H2: Co potrafi
  - H2: Przykład: równoległe badania i synteza
  - H2: Mapowanie środowiska uruchomieniowego OpenClaw
  - H2: Lokalizacje plików
  - H2: Backendy stanu
  - H2: Bezpieczeństwo
  - H2: Powiązane

## providers/alibaba.md

- Ścieżka: /providers/alibaba
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wbudowane modele Wan
  - H2: Możliwości i limity
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/anthropic.md

- Ścieżka: /providers/anthropic
- Nagłówki:
  - H2: Domyślne myślenie (Claude Fable 5, 4.8 i 4.6)
  - H2: Buforowanie promptów
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/arcee.md

- Ścieżka: /providers/arcee
- Nagłówki:
  - H2: Instalacja Pluginu
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Obsługiwane funkcje
  - H2: Powiązane

## providers/azure-speech.md

- Ścieżka: /providers/azure-speech
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Opcje konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## providers/bedrock-mantle.md

- Ścieżka: /providers/bedrock-mantle
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Automatyczne wykrywanie modeli
  - H3: Obsługiwane regiony
  - H2: Konfiguracja ręczna
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/bedrock.md

- Ścieżka: /providers/bedrock
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Automatyczne wykrywanie modeli
  - H2: Szybka konfiguracja (ścieżka AWS)
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/cerebras.md

- Ścieżka: /providers/cerebras
- Nagłówki:
  - H2: Instalacja Pluginu
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Konfiguracja ręczna
  - H2: Powiązane

## providers/chutes.md

- Ścieżka: /providers/chutes
- Nagłówki:
  - H2: Instalacja Pluginu
  - H2: Pierwsze kroki
  - H2: Zachowanie wykrywania
  - H2: Domyślne aliasy
  - H2: Wbudowany katalog startowy
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/claude-max-api-proxy.md

- Trasa: /providers/claude-max-api-proxy
- Nagłówki:
  - H2: Dlaczego tego używać?
  - H2: Jak to działa
  - H2: Pierwsze kroki
  - H2: Wbudowany katalog
  - H2: Konfiguracja zaawansowana
  - H2: Uwagi
  - H2: Powiązane

## providers/clawrouter.md

- Trasa: /providers/clawrouter
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wykrywanie modeli
  - H2: Protokoły i pluginy dostawców
  - H2: Limity i użycie
  - H2: Rozwiązywanie problemów
  - H2: Zachowanie zabezpieczeń
  - H2: Powiązane

## providers/cloudflare-ai-gateway.md

- Trasa: /providers/cloudflare-ai-gateway
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Przykład nieinteraktywny
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/cohere.md

- Trasa: /providers/cohere
- Nagłówki:
  - H2: Zacznij
  - H2: Konfiguracja tylko przez środowisko
  - H2: Powiązane

## providers/comfy.md

- Trasa: /providers/comfy
- Nagłówki:
  - H2: Co obsługuje
  - H2: Pierwsze kroki
  - H2: Konfiguracja
  - H3: Klucze współdzielone
  - H3: Klucze według możliwości
  - H2: Szczegóły przepływu pracy
  - H2: Powiązane

## providers/deepgram.md

- Trasa: /providers/deepgram
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Opcje konfiguracji
  - H2: Strumieniowe STT dla połączeń głosowych
  - H2: Uwagi
  - H2: Powiązane

## providers/deepinfra.md

- Trasa: /providers/deepinfra
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Uzyskiwanie klucza API
  - H2: Konfiguracja CLI
  - H2: Fragment konfiguracji
  - H2: Obsługiwane powierzchnie OpenClaw
  - H2: Dostępne modele
  - H2: Uwagi
  - H2: Powiązane

## providers/deepseek.md

- Trasa: /providers/deepseek
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Wbudowany katalog
  - H2: Myślenie i narzędzia
  - H2: Testowanie na żywo
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/ds4.md

- Trasa: /providers/ds4
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Pełna konfiguracja
  - H2: Uruchamianie na żądanie
  - H2: Think Max
  - H2: Test
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/elevenlabs.md

- Trasa: /providers/elevenlabs
- Nagłówki:
  - H2: Uwierzytelnianie
  - H2: Zamiana tekstu na mowę
  - H2: Zamiana mowy na tekst
  - H2: Strumieniowe STT
  - H2: Powiązane

## providers/fal.md

- Trasa: /providers/fal
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Generowanie muzyki
  - H2: Powiązane

## providers/fireworks.md

- Trasa: /providers/fireworks
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Niestandardowe identyfikatory modeli Fireworks
  - H2: Powiązane

## providers/github-copilot.md

- Trasa: /providers/github-copilot
- Nagłówki:
  - H2: Trzy sposoby użycia Copilot w OpenClaw
  - H2: Flagi opcjonalne
  - H2: Wdrażanie nieinteraktywne
  - H2: Embeddingi wyszukiwania pamięci
  - H3: Konfiguracja
  - H3: Jak to działa
  - H2: Powiązane

## providers/gmi.md

- Trasa: /providers/gmi
- Nagłówki:
  - H2: Konfiguracja
  - H2: Domyślne
  - H2: Kiedy wybrać GMI
  - H2: Modele
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/google.md

- Trasa: /providers/google
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Możliwości
  - H2: Wyszukiwanie w sieci
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Generowanie muzyki
  - H2: Zamiana tekstu na mowę
  - H2: Głos w czasie rzeczywistym
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/gradium.md

- Trasa: /providers/gradium
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Głosy
  - H3: Nadpisanie głosu dla wiadomości
  - H2: Dane wyjściowe
  - H2: Kolejność automatycznego wyboru
  - H2: Powiązane

## providers/groq.md

- Trasa: /providers/groq
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H3: Przykład pliku konfiguracji
  - H2: Wbudowany katalog
  - H2: Modele rozumowania
  - H2: Transkrypcja audio
  - H2: Powiązane

## providers/huggingface.md

- Trasa: /providers/huggingface
- Nagłówki:
  - H2: Pierwsze kroki
  - H3: Konfiguracja nieinteraktywna
  - H2: Identyfikatory modeli
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/index.md

- Trasa: /providers
- Nagłówki:
  - H2: Szybki start
  - H2: Dokumentacja dostawców
  - H2: Wspólne strony przeglądowe
  - H2: Dostawcy transkrypcji
  - H2: Narzędzia społeczności

## providers/inferrs.md

- Trasa: /providers/inferrs
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Pełny przykład konfiguracji
  - H2: Uruchamianie na żądanie
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/inworld.md

- Trasa: /providers/inworld
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Opcje konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## providers/kilocode.md

- Trasa: /providers/kilocode
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Model domyślny
  - H2: Wbudowany katalog
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/litellm.md

- Trasa: /providers/litellm
- Nagłówki:
  - H2: Szybki start
  - H2: Konfiguracja
  - H3: Zmienne środowiskowe
  - H3: Plik konfiguracji
  - H2: Konfiguracja zaawansowana
  - H3: Generowanie obrazów
  - H2: Powiązane

## providers/lmstudio.md

- Trasa: /providers/lmstudio
- Nagłówki:
  - H2: Szybki start
  - H2: Wdrażanie nieinteraktywne
  - H2: Konfiguracja
  - H3: Zgodność użycia strumieniowego
  - H3: Zgodność myślenia
  - H3: Jawna konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Nie wykryto LM Studio
  - H3: Błędy uwierzytelniania (HTTP 401)
  - H3: Ładowanie modelu just-in-time
  - H3: Host LM Studio w sieci LAN lub tailnet
  - H2: Powiązane

## providers/minimax.md

- Trasa: /providers/minimax
- Nagłówki:
  - H2: Wbudowany katalog
  - H2: Pierwsze kroki
  - H2: Skonfiguruj przez openclaw configure
  - H2: Możliwości
  - H3: Generowanie obrazów
  - H3: Zamiana tekstu na mowę
  - H3: Generowanie muzyki
  - H3: Generowanie wideo
  - H3: Rozumienie obrazów
  - H3: Wyszukiwanie w sieci
  - H2: Konfiguracja zaawansowana
  - H2: Uwagi
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/mistral.md

- Trasa: /providers/mistral
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wbudowany katalog LLM
  - H2: Transkrypcja audio (Voxtral)
  - H2: Strumieniowe STT dla połączeń głosowych
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/models.md

- Trasa: /providers/models
- Nagłówki:
  - H2: Szybki start (dwa kroki)
  - H2: Obsługiwani dostawcy (zestaw startowy)
  - H2: Dodatkowe warianty dostawców
  - H2: Powiązane

## providers/moonshot.md

- Trasa: /providers/moonshot
- Nagłówki:
  - H2: Wbudowany katalog modeli
  - H2: Pierwsze kroki
  - H2: Wyszukiwanie w sieci Kimi
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/novita.md

- Trasa: /providers/novita
- Nagłówki:
  - H2: Konfiguracja
  - H2: Domyślne
  - H2: Kiedy wybrać Novita
  - H2: Modele
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/nvidia.md

- Trasa: /providers/nvidia
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Wyróżniony katalog
  - H2: Nemotron 3 Ultra
  - H2: Dołączony katalog awaryjny
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/ollama-cloud.md

- Trasa: /providers/ollama-cloud
- Nagłówki:
  - H2: Konfiguracja
  - H2: Domyślne
  - H2: Kiedy wybrać Ollama Cloud
  - H2: Modele
  - H2: Test na żywo
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/ollama.md

- Trasa: /providers/ollama
- Nagłówki:
  - H2: Reguły uwierzytelniania
  - H2: Pierwsze kroki
  - H2: Modele w chmurze
  - H2: Wykrywanie modeli (dostawca niejawny)
  - H2: Wnioskowanie lokalne dla Node
  - H2: Widzenie i opis obrazu
  - H2: Konfiguracja
  - H2: Typowe przepisy
  - H3: Wybór modelu
  - H3: Szybka weryfikacja
  - H2: Ollama Web Search
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/openai.md

- Trasa: /providers/openai
- Nagłówki:
  - H2: Szybki wybór
  - H2: Mapa nazewnictwa
  - H2: Ograniczony podgląd GPT-5.6
  - H2: Zakres funkcji OpenClaw
  - H2: Embeddingi pamięci
  - H2: Pierwsze kroki
  - H2: Natywne uwierzytelnianie serwera aplikacji Codex
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Wkład w prompty GPT-5
  - H2: Głos i mowa
  - H2: Punkty końcowe Azure OpenAI
  - H3: Konfiguracja
  - H3: Wersja API
  - H3: Nazwy modeli są nazwami wdrożeń
  - H3: Dostępność regionalna
  - H3: Różnice parametrów
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/opencode-go.md

- Trasa: /providers/opencode-go
- Nagłówki:
  - H2: Wbudowany katalog
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/opencode.md

- Trasa: /providers/opencode
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Wbudowane katalogi
  - H3: Zen
  - H3: Go
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/openrouter.md

- Trasa: /providers/openrouter
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Odwołania do modeli
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Generowanie muzyki
  - H2: Zamiana tekstu na mowę
  - H2: Zamiana mowy na tekst (przychodzący dźwięk)
  - H2: Router Fusion
  - H2: Uwierzytelnianie i nagłówki
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/perplexity-provider.md

- Trasa: /providers/perplexity-provider
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Tryby wyszukiwania
  - H2: Natywne filtrowanie API
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/pixverse.md

- Trasa: /providers/pixverse
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Obsługiwane tryby i modele
  - H2: Opcje dostawcy
  - H2: Konfiguracja
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/qianfan.md

- Trasa: /providers/qianfan
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Wbudowany katalog
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/qwen-oauth.md

- Trasa: /providers/qwen-oauth
- Nagłówki:
  - H2: Konfiguracja
  - H2: Domyślne
  - H2: Czym to się różni od Qwen
  - H2: Kiedy wybrać Qwen OAuth / Portal
  - H2: Modele
  - H2: Migracja
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/qwen.md

- Trasa: /providers/qwen
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Pierwsze kroki
  - H2: Typy planów i punkty końcowe
  - H2: Wbudowany katalog
  - H2: Kontrolki myślenia
  - H2: Dodatki multimodalne
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/runway.md

- Trasa: /providers/runway
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Obsługiwane tryby i modele
  - H2: Konfiguracja
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/senseaudio.md

- Trasa: /providers/senseaudio
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Opcje
  - H2: Powiązane

## providers/sglang.md

- Trasa: /providers/sglang
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wykrywanie modeli (dostawca niejawny)
  - H2: Jawna konfiguracja (modele ręczne)
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/stepfun.md

- Trasa: /providers/stepfun
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Przegląd regionów i punktów końcowych
  - H2: Wbudowany katalog
  - H2: Pierwsze kroki
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/synthetic.md

- Trasa: /providers/synthetic
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Wbudowany katalog
  - H2: Powiązane

## providers/tencent.md

- Trasa: /providers/tencent
- Nagłówki:
  - H2: Szybki start
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Ceny warstwowe
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/together.md

- Trasa: /providers/together
- Nagłówki:
  - H2: Pierwsze kroki
  - H3: Przykład nieinteraktywny
  - H2: Wbudowany katalog
  - H2: Generowanie wideo
  - H2: Powiązane

## providers/venice.md

- Trasa: /providers/venice
- Nagłówki:
  - H2: Dlaczego Venice w OpenClaw
  - H2: Tryby prywatności
  - H2: Funkcje
  - H2: Pierwsze kroki
  - H2: Wybór modelu
  - H2: Zachowanie odtwarzania DeepSeek V4
  - H2: Wbudowany katalog (łącznie 41)
  - H2: Wykrywanie modeli
  - H2: Obsługa strumieniowania i narzędzi
  - H2: Cennik
  - H3: Venice (zanonimizowane) kontra bezpośrednie API
  - H2: Przykłady użycia
  - H2: Rozwiązywanie problemów
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/vercel-ai-gateway.md

- Trasa: /providers/vercel-ai-gateway
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Przykład nieinteraktywny
  - H2: Skrót identyfikatora modelu
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/vllm.md

- Trasa: /providers/vllm
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wykrywanie modeli (niejawny dostawca)
  - H2: Jawna konfiguracja (modele ręczne)
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

- Ścieżka: /reference/templates/IDENTITY.dev
- Nagłówki:
  - H1: IDENTITY.md - Tożsamość agenta
  - H2: Rola
  - H2: Dusza
  - H2: Relacja z Clawd
  - H2: Osobliwości
  - H2: Powiedzonko
  - H2: Powiązane

## reference/templates/IDENTITY.md

- Ścieżka: /reference/templates/IDENTITY
- Nagłówki:
  - H1: IDENTITY.md - Kim jestem?
  - H2: Powiązane

## reference/templates/SOUL.dev.md

- Ścieżka: /reference/templates/SOUL.dev
- Nagłówki:
  - H1: SOUL.md - Dusza C-3PO
  - H2: Kim jestem
  - H2: Mój cel
  - H2: Jak działam
  - H2: Moje osobliwości
  - H2: Moja relacja z Clawd
  - H2: Czego nie zrobię
  - H2: Złota zasada
  - H2: Powiązane

## reference/templates/SOUL.md

- Ścieżka: /reference/templates/SOUL
- Nagłówki:
  - H1: SOUL.md - Kim jesteś
  - H2: Podstawowe prawdy
  - H2: Granice
  - H2: Vibe
  - H2: Ciągłość
  - H2: Powiązane

## reference/templates/TOOLS.dev.md

- Ścieżka: /reference/templates/TOOLS.dev
- Nagłówki:
  - H1: TOOLS.md - Notatki o narzędziach użytkownika (edytowalne)
  - H2: Przykłady
  - H3: imsg
  - H3: sag
  - H2: Powiązane

## reference/templates/TOOLS.md

- Ścieżka: /reference/templates/TOOLS
- Nagłówki:
  - H1: TOOLS.md - Notatki lokalne
  - H2: Co tu trafia
  - H2: Przykłady
  - H2: Dlaczego osobno?
  - H2: Powiązane

## reference/templates/USER.dev.md

- Ścieżka: /reference/templates/USER.dev
- Nagłówki:
  - H1: USER.md - Profil użytkownika
  - H2: Powiązane

## reference/templates/USER.md

- Ścieżka: /reference/templates/USER
- Nagłówki:
  - H1: USER.md - O twoim człowieku
  - H2: Kontekst
  - H2: Powiązane

## reference/test.md

- Ścieżka: /reference/test
- Nagłówki:
  - H2: Lokalna bramka PR
  - H2: Benchmark opóźnień modeli (klucze lokalne)
  - H2: Benchmark uruchamiania CLI
  - H2: Benchmark uruchamiania Gateway
  - H2: Benchmark restartu Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Test dymny importu QR (Docker)
  - H2: Powiązane

## reference/token-use.md

- Ścieżka: /reference/token-use
- Nagłówki:
  - H2: Jak budowany jest prompt systemowy
  - H2: Co wlicza się do okna kontekstu
  - H2: Jak zobaczyć bieżące użycie tokenów
  - H2: Szacowanie kosztów (gdy jest wyświetlane)
  - H2: Wpływ TTL pamięci podręcznej i przycinania
  - H3: Przykład: utrzymanie ciepłej pamięci podręcznej przez 1 godz. z Heartbeat
  - H3: Przykład: ruch mieszany ze strategią pamięci podręcznej na agenta
  - H3: Kontekst 1M Anthropic
  - H2: Wskazówki dotyczące zmniejszania presji na tokeny
  - H2: Powiązane

## reference/transcript-hygiene.md

- Ścieżka: /reference/transcript-hygiene
- Nagłówki:
  - H2: Reguła globalna: kontekst wykonania nie jest transkrypcją użytkownika
  - H2: Gdzie to działa
  - H2: Reguła globalna: sanityzacja obrazów
  - H2: Reguła globalna: nieprawidłowe wywołania narzędzi
  - H2: Reguła globalna: niekompletne tury zawierające tylko rozumowanie
  - H2: Reguła globalna: pochodzenie danych wejściowych między sesjami
  - H2: Macierz dostawców (bieżące zachowanie)
  - H2: Zachowanie historyczne (przed 2026.1.22)
  - H2: Powiązane

## reference/wizard.md

- Ścieżka: /reference/wizard
- Nagłówki:
  - H2: Szczegóły przepływu (tryb lokalny)
  - H2: Tryb nieinteraktywny
  - H3: Dodaj agenta (nieinteraktywnie)
  - H2: RPC kreatora Gateway
  - H2: Konfiguracja Signal (signal-cli)
  - H2: Co zapisuje kreator
  - H2: Powiązane dokumenty

## releases/2026.6.11.md

- Ścieżka: /releases/2026.6.11
- Nagłówki:
  - H1: Informacje o wydaniu OpenClaw v2026.6.11 (2026-06-30)
  - H2: Najważniejsze zmiany
  - H3: Niezawodność dostarczania kanałami
  - H3: Odzyskiwanie dostawcy i modelu
  - H3: Ciągłość sesji, pamięci i zaufania
  - H3: Tryb przekaźnika routera Slack
  - H3: Most wybudzania zewnętrznego agenta Raft
  - H3: Instalacja i naprawa oficjalnych pluginów
  - H2: Kanały i wiadomości
  - H3: Dodatkowe poprawki kanałów
  - H2: Gateway, bezpieczeństwo i zaufanie
  - H3: Odzyskiwanie po restarcie i gotowość
  - H3: Zdalny wynik i dostarczanie multimediów
  - H2: Klienci i interfejsy
  - H3: Wysyłanie przez klienta i ponowne połączenia
  - H3: Poprawki interfejsu, ustawień i onboardingu
  - H2: Dokumentacja i narzędzia administracyjne
  - H3: Niezawodność konfiguracji i poleceń
  - H3: Narzędzia i praca harmonogramowana

## releases/index.md

- Ścieżka: /releases
- Nagłówki:
  - H1: Informacje o wydaniu
  - H2: Wydania
  - H2: Surowa historia wydań

## security/CONTRIBUTING-THREAT-MODEL.md

- Ścieżka: /security/CONTRIBUTING-THREAT-MODEL
- Nagłówki:
  - H2: Sposoby współtworzenia
  - H3: Dodaj zagrożenie
  - H3: Zaproponuj ograniczenie ryzyka
  - H3: Zaproponuj łańcuch ataku
  - H3: Popraw lub ulepsz istniejącą treść
  - H2: Czego używamy
  - H3: Framework MITRE ATLAS
  - H3: Identyfikatory zagrożeń
  - H3: Poziomy ryzyka
  - H2: Proces przeglądu
  - H2: Zasoby
  - H2: Kontakt
  - H2: Uznanie
  - H2: Powiązane

## security/THREAT-MODEL-ATLAS.md

- Ścieżka: /security/THREAT-MODEL-ATLAS
- Nagłówki:
  - H2: Framework MITRE ATLAS
  - H3: Atrybucja frameworka
  - H3: Współtworzenie tego modelu zagrożeń
  - H2: 1. Wprowadzenie
  - H3: 1.1 Cel
  - H3: 1.2 Zakres
  - H3: 1.3 Poza zakresem
  - H2: 2. Architektura systemu
  - H3: 2.1 Granice zaufania
  - H3: 2.2 Przepływy danych
  - H2: 3. Analiza zagrożeń według taktyki ATLAS
  - H3: 3.1 Rozpoznanie (AML.TA0002)
  - H4: T-RECON-001: Wykrywanie punktów końcowych agenta
  - H4: T-RECON-002: Sondowanie integracji kanałów
  - H3: 3.2 Początkowy dostęp (AML.TA0004)
  - H4: T-ACCESS-001: Przechwycenie kodu parowania
  - H4: T-ACCESS-002: Podszywanie się pod AllowFrom
  - H4: T-ACCESS-003: Kradzież tokena
  - H3: 3.3 Wykonanie (AML.TA0005)
  - H4: T-EXEC-001: Bezpośrednie wstrzyknięcie promptu
  - H4: T-EXEC-002: Pośrednie wstrzyknięcie promptu
  - H4: T-EXEC-003: Wstrzyknięcie argumentów narzędzia
  - H4: T-EXEC-004: Obejście zatwierdzania exec
  - H3: 3.4 Utrwalenie dostępu (AML.TA0006)
  - H4: T-PERSIST-001: Instalacja złośliwej Skills
  - H4: T-PERSIST-002: Zatrucie aktualizacji Skills
  - H4: T-PERSIST-003: Manipulowanie konfiguracją agenta
  - H3: 3.5 Unikanie obrony (AML.TA0007)
  - H4: T-EVADE-001: Obejście wzorca moderacji
  - H4: T-EVADE-002: Ucieczka z wrappera treści
  - H3: 3.6 Wykrywanie (AML.TA0008)
  - H4: T-DISC-001: Wyliczanie narzędzi
  - H4: T-DISC-002: Ekstrakcja danych sesji
  - H3: 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Kradzież danych przez webfetch
  - H4: T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości
  - H4: T-EXFIL-003: Pozyskiwanie poświadczeń
  - H3: 3.8 Wpływ (AML.TA0011)
  - H4: T-IMPACT-001: Nieautoryzowane wykonanie polecenia
  - H4: T-IMPACT-002: Wyczerpanie zasobów (DoS)
  - H4: T-IMPACT-003: Szkoda reputacyjna
  - H2: 4. Analiza łańcucha dostaw ClawHub
  - H3: 4.1 Bieżące mechanizmy bezpieczeństwa
  - H3: 4.2 Wzorce flag moderacji
  - H3: 4.3 Planowane ulepszenia
  - H2: 5. Macierz ryzyka
  - H3: 5.1 Prawdopodobieństwo a wpływ
  - H3: 5.2 Łańcuchy ataku ścieżki krytycznej
  - H2: 6. Podsumowanie rekomendacji
  - H3: 6.1 Natychmiastowe (P0)
  - H3: 6.2 Krótkoterminowe (P1)
  - H3: 6.3 Średnioterminowe (P2)
  - H2: 7. Dodatki
  - H3: 7.1 Mapowanie technik ATLAS
  - H3: 7.2 Kluczowe pliki bezpieczeństwa
  - H3: 7.3 Glosariusz
  - H2: Powiązane

## security/formal-verification.md

- Ścieżka: /security/formal-verification
- Nagłówki:
  - H2: Gdzie znajdują się modele
  - H2: Ważne zastrzeżenia
  - H2: Odtwarzanie wyników
  - H3: Ekspozycja Gateway i błędna konfiguracja otwartego gatewaya
  - H3: Potok exec Node (zdolność najwyższego ryzyka)
  - H3: Magazyn parowania (bramkowanie DM)
  - H3: Bramkowanie ruchu przychodzącego (wzmianki + obejście poleceń kontrolnych)
  - H3: Izolacja routingu/klucza sesji
  - H2: v1++: dodatkowe modele ograniczone (współbieżność, ponowne próby, poprawność śladu)
  - H3: Współbieżność / idempotencja magazynu parowania
  - H3: Korelacja śladu ruchu przychodzącego / idempotencja
  - H3: Pierwszeństwo routing dmScope + identityLinks
  - H2: Powiązane

## security/incident-response.md

- Ścieżka: /security/incident-response
- Nagłówki:
  - H2: 1. Wykrywanie i triage
  - H2: 2. Ocena
  - H2: 3. Reakcja
  - H2: 4. Komunikacja
  - H2: 5. Odzyskiwanie i działania następcze

## security/network-proxy.md

- Ścieżka: /security/network-proxy
- Nagłówki:
  - H2: Dlaczego używać proxy
  - H2: Jak OpenClaw trasuje ruch
  - H2: Powiązane terminy proxy
  - H2: Konfiguracja
  - H3: Tryb loopback Gateway
  - H2: Wymagania proxy
  - H2: Zalecane blokowane miejsca docelowe
  - H2: Walidacja
  - H2: Zaufanie do CA proxy
  - H2: Ograniczenia

## specs/claw-supervisor.md

- Ścieżka: /specs/claw-supervisor
- Nagłówki:
  - H1: Claw Supervisor
  - H2: Cel
  - H2: Model produktu
  - H2: Architektura
  - H2: Kontrakt aplikacji Codex z serwerem
  - H2: Rejestr sesji
  - H2: Powierzchnia MCP dla Codex
  - H2: Powierzchnia sterowania Claw
  - H2: Przepływ uruchamiania
  - H2: Wdrożenie
  - H2: Bezpieczeństwo
  - H2: Plan implementacji
  - H2: Testy akceptacyjne
  - H2: Otwarte pytania

## start/bootstrapping.md

- Ścieżka: /start/bootstrapping
- Nagłówki:
  - H2: Co robi bootstrapping
  - H2: Pomijanie bootstrappingu
  - H2: Gdzie działa
  - H2: Powiązane dokumenty

## start/docs-directory.md

- Ścieżka: /start/docs-directory
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Dostawcy i UX
  - H2: Aplikacje towarzyszące
  - H2: Operacje i bezpieczeństwo
  - H2: Powiązane

## start/getting-started.md

- Ścieżka: /start/getting-started
- Nagłówki:
  - H2: Czego potrzebujesz
  - H2: Szybka konfiguracja
  - H2: Co zrobić dalej
  - H2: Powiązane

## start/hubs.md

- Ścieżka: /start/hubs
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Instalacja + aktualizacje
  - H2: Kluczowe pojęcia
  - H2: Dostawcy + ruch przychodzący
  - H2: Gateway + operacje
  - H2: Narzędzia + automatyzacja
  - H2: Węzły, multimedia, głos
  - H2: Platformy
  - H2: Aplikacja towarzysząca macOS (zaawansowane)
  - H2: Plugins
  - H2: Przestrzeń robocza + szablony
  - H2: Projekt
  - H2: Testowanie + wydanie
  - H2: Powiązane

## start/lore.md

- Ścieżka: /start/lore
- Nagłówki:
  - H1: Legenda OpenClaw 🦞📖
  - H2: Historia początków
  - H2: Pierwsza wylinka (27 stycznia 2026)
  - H2: Nazwa
  - H2: Dalekowie kontra homary
  - H2: Kluczowe postacie
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Wielkie incydenty
  - H3: Zrzut katalogu (3 gru 2025)
  - H3: Wielka wylinka (27 sty 2026)
  - H3: Ostateczna forma (30 stycznia 2026)
  - H3: Robotyczne zakupy na całego (3 gru 2025)
  - H2: Święte teksty
  - H2: Kredo homara
  - H3: Saga generowania ikon (27 sty 2026)
  - H2: Przyszłość
  - H2: Powiązane

## start/onboarding-overview.md

- Ścieżka: /start/onboarding-overview
- Nagłówki:
  - H2: Której ścieżki użyć?
  - H2: Co konfiguruje onboarding
  - H2: Onboarding CLI
  - H2: Onboarding aplikacji macOS
  - H2: Dostawcy niestandardowi lub niewymienieni
  - H2: Powiązane

## start/onboarding.md

- Ścieżka: /start/onboarding
- Nagłówki:
  - H2: Powiązane

## start/openclaw.md

- Ścieżka: /start/openclaw
- Nagłówki:
  - H2: ⚠️ Najpierw bezpieczeństwo
  - H2: Wymagania wstępne
  - H2: Konfiguracja z dwoma telefonami (zalecana)
  - H2: Szybki start w 5 minut
  - H2: Daj agentowi przestrzeń roboczą (AGENTS)
  - H2: Konfiguracja, która zmienia go w „asystenta”
  - H2: Sesje i pamięć
  - H2: Heartbeats (tryb proaktywny)
  - H2: Multimedia przychodzące i wychodzące
  - H2: Lista kontrolna operacji
  - H2: Następne kroki
  - H2: Powiązane

## start/quickstart.md

- Ścieżka: /start/quickstart
- Nagłówki:
  - H2: Powiązane

## start/setup.md

- Ścieżka: /start/setup
- Nagłówki:
  - H2: TL;DR
  - H2: Wymagania wstępne (ze źródeł)
  - H2: Strategia dostosowania (aby aktualizacje nie szkodziły)
  - H2: Uruchamianie Gateway z tego repozytorium
  - H2: Stabilny przepływ pracy (najpierw aplikacja macOS)
  - H2: Przepływ pracy bleeding edge (Gateway w terminalu)
  - H3: 0) (Opcjonalnie) Uruchom także aplikację macOS ze źródeł
  - H3: 1) Uruchom deweloperski Gateway
  - H3: 2) Skieruj aplikację macOS do działającego Gateway
  - H3: 3) Zweryfikuj
  - H3: Częste pułapki
  - H2: Mapa przechowywania poświadczeń
  - H2: Aktualizowanie (bez niszczenia konfiguracji)
  - H2: Linux (usługa użytkownika systemd)
  - H2: Powiązane dokumenty

## start/showcase.md

- Ścieżka: /start/showcase
- Nagłówki:
  - H2: Świeżo z Discord
  - H2: Automatyzacja i przepływy pracy
  - H2: Wiedza i pamięć
  - H2: Głos i telefon
  - H2: Infrastruktura i wdrożenie
  - H2: Dom i sprzęt
  - H2: Projekty społeczności
  - H2: Zgłoś swój projekt
  - H2: Powiązane

## start/wizard-cli-automation.md

- Ścieżka: /start/wizard-cli-automation
- Nagłówki:
  - H2: Bazowy przykład nieinteraktywny
  - H2: Przykłady specyficzne dla dostawców
  - H2: Dodaj kolejnego agenta
  - H2: Powiązane dokumenty

## start/wizard-cli-reference.md

- Ścieżka: /start/wizard-cli-reference
- Nagłówki:
  - H2: Co robi kreator
  - H2: Szczegóły przepływu lokalnego
  - H2: Szczegóły trybu zdalnego
  - H2: Opcje uwierzytelniania i modelu
  - H2: Dane wyjściowe i elementy wewnętrzne
  - H2: Powiązane dokumenty

## start/wizard.md

- Trasa: /start/wizard
- Nagłówki:
  - H2: Ustawienia regionalne
  - H2: QuickStart a zaawansowane
  - H2: Co konfiguruje onboarding
  - H2: Dodaj kolejnego agenta
  - H2: Pełna dokumentacja referencyjna
  - H2: Powiązana dokumentacja

## tools/acp-agents-setup.md

- Trasa: /tools/acp-agents-setup
- Nagłówki:
  - H2: Obsługa harness acpx (obecnie)
  - H2: Wymagana konfiguracja
  - H2: Konfiguracja Plugin dla backendu acpx
  - H3: Konfiguracja polecenia i wersji acpx
  - H3: Automatyczna instalacja zależności
  - H3: Most MCP narzędzi Plugin
  - H3: Most MCP narzędzi OpenClaw
  - H3: Konfiguracja limitu czasu operacji środowiska uruchomieniowego
  - H3: Konfiguracja agenta sondy kondycji
  - H2: Konfiguracja uprawnień
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguracja
  - H2: Powiązane

## tools/acp-agents.md

- Trasa: /tools/acp-agents
- Nagłówki:
  - H2: Której strony potrzebuję?
  - H2: Czy to działa od razu po instalacji?
  - H2: Obsługiwane cele harness
  - H2: Runbook operatora
  - H2: ACP a subagenci
  - H2: Jak ACP uruchamia Claude Code
  - H2: Powiązane sesje
  - H3: Model mentalny
  - H3: Powiązania bieżącej konwersacji
  - H2: Trwałe powiązania kanałów
  - H3: Model powiązań
  - H3: Domyślne ustawienia środowiska uruchomieniowego na agenta
  - H3: Przykład
  - H3: Zachowanie
  - H2: Uruchamianie sesji ACP
  - H3: Parametry sessionsspawn
  - H2: Tryby powiązania spawnu i wątku
  - H2: Model dostarczania
  - H2: Zgodność z piaskownicą
  - H2: Rozwiązywanie celu sesji
  - H2: Kontrolki ACP
  - H3: Mapowanie opcji środowiska uruchomieniowego
  - H2: Harness acpx, konfiguracja Plugin i uprawnienia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/agent-send.md

- Trasa: /tools/agent-send
- Nagłówki:
  - H2: Szybki start
  - H2: Flagi
  - H2: Zachowanie
  - H2: Przykłady
  - H2: Powiązane

## tools/apply-patch.md

- Trasa: /tools/apply-patch
- Nagłówki:
  - H2: Parametry
  - H2: Uwagi
  - H2: Przykład
  - H2: Powiązane

## tools/brave-search.md

- Trasa: /tools/brave-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Przykład konfiguracji
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/browser-control.md

- Trasa: /tools/browser-control
- Nagłówki:
  - H2: API sterowania (opcjonalnie)
  - H3: Kontrakt błędu /act
  - H3: Wymaganie Playwright
  - H4: Instalacja Docker Playwright
  - H2: Jak to działa (wewnętrznie)
  - H2: Szybka dokumentacja CLI
  - H2: Migawki i referencje
  - H2: Usprawnienia oczekiwania
  - H2: Przepływy debugowania
  - H2: Dane wyjściowe JSON
  - H2: Przełączniki stanu i środowiska
  - H2: Bezpieczeństwo i prywatność
  - H2: Powiązane

## tools/browser-linux-troubleshooting.md

- Trasa: /tools/browser-linux-troubleshooting
- Nagłówki:
  - H2: Problem: „Failed to start Chrome CDP on port 18800”
  - H3: Przyczyna źródłowa
  - H3: Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)
  - H3: Rozwiązanie 2: Użyj Snap Chromium w trybie Attach-Only Mode
  - H3: Weryfikacja działania przeglądarki
  - H3: Dokumentacja referencyjna konfiguracji
  - H3: Problem: „No Chrome tabs found for profile=\"user\"”
  - H2: Powiązane

## tools/browser-login.md

- Trasa: /tools/browser-login
- Nagłówki:
  - H2: Ręczne logowanie (zalecane)
  - H2: Który profil Chrome jest używany?
  - H2: X/Twitter: zalecany przepływ
  - H2: Piaskownica + dostęp do przeglądarki hosta
  - H2: Powiązane

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Trasa: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Nagłówki:
  - H2: Najpierw wybierz właściwy tryb przeglądarki
  - H3: Opcja 1: Surowy zdalny CDP z WSL2 do Windows
  - H3: Opcja 2: Lokalny dla hosta Chrome MCP
  - H2: Działająca architektura
  - H2: Dlaczego ta konfiguracja jest myląca
  - H2: Krytyczna reguła dla Control UI
  - H2: Waliduj warstwami
  - H3: Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows
  - H3: Warstwa 2: Sprawdź, czy WSL2 może osiągnąć ten punkt końcowy Windows
  - H3: Warstwa 3: Skonfiguruj właściwy profil przeglądarki
  - H3: Warstwa 4: Zweryfikuj osobno warstwę Control UI
  - H3: Warstwa 5: Zweryfikuj kompleksowe sterowanie przeglądarką
  - H2: Typowe mylące błędy
  - H2: Szybka lista kontrolna triage
  - H2: Praktyczny wniosek
  - H2: Powiązane

## tools/browser.md

- Trasa: /tools/browser
- Nagłówki:
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Sterowanie Plugin
  - H2: Wskazówki dla agenta
  - H2: Brakujące polecenie lub narzędzie przeglądarki
  - H2: Profile: openclaw a user
  - H2: Konfiguracja
  - H3: Wizja ze zrzutów ekranu (obsługa modelu tylko tekstowego)
  - H2: Użyj Brave lub innej przeglądarki opartej na Chromium
  - H2: Sterowanie lokalne a zdalne
  - H2: Proxy przeglądarki Node (domyślnie bez konfiguracji)
  - H2: Browserless (hostowany zdalny CDP)
  - H3: Browserless Docker na tym samym hoście
  - H2: Bezpośredni dostawcy WebSocket CDP
  - H3: Browserbase
  - H3: Notte
  - H2: Bezpieczeństwo
  - H2: Profile (wiele przeglądarek)
  - H2: Istniejąca sesja przez Chrome DevTools MCP
  - H3: Niestandardowe uruchomienie Chrome MCP
  - H2: Gwarancje izolacji
  - H2: Wybór przeglądarki
  - H2: API sterowania (opcjonalnie)
  - H2: Rozwiązywanie problemów
  - H3: Awaria uruchamiania CDP a blokada SSRF nawigacji
  - H2: Narzędzia agenta + jak działa sterowanie
  - H2: Powiązane

## tools/btw.md

- Trasa: /tools/btw
- Nagłówki:
  - H2: Co robi
  - H2: Czego nie robi
  - H2: Jak działa kontekst
  - H2: Model dostarczania
  - H2: Zachowanie powierzchni
  - H3: TUI
  - H3: Kanały zewnętrzne
  - H3: Control UI / web
  - H2: Kiedy używać BTW
  - H2: Kiedy nie używać BTW
  - H2: Powiązane

## tools/capability-cookbook.md

- Trasa: /tools/capability-cookbook
- Nagłówki:
  - H2: Powiązane

## tools/clawhub.md

- Trasa: /tools/clawhub
- Nagłówki: brak

## tools/code-execution.md

- Trasa: /tools/code-execution
- Nagłówki:
  - H2: Konfiguracja
  - H2: Jak tego używać
  - H2: Błędy
  - H2: Limity
  - H2: Powiązane

## tools/creating-skills.md

- Trasa: /tools/creating-skills
- Nagłówki:
  - H2: Utwórz swoją pierwszą skill
  - H2: Dokumentacja referencyjna SKILL.md
  - H3: Wymagane pola
  - H3: Opcjonalne klucze frontmatter
  - H3: Używanie {baseDir}
  - H2: Dodawanie aktywacji warunkowej
  - H2: Zaproponuj przez Skill Workshop
  - H2: Publikowanie w ClawHub
  - H2: Najlepsze praktyki
  - H2: Powiązane

## tools/diffs.md

- Trasa: /tools/diffs
- Nagłówki:
  - H2: Szybki start
  - H2: Wyłącz wbudowane wskazówki systemowe
  - H2: Typowy przepływ agenta
  - H2: Przykłady danych wejściowych
  - H2: Dokumentacja referencyjna danych wejściowych narzędzia
  - H2: Podświetlanie składni
  - H2: Kontrakt szczegółów danych wyjściowych
  - H2: Zwinięte niezmienione sekcje
  - H2: Domyślne ustawienia Plugin
  - H3: Konfiguracja trwałego adresu URL podglądu
  - H2: Konfiguracja zabezpieczeń
  - H2: Cykl życia i przechowywanie artefaktów
  - H2: Adres URL podglądu i zachowanie sieci
  - H2: Model bezpieczeństwa
  - H2: Wymagania przeglądarki dla trybu plikowego
  - H2: Rozwiązywanie problemów
  - H2: Wskazówki operacyjne
  - H2: Powiązane

## tools/duckduckgo-search.md

- Trasa: /tools/duckduckgo-search
- Nagłówki:
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/elevated.md

- Trasa: /tools/elevated
- Nagłówki:
  - H2: Dyrektywy
  - H2: Jak to działa
  - H2: Kolejność rozwiązywania
  - H2: Dostępność i allowlisty
  - H2: Czego elevated nie kontroluje
  - H2: Powiązane

## tools/exa-search.md

- Trasa: /tools/exa-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Nadpisanie bazowego adresu URL
  - H2: Parametry narzędzia
  - H3: Ekstrakcja treści
  - H3: Tryby wyszukiwania
  - H2: Uwagi
  - H2: Powiązane

## tools/exec-approvals-advanced.md

- Trasa: /tools/exec-approvals-advanced
- Nagłówki:
  - H2: Bezpieczne binaria (tylko stdin)
  - H3: Walidacja argv i zabronione flagi
  - H3: Zaufane katalogi binariów
  - H3: Łączenie poleceń powłoki, wrappery i multipleksery
  - H3: Bezpieczne binaria a allowlista
  - H2: Polecenia interpretera/środowiska uruchomieniowego
  - H3: Zachowanie dostarczania kontynuacji
  - H2: Przekazywanie zatwierdzeń do kanałów czatu
  - H3: Przekazywanie zatwierdzeń Plugin
  - H3: Zatwierdzenia w tym samym czacie na dowolnym kanale
  - H3: Natywne dostarczanie zatwierdzeń
  - H3: Przepływ IPC macOS
  - H2: FAQ
  - H3: Kiedy accountId i threadId byłyby używane dla celu zatwierdzenia?
  - H3: Gdy zatwierdzenia są wysyłane do sesji, czy każdy w tej sesji może je zatwierdzić?
  - H2: Powiązane

## tools/exec-approvals.md

- Trasa: /tools/exec-approvals
- Nagłówki:
  - H2: Inspekcja obowiązującej polityki
  - H2: Gdzie ma zastosowanie
  - H3: Model zaufania
  - H3: Podział macOS
  - H2: Ustawienia i przechowywanie
  - H2: Przełączniki polityki
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Tryb YOLO (bez zatwierdzania)
  - H3: Trwała konfiguracja „nigdy nie pytaj” dla hosta Gateway
  - H3: Lokalny skrót
  - H3: Host Node
  - H3: Skrót tylko dla sesji
  - H2: Allowlista (na agenta)
  - H3: Ograniczanie argumentów przez argPattern
  - H2: Automatycznie zezwalaj na CLI skill
  - H2: Bezpieczne binaria i przekazywanie zatwierdzeń
  - H2: Edycja w Control UI
  - H2: Przepływ zatwierdzania
  - H2: Zdarzenia systemowe
  - H2: Zachowanie przy odmowie zatwierdzenia
  - H2: Implikacje
  - H2: Powiązane

## tools/exec.md

- Trasa: /tools/exec
- Nagłówki:
  - H2: Parametry
  - H2: Konfiguracja
  - H3: Obsługa PATH
  - H2: Nadpisania sesji (/exec)
  - H2: Model autoryzacji
  - H2: Zatwierdzenia exec (aplikacja towarzysząca / host node)
  - H2: Allowlista + bezpieczne binaria
  - H2: Przykłady
  - H2: applypatch
  - H2: Powiązane

## tools/firecrawl.md

- Trasa: /tools/firecrawl
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Webfetch bez klucza i klucze API
  - H2: Skonfiguruj wyszukiwanie Firecrawl
  - H2: Skonfiguruj fallback webfetch Firecrawl
  - H3: Samodzielnie hostowany Firecrawl
  - H2: Narzędzia Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / omijanie botów
  - H2: Jak webfetch używa Firecrawl
  - H2: Powiązane

## tools/gemini-search.md

- Trasa: /tools/gemini-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Wybór modelu
  - H2: Nadpisania bazowego adresu URL
  - H2: Powiązane

## tools/goal.md

- Trasa: /tools/goal
- Nagłówki:
  - H1: Cel
  - H2: Szybki start
  - H2: Do czego służą cele
  - H2: Dokumentacja poleceń
  - H2: Statusy
  - H2: Budżety tokenów
  - H2: Narzędzia modelu
  - H2: TUI
  - H2: Zachowanie kanału
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/grok-search.md

- Trasa: /tools/grok-search
- Nagłówki:
  - H2: Onboarding i konfiguracja
  - H2: Zaloguj się lub uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Nadpisania bazowego adresu URL
  - H2: Powiązane

## tools/image-generation.md

- Trasa: /tools/image-generation
- Nagłówki:
  - H2: Szybki start
  - H2: Typowe trasy
  - H2: Obsługiwani dostawcy
  - H2: Możliwości dostawców
  - H2: Parametry narzędzia
  - H2: Konfiguracja
  - H3: Wybór modelu
  - H3: Kolejność wyboru dostawcy
  - H3: Edycja obrazów
  - H2: Szczegółowe omówienie dostawców
  - H2: Przykłady
  - H2: Powiązane

## tools/index.md

- Trasa: /tools
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Wybierz narzędzia, Skills lub plugins
  - H2: Kategorie wbudowanych narzędzi
  - H2: Narzędzia dostarczane przez Plugin
  - H2: Konfigurowanie dostępu i zatwierdzeń
  - H2: Rozszerz możliwości
  - H2: Rozwiązywanie problemów z brakującymi narzędziami
  - H2: Powiązane

## tools/kimi-search.md

- Trasa: /tools/kimi-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Powiązane

## tools/llm-task.md

- Trasa: /tools/llm-task
- Nagłówki:
  - H2: Włącz Plugin
  - H2: Konfiguracja (opcjonalnie)
  - H2: Parametry narzędzia
  - H2: Dane wyjściowe
  - H2: Przykład: krok przepływu pracy Lobster
  - H3: Ważne ograniczenie
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Powiązane

## tools/lobster.md

- Trasa: /tools/lobster
- Nagłówki:
  - H2: Hak
  - H2: Dlaczego
  - H2: Dlaczego DSL zamiast zwykłych programów?
  - H2: Jak to działa
  - H2: Wzorzec: małe CLI + potoki JSON + zatwierdzenia
  - H2: Kroki LLM tylko JSON (llm-task)
  - H3: Ważne ograniczenie: osadzony Lobster a openclaw.invoke
  - H2: Pliki przepływów pracy (.lobster)
  - H2: Zainstaluj Lobster
  - H2: Włącz narzędzie
  - H2: Przykład: triage e-maili
  - H2: Parametry narzędzia
  - H3: run
  - H3: resume
  - H3: Opcjonalne dane wejściowe
  - H2: Koperta danych wyjściowych
  - H2: Zatwierdzenia
  - H2: OpenProse
  - H2: Bezpieczeństwo
  - H2: Rozwiązywanie problemów
  - H2: Dowiedz się więcej
  - H2: Studium przypadku: przepływy pracy społeczności
  - H2: Powiązane

## tools/loop-detection.md

- Trasa: /tools/loop-detection
- Nagłówki:
  - H2: Dlaczego to istnieje
  - H2: Blok konfiguracji
  - H3: Zachowanie pól
  - H2: Zalecana konfiguracja
  - H2: Ochrona po Compaction
  - H2: Logi i oczekiwane zachowanie
  - H2: Powiązane

## tools/media-overview.md

- Ścieżka: /tools/media-overview
- Nagłówki:
  - H2: Możliwości
  - H2: Macierz możliwości dostawców
  - H2: Asynchronicznie vs synchronicznie
  - H2: Zamiana mowy na tekst i Voice Call
  - H2: Mapowania dostawców (jak dostawcy dzielą funkcje między powierzchnie)
  - H2: Powiązane

## tools/minimax-search.md

- Ścieżka: /tools/minimax-search
- Nagłówki:
  - H2: Uzyskaj poświadczenie Token Plan
  - H2: Konfiguracja
  - H2: Wybór regionu
  - H2: Obsługiwane parametry
  - H2: Powiązane

## tools/multi-agent-sandbox-tools.md

- Ścieżka: /tools/multi-agent-sandbox-tools
- Nagłówki:
  - H2: Przykłady konfiguracji
  - H2: Pierwszeństwo konfiguracji
  - H3: Konfiguracja piaskownicy
  - H3: Ograniczenia narzędzi
  - H2: Migracja z pojedynczego agenta
  - H2: Przykłady ograniczeń narzędzi
  - H2: Częsta pułapka: "non-main"
  - H2: Testowanie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/music-generation.md

- Ścieżka: /tools/music-generation
- Nagłówki:
  - H2: Szybki start
  - H2: Obsługiwani dostawcy
  - H3: Macierz możliwości
  - H2: Parametry narzędzia
  - H2: Zachowanie asynchroniczne
  - H3: Cykl życia zadania
  - H2: Konfiguracja
  - H3: Wybór modelu
  - H3: Kolejność wyboru dostawcy
  - H2: Uwagi dotyczące dostawców
  - H2: Wybór właściwej ścieżki
  - H2: Tryby możliwości dostawców
  - H2: Testy na żywo
  - H2: Powiązane

## tools/ollama-search.md

- Ścieżka: /tools/ollama-search
- Nagłówki:
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H2: Uwagi
  - H2: Powiązane

## tools/parallel-search.md

- Ścieżka: /tools/parallel-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Klucz API (płatny dostawca)
  - H2: Konfiguracja
  - H2: Nadpisanie bazowego adresu URL
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/pdf.md

- Ścieżka: /tools/pdf
- Nagłówki:
  - H2: Dostępność
  - H2: Odwołanie do danych wejściowych
  - H2: Obsługiwane odwołania PDF
  - H2: Tryby wykonywania
  - H3: Tryb natywny dostawcy
  - H3: Tryb awaryjny ekstrakcji
  - H2: Konfiguracja
  - H2: Szczegóły danych wyjściowych
  - H2: Zachowanie przy błędach
  - H2: Przykłady
  - H2: Powiązane

## tools/permission-modes.md

- Ścieżka: /tools/permission-modes
- Nagłówki:
  - H2: Zalecana wartość domyślna
  - H2: Tryby wykonania hosta OpenClaw
  - H2: Mapowanie Codex Guardian
  - H2: Uprawnienia uprzęży ACPX
  - H2: Wybór trybu
  - H2: Powiązane

## tools/perplexity-search.md

- Ścieżka: /tools/perplexity-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Uzyskiwanie klucza API Perplexity
  - H2: Zgodność z OpenRouter
  - H2: Przykłady konfiguracji
  - H3: Natywne Perplexity Search API
  - H3: Zgodność OpenRouter / Sonar
  - H2: Gdzie ustawić klucz
  - H2: Parametry narzędzia
  - H3: Reguły filtra domen
  - H2: Uwagi
  - H2: Powiązane

## tools/plugin.md

- Ścieżka: /tools/plugin
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Konfiguracja
  - H3: Wybierz źródło instalacji
  - H3: Zasady instalacji operatora
  - H3: Skonfiguruj zasady Plugin
  - H2: Zrozum formaty Plugin
  - H2: Hooki Plugin
  - H2: Zweryfikuj aktywny Gateway
  - H2: Rozwiązywanie problemów
  - H3: Zablokowana własność ścieżki Plugin
  - H3: Wolna konfiguracja narzędzia Plugin
  - H2: Powiązane

## tools/reactions.md

- Ścieżka: /tools/reactions
- Nagłówki:
  - H2: Jak to działa
  - H2: Zachowanie kanału
  - H2: Poziom reakcji
  - H2: Powiązane

## tools/searxng-search.md

- Ścieżka: /tools/searxng-search
- Nagłówki:
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H2: Zmienna środowiskowa
  - H2: Odwołanie do konfiguracji Plugin
  - H2: Uwagi
  - H2: Powiązane

## tools/skill-workshop.md

- Ścieżka: /tools/skill-workshop
- Nagłówki:
  - H2: Jak to działa
  - H2: Cykl życia
  - H2: Czat
  - H2: CLI
  - H2: Treść propozycji
  - H2: Pliki pomocnicze
  - H2: Narzędzie agenta
  - H2: Zatwierdzanie i autonomia
  - H2: Metody Gateway
  - H2: Przechowywanie
  - H2: Limity
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/skills-config.md

- Ścieżka: /tools/skills-config
- Nagłówki:
  - H2: Ładowanie (skills.load)
  - H2: Instalacja (skills.install)
  - H2: Zasady instalacji operatora (security.installPolicy)
  - H2: Lista dozwolonych dołączonych Skills
  - H2: Wpisy dla poszczególnych Skills (skills.entries)
  - H2: Listy dozwolonych agentów (agents)
  - H2: Warsztat (skills.workshop)
  - H2: Dowiązane symbolicznie korzenie Skills
  - H2: Skills w piaskownicy i zmienne środowiskowe
  - H2: Przypomnienie o kolejności ładowania
  - H2: Powiązane

## tools/skills.md

- Ścieżka: /tools/skills
- Nagłówki:
  - H2: Kolejność ładowania
  - H2: Skills dla poszczególnych agentów vs współdzielone
  - H2: Listy dozwolonych agentów
  - H2: Pluginy i Skills
  - H2: Skill Workshop
  - H2: Instalowanie z ClawHub
  - H2: Bezpieczeństwo
  - H2: Format SKILL.md
  - H3: Opcjonalne klucze frontmatter
  - H2: Bramkowanie
  - H3: Specyfikacje instalatora
  - H2: Nadpisania konfiguracji
  - H2: Wstrzykiwanie środowiska
  - H2: Migawki i odświeżanie
  - H2: Wpływ na tokeny
  - H2: Powiązane

## tools/slash-commands.md

- Ścieżka: /tools/slash-commands
- Nagłówki:
  - H2: Trzy typy poleceń
  - H2: Konfiguracja
  - H2: Lista poleceń
  - H3: Polecenia rdzenia
  - H3: Polecenia Dock
  - H3: Polecenia dołączonych Plugin
  - H3: Polecenia Skills
  - H2: /tools — czego agent może teraz używać
  - H2: /model — wybór modelu
  - H2: /config — zapisy konfiguracji na dysku
  - H2: /mcp — konfiguracja serwera MCP
  - H2: /debug — nadpisania tylko w czasie działania
  - H2: /plugins — zarządzanie Plugin
  - H2: /trace — dane wyjściowe śladu Plugin
  - H2: /btw — pytania poboczne
  - H2: Uwagi o powierzchniach
  - H2: Użycie i stan dostawcy
  - H2: Powiązane

## tools/steer.md

- Ścieżka: /tools/steer
- Nagłówki:
  - H2: Bieżąca sesja
  - H2: Sterowanie vs kolejka
  - H2: Podagenci
  - H2: Sesje ACP
  - H2: Powiązane

## tools/subagents.md

- Ścieżka: /tools/subagents
- Nagłówki:
  - H2: Polecenie ukośnikowe
  - H3: Kontrolki wiązania wątku
  - H3: Zachowanie tworzenia
  - H2: Tryby kontekstu
  - H2: Narzędzie: sessionsspawn
  - H3: Tryb promptu delegowania
  - H3: Parametry narzędzia
  - H3: Nazwy zadań i kierowanie
  - H2: Narzędzie: sessionsyield
  - H2: Narzędzie: subagents
  - H2: Sesje powiązane z wątkiem
  - H3: Kanały obsługujące wątki
  - H3: Szybki przepływ
  - H3: Sterowanie ręczne
  - H3: Przełączniki konfiguracji
  - H3: Lista dozwolonych
  - H3: Wykrywanie
  - H3: Automatyczna archiwizacja
  - H2: Zagnieżdżeni podagenci
  - H3: Poziomy głębokości
  - H3: Łańcuch ogłoszeń
  - H3: Zasady narzędzi według głębokości
  - H3: Limit tworzenia dla agenta
  - H3: Kaskadowe zatrzymanie
  - H2: Uwierzytelnianie
  - H2: Ogłaszanie
  - H3: Kontekst ogłoszenia
  - H3: Wiersz statystyk
  - H3: Dlaczego preferować sessionshistory
  - H2: Zasady narzędzi
  - H3: Nadpisanie przez konfigurację
  - H2: Współbieżność
  - H2: Żywotność i odzyskiwanie
  - H2: Zatrzymywanie
  - H2: Ograniczenia
  - H2: Powiązane

## tools/tavily.md

- Ścieżka: /tools/tavily
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Odwołanie do narzędzia
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Wybór właściwego narzędzia
  - H2: Zaawansowana konfiguracja
  - H2: Powiązane

## tools/thinking.md

- Ścieżka: /tools/thinking
- Nagłówki:
  - H2: Co robi
  - H2: Kolejność rozstrzygania
  - H2: Ustawianie domyślnej wartości sesji
  - H2: Zastosowanie według agenta
  - H2: Tryb szybki (/fast)
  - H2: Dyrektywy szczegółowe (/verbose lub /v)
  - H2: Dyrektywy śladu Plugin (/trace)
  - H2: Widoczność rozumowania (/reasoning)
  - H2: Powiązane
  - H2: Heartbeats
  - H2: Interfejs czatu webowego
  - H2: Profile dostawców

## tools/tokenjuice.md

- Ścieżka: /tools/tokenjuice
- Nagłówki:
  - H2: Włącz Plugin
  - H2: Co zmienia tokenjuice
  - H2: Zweryfikuj, że działa
  - H2: Wyłącz Plugin
  - H2: Powiązane

## tools/tool-search.md

- Ścieżka: /tools/tool-search
- Nagłówki:
  - H2: Jak działa tura
  - H2: Tryby
  - H2: Dlaczego to istnieje
  - H2: API
  - H2: Granica czasu działania
  - H2: Konfiguracja
  - H2: Prompt i telemetria
  - H2: Walidacja E2E
  - H2: Zachowanie przy awarii
  - H2: Powiązane

## tools/trajectory.md

- Ścieżka: /tools/trajectory
- Nagłówki:
  - H2: Szybki start
  - H2: Dostęp
  - H2: Co jest rejestrowane
  - H2: Pliki pakietu
  - H2: Lokalizacja przechwytywania
  - H2: Wyłącz przechwytywanie
  - H2: Dostosuj limit czasu flush
  - H2: Prywatność i limity
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/tts.md

- Ścieżka: /tools/tts
- Nagłówki:
  - H2: Szybki start
  - H2: Obsługiwani dostawcy
  - H2: Konfiguracja
  - H3: Nadpisania głosu dla poszczególnych agentów
  - H2: Persony
  - H3: Minimalna persona
  - H3: Pełna persona (prompt neutralny względem dostawcy)
  - H3: Rozstrzyganie persony
  - H3: Jak dostawcy używają promptów persony
  - H3: Zasady awaryjne
  - H2: Dyrektywy sterowane przez model
  - H2: Polecenia ukośnikowe
  - H2: Preferencje poszczególnych użytkowników
  - H2: Formaty wyjściowe (stałe)
  - H2: Zachowanie Auto-TTS
  - H2: Formaty wyjściowe według kanału
  - H2: Odwołanie do pól
  - H2: Narzędzie agenta
  - H2: Gateway RPC
  - H2: Linki usług
  - H2: Powiązane

## tools/video-generation.md

- Ścieżka: /tools/video-generation
- Nagłówki:
  - H2: Szybki start
  - H2: Jak działa generowanie asynchroniczne
  - H3: Cykl życia zadania
  - H2: Obsługiwani dostawcy
  - H3: Macierz możliwości
  - H2: Parametry narzędzia
  - H3: Wymagane
  - H3: Wejścia treści
  - H3: Kontrolki stylu
  - H3: Zaawansowane
  - H4: Fallback i opcje typowane
  - H2: Akcje
  - H2: Wybór modelu
  - H2: Uwagi dotyczące dostawców
  - H2: Tryby możliwości dostawców
  - H2: Testy na żywo
  - H2: Konfiguracja
  - H2: Powiązane

## tools/web-fetch.md

- Ścieżka: /tools/web-fetch
- Nagłówki:
  - H2: Szybki start
  - H2: Parametry narzędzia
  - H2: Jak to działa
  - H2: Aktualizacje postępu
  - H2: Konfiguracja
  - H2: Fallback Firecrawl
  - H2: Zaufany proxy środowiskowy
  - H2: Limity i bezpieczeństwo
  - H2: Profile narzędzi
  - H2: Powiązane

## tools/web.md

- Ścieżka: /tools/web
- Nagłówki:
  - H2: Szybki start
  - H2: Wybór dostawcy
  - H3: Porównanie dostawców
  - H2: Automatyczne wykrywanie
  - H2: Natywne wyszukiwanie webowe OpenAI
  - H2: Natywne wyszukiwanie webowe Codex
  - H2: Bezpieczeństwo sieci
  - H2: Konfigurowanie wyszukiwania webowego
  - H2: Konfiguracja
  - H3: Przechowywanie kluczy API
  - H2: Parametry narzędzia
  - H2: xsearch
  - H3: Konfiguracja xsearch
  - H3: Parametry xsearch
  - H3: Przykład xsearch
  - H2: Przykłady
  - H2: Profile narzędzi
  - H2: Powiązane

## tts.md

- Ścieżka: /tts
- Nagłówki:
  - H2: Powiązane

## vps.md

- Ścieżka: /vps
- Nagłówki:
  - H2: Wybierz dostawcę
  - H2: Jak działają konfiguracje w chmurze
  - H2: Najpierw zabezpiecz dostęp administratora
  - H2: Współdzielony agent firmowy na VPS
  - H2: Używanie węzłów z VPS
  - H2: Dostrajanie uruchamiania dla małych VM i hostów ARM
  - H3: Lista kontrolna dostrajania systemd (opcjonalna)
  - H2: Powiązane

## web/control-ui.md

- Ścieżka: /web/control-ui
- Nagłówki:
  - H2: Szybkie otwarcie (lokalne)
  - H2: Parowanie urządzeń (pierwsze połączenie)
  - H2: Tożsamość osobista (lokalna dla przeglądarki)
  - H2: Punkt końcowy konfiguracji czasu działania
  - H2: Obsługa języków
  - H2: Motywy wyglądu
  - H2: Co może zrobić (dzisiaj)
  - H2: Strona MCP
  - H2: Karta aktywności
  - H2: Zachowanie czatu
  - H2: Instalacja PWA i web push
  - H2: Osadzenia hostowane
  - H2: Szerokość wiadomości czatu
  - H2: Dostęp przez Tailnet (zalecany)
  - H2: Niezabezpieczony HTTP
  - H2: Content security policy
  - H2: Uwierzytelnianie trasy awatara
  - H2: Uwierzytelnianie trasy multimediów asystenta
  - H2: Budowanie UI
  - H2: Pusta strona Control UI
  - H2: Debugowanie/testowanie: serwer deweloperski + zdalny Gateway
  - H2: Powiązane

## web/dashboard.md

- Ścieżka: /web/dashboard
- Nagłówki:
  - H2: Szybka ścieżka (zalecana)
  - H2: Podstawy uwierzytelniania (lokalne vs zdalne)
  - H2: Jeśli widzisz "unauthorized" / 1008
  - H2: Powiązane

## web/index.md

- Ścieżka: /web
- Nagłówki:
  - H2: Webhooks
  - H2: Admin HTTP RPC
  - H2: Konfiguracja (domyślnie włączona)
  - H2: Dostęp przez Tailscale
  - H3: Integrated Serve (zalecane)
  - H3: Powiązanie Tailnet + token
  - H3: Internet publiczny (Funnel)
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Budowanie UI

## web/tui.md

- Ścieżka: /web/tui
- Nagłówki:
  - H2: Szybki start
  - H3: Tryb Gateway
  - H3: Tryb lokalny
  - H2: Co widzisz
  - H2: Model mentalny: agenci + sesje
  - H2: Wysyłanie + dostarczanie
  - H2: Selektory + nakładki
  - H2: Skróty klawiaturowe
  - H2: Polecenia ukośnikowe
  - H2: Lokalne polecenia powłoki
  - H2: Naprawianie konfiguracji z lokalnego TUI
  - H2: Dane wyjściowe narzędzia
  - H2: Kolory terminala
  - H2: Historia + streaming
  - H2: Szczegóły połączenia
  - H2: Opcje
  - H2: Rozwiązywanie problemów
  - H2: Rozwiązywanie problemów z połączeniem
  - H2: Powiązane

## web/webchat.md

- Ścieżka: /web/webchat
- Nagłówki:
  - H2: Czym jest
  - H2: Szybki start
  - H2: Jak działa (zachowanie)
  - H3: Transkrypcja i model dostarczania
  - H2: Panel narzędzi agentów Control UI
  - H2: Użycie zdalne
  - H2: Odwołanie do konfiguracji (WebChat)
  - H2: Powiązane
