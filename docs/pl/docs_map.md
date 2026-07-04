---
read_when: Finding which docs page covers a topic before reading the page
summary: Wygenerowana mapa nagłówków dla stron dokumentacji OpenClaw
title: Mapa dokumentacji
x-i18n:
    generated_at: "2026-07-04T15:37:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e180b7c652be24b73af51fecc5cf9a566184c1eff65ca0acdc0133bbc49c332
    source_path: docs_map.md
    workflow: 16
---

# Mapa dokumentacji OpenClaw

Ten plik jest generowany z nagłówków `docs/**/*.md` i `docs/**/*.mdx`, aby pomóc agentom poruszać się po drzewie dokumentacji.
Nie edytuj go ręcznie; uruchom `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Trasa: /agent-runtime-architecture
- Nagłówki:
  - H2: Układ Runtime
  - H2: Granice
  - H2: Manifesty
  - H2: Wybór Runtime
  - H2: Powiązane

## announcements/bluebubbles-imessage.md

- Trasa: /announcements/bluebubbles-imessage
- Nagłówki:
  - H1: Usunięcie BlueBubbles i ścieżka imsg iMessage
  - H2: Co się zmieniło
  - H2: Co zrobić
  - H2: Uwagi dotyczące migracji
  - H2: Zobacz także

## auth-credential-semantics.md

- Trasa: /auth-credential-semantics
- Nagłówki:
  - H2: Stabilne kody powodów sondowania
  - H2: Dane uwierzytelniające tokenów
  - H3: Reguły kwalifikacji
  - H3: Reguły rozpoznawania
  - H2: Przenośność kopii agenta
  - H2: Trasy uwierzytelniania tylko z konfiguracji
  - H2: Jawne filtrowanie kolejności uwierzytelniania
  - H2: Rozpoznawanie celu sondowania
  - H2: Wykrywanie danych uwierzytelniających zewnętrznego CLI
  - H2: Strażnik zasad OAuth SecretRef
  - H2: Komunikacja zgodna ze starszymi wersjami
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
  - H2: Jak działa cron
  - H2: Typy harmonogramów
  - H3: Dzień miesiąca i dzień tygodnia używają logiki OR
  - H2: Style wykonywania
  - H3: Ładunki poleceń
  - H3: Opcje ładunku dla izolowanych zadań
  - H2: Dostarczanie i wyjście
  - H2: Język wyjścia
  - H2: Przykłady CLI
  - H2: Webhooki
  - H3: Uwierzytelnianie
  - H2: Integracja Gmail PubSub
  - H3: Konfiguracja kreatorem (zalecane)
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
  - H3: Szczegóły session-memory
  - H3: Konfiguracja bootstrap-extra-files
  - H3: Szczegóły command-logger
  - H3: Szczegóły compaction-notifier
  - H3: Szczegóły boot-md
  - H2: Hooki Plugin
  - H2: Konfiguracja
  - H2: Referencja CLI
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
  - H3: Zaplanowane zadania (cron)
  - H3: Zadania
  - H3: Wywnioskowane zobowiązania
  - H3: Przepływ zadań
  - H3: Stałe dyspozycje
  - H3: Hooki
  - H3: Heartbeat
  - H2: Jak współpracują
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
  - H2: Stałe dyspozycje plus zadania cron
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
  - H2: Kiedy używać Task Flow
  - H2: Niezawodny wzorzec zaplanowanego przepływu pracy
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
  - H2: Referencja CLI
  - H2: Tablica zadań na czacie (/tasks)
  - H2: Integracja statusu (presja zadań)
  - H2: Przechowywanie i utrzymanie
  - H3: Gdzie znajdują się zadania
  - H3: Automatyczne utrzymanie
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
  - H2: Polityka specyficzna dla agenta
  - H2: Widoczne tryby odpowiedzi
  - H2: Historia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/bot-loop-protection.md

- Trasa: /channels/bot-loop-protection
- Nagłówki:
  - H1: Ochrona przed pętlą botów
  - H2: Ustawienia domyślne
  - H2: Konfiguruj współdzielone ustawienia domyślne
  - H2: Nadpisz dla kanału lub konta
  - H2: Obsługa kanałów

## channels/broadcast-groups.md

- Trasa: /channels/broadcast-groups
- Nagłówki:
  - H2: Omówienie
  - H2: Przypadki użycia
  - H2: Konfiguracja
  - H3: Podstawowa konfiguracja
  - H3: Strategia przetwarzania
  - H3: Kompletny przykład
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
  - H2: Referencja API
  - H3: Schemat konfiguracji
  - H3: Pola
  - H2: Ograniczenia
  - H2: Przyszłe usprawnienia
  - H2: Powiązane

## channels/channel-routing.md

- Trasa: /channels/channel-routing
- Nagłówki:
  - H1: Kanały i routing
  - H2: Kluczowe terminy
  - H2: Prefiksy celów wychodzących
  - H2: Kształty kluczy sesji (przykłady)
  - H2: Przypięcie głównej trasy DM
  - H2: Chronione rejestrowanie przychodzące
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
  - H2: Zalecane: skonfiguruj przestrzeń roboczą gildii
  - H2: Model Runtime
  - H2: Kanały forum
  - H2: Komponenty interaktywne
  - H2: Kontrola dostępu i routing
  - H3: Routing agentów oparty na rolach
  - H2: Natywne polecenia i autoryzacja poleceń
  - H2: Szczegóły funkcji
  - H2: Narzędzia i bramki akcji
  - H2: Interfejs Components v2
  - H2: Głos
  - H3: Kanały głosowe
  - H3: Śledzenie użytkowników na głosie
  - H3: Wiadomości głosowe
  - H2: Rozwiązywanie problemów
  - H2: Referencja konfiguracji
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
  - H3: Zezwalaj na wszystkie grupy, @wzmianka nie jest wymagana
  - H3: Zezwalaj na wszystkie grupy, nadal wymagaj @wzmianki
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
  - H3: Wyciek App Secret
  - H2: Konfiguracja zaawansowana
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Streaming
  - H3: Optymalizacja limitów
  - H3: Sesje ACP
  - H4: Trwałe powiązanie ACP
  - H4: Uruchamianie ACP z czatu
  - H3: Routing wieloagentowy
  - H2: Izolacja agentów per użytkownik (dynamiczne tworzenie agentów)
  - H3: Szybka konfiguracja
  - H3: Jak to działa
  - H3: Opcje konfiguracji
  - H3: Zakres sesji
  - H3: Typowe wdrożenie wieloużytkownikowe
  - H3: Weryfikacja
  - H3: Uwagi
  - H2: Referencja konfiguracji
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
  - H2: Wzorzec: osobiste DM + publiczne grupy (jeden agent)
  - H2: Etykiety wyświetlania
  - H2: Polityka grup
  - H2: Bramkowanie wzmianką (domyślnie)
  - H2: Wzorce wzmianki skonfigurowane w zakresie
  - H2: Ograniczenia narzędzi dla grup/kanałów (opcjonalne)
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
  - H2: Media, dzielenie na części i cele dostarczania
  - H2: Akcje prywatnego API
  - H2: Zapisy konfiguracji
  - H2: Scalanie podzielonych wysyłek DM (polecenie + URL w jednej kompozycji)
  - H3: Scenariusze i co widzi agent
  - H2: Odzyskiwanie ruchu przychodzącego po restarcie mostu lub Gateway
  - H3: Sygnał widoczny dla operatora
  - H3: Migracja
  - H2: Rozwiązywanie problemów
  - H2: Wskaźniki referencji konfiguracji
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
  - H3: Częsta pułapka: allowFrom dotyczy DM, nie kanałów
  - H2: Wyzwalanie odpowiedzi (wzmianki)
  - H2: Uwaga dotycząca bezpieczeństwa (zalecane dla kanałów publicznych)
  - H3: Te same narzędzia dla wszystkich w kanale
  - H3: Różne narzędzia dla różnych nadawców (właściciel ma większe uprawnienia)
  - H2: NickServ
  - H2: Zmienne środowiskowe
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/line.md

- Trasa: /channels/line
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H2: Kontrola dostępu
  - H2: Zachowanie wiadomości
  - H2: Dane kanału (wiadomości wzbogacone)
  - H2: Obsługa ACP
  - H2: Multimedia wychodzące
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/location.md

- Trasa: /channels/location
- Nagłówki:
  - H2: Formatowanie tekstu
  - H2: Pola kontekstu
  - H2: Uwagi dotyczące kanału
  - H2: Powiązane

## channels/matrix-migration.md

- Trasa: /channels/matrix-migration
- Nagłówki:
  - H2: Co migracja wykonuje automatycznie
  - H2: Czego migracja nie może wykonać automatycznie
  - H2: Zalecany przepływ aktualizacji
  - H2: Jak działa migracja szyfrowana
  - H2: Typowe komunikaty i ich znaczenie
  - H3: Komunikaty aktualizacji i wykrywania
  - H3: Komunikaty odzyskiwania stanu szyfrowanego
  - H3: Komunikaty odzyskiwania ręcznego
  - H3: Komunikaty instalacji niestandardowego pluginu
  - H2: Jeśli zaszyfrowana historia nadal nie wraca
  - H2: Jeśli chcesz zacząć od nowa dla przyszłych wiadomości
  - H2: Powiązane

## channels/matrix-presentation.md

- Trasa: /channels/matrix-presentation
- Nagłówki:
  - H2: Treść zdarzenia
  - H2: Zachowanie awaryjne
  - H2: Obsługiwane bloki
  - H2: Interakcje
  - H2: Relacja z metadanymi zatwierdzania
  - H2: Wiadomości multimedialne

## channels/matrix-push-rules.md

- Trasa: /channels/matrix-push-rules
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Kroki
  - H2: Uwagi dotyczące wielu botów
  - H2: Uwagi dotyczące homeservera
  - H2: Powiązane

## channels/matrix.md

- Trasa: /channels/matrix
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H3: Konfiguracja interaktywna
  - H3: Minimalna konfiguracja
  - H3: Automatyczne dołączanie
  - H3: Formaty celów listy dozwolonych
  - H3: Normalizacja identyfikatora konta
  - H3: Dane uwierzytelniające w pamięci podręcznej
  - H3: Zmienne środowiskowe
  - H2: Przykład konfiguracji
  - H2: Podglądy strumieniowe
  - H2: Wiadomości głosowe
  - H2: Metadane zatwierdzania
  - H3: Samodzielnie hostowane reguły powiadomień dla cichych sfinalizowanych podglądów
  - H2: Pokoje bot-do-bota
  - H2: Szyfrowanie i weryfikacja
  - H3: Włącz szyfrowanie
  - H3: Sygnały stanu i zaufania
  - H3: Zweryfikuj to urządzenie za pomocą klucza odzyskiwania
  - H3: Uruchom lub napraw podpisywanie krzyżowe
  - H3: Kopia zapasowa kluczy pokoju
  - H3: Wyświetlanie, żądanie i odpowiadanie na weryfikacje
  - H3: Uwagi dotyczące wielu kont
  - H2: Zarządzanie profilem
  - H2: Wątki
  - H3: Routing sesji (sessionScope)
  - H3: Odpowiedzi w wątkach (threadReplies)
  - H3: Dziedziczenie wątków i polecenia ukośnikowe
  - H2: Powiązania konwersacji ACP
  - H3: Konfiguracja powiązania wątku
  - H2: Reakcje
  - H2: Kontekst historii
  - H2: Widoczność kontekstu
  - H2: Zasady DM i pokoi
  - H2: Naprawa pokoju bezpośredniego
  - H2: Zatwierdzenia exec
  - H2: Polecenia ukośnikowe
  - H2: Wiele kont
  - H2: Prywatne/LAN homeservery
  - H2: Proxy ruchu Matrix
  - H2: Rozpoznawanie celu
  - H2: Dokumentacja konfiguracji
  - H3: Konto i połączenie
  - H3: Szyfrowanie
  - H3: Dostęp i zasady
  - H3: Zachowanie odpowiedzi
  - H3: Ustawienia reakcji
  - H3: Narzędzia i nadpisania dla pokoi
  - H3: Ustawienia zatwierdzania exec
  - H2: Powiązane

## channels/mattermost.md

- Trasa: /channels/mattermost
- Nagłówki:
  - H2: Instalacja
  - H2: Szybka konfiguracja
  - H2: Natywne polecenia ukośnikowe
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

- Trasa: /channels/msteams
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja
  - H2: Cele
  - H2: Zapisy konfiguracji
  - H2: Kontrola dostępu (DM + grupy)
  - H3: Jak to działa
  - H3: Krok 1: Utwórz Azure Bot
  - H3: Krok 2: Uzyskaj dane uwierzytelniające
  - H3: Krok 3: Skonfiguruj punkt końcowy wiadomości
  - H3: Krok 4: Włącz kanał Teams
  - H3: Krok 5: Zbuduj manifest aplikacji Teams
  - H3: Krok 6: Skonfiguruj OpenClaw
  - H3: Krok 7: Uruchom Gateway
  - H2: Uwierzytelnianie federacyjne (certyfikat plus tożsamość zarządzana)
  - H3: Opcja A: Uwierzytelnianie oparte na certyfikacie
  - H3: Opcja B: Azure Managed Identity
  - H3: Konfiguracja AKS Workload Identity
  - H3: Porównanie typów uwierzytelniania
  - H2: Programowanie lokalne (tunelowanie)
  - H2: Testowanie bota
  - H2: Zmienne środowiskowe
  - H2: Akcja informacji o członku
  - H2: Kontekst historii
  - H2: Aktualne uprawnienia Teams RSC (manifest)
  - H2: Przykładowy manifest Teams (zanonimizowany)
  - H3: Zastrzeżenia dotyczące manifestu (pola wymagane)
  - H3: Aktualizacja istniejącej aplikacji
  - H2: Możliwości: tylko RSC kontra Graph
  - H3: Tylko z Teams RSC (aplikacja zainstalowana, bez uprawnień Graph API)
  - H3: Z Teams RSC + uprawnieniami aplikacji Microsoft Graph
  - H3: RSC kontra Graph API
  - H2: Multimedia i historia z obsługą Graph (wymagane dla kanałów)
  - H2: Znane ograniczenia
  - H3: Limity czasu Webhook
  - H3: Obsługa chmury Teams i adresu URL usługi
  - H3: Formatowanie
  - H2: Konfiguracja
  - H2: Routing i sesje
  - H2: Styl odpowiedzi: wątki kontra wpisy
  - H3: Pierwszeństwo rozpoznawania
  - H3: Zachowanie kontekstu wątku
  - H2: Załączniki i obrazy
  - H2: Wysyłanie plików w czatach grupowych
  - H3: Dlaczego czaty grupowe wymagają SharePoint
  - H3: Konfiguracja
  - H3: Zachowanie udostępniania
  - H3: Zachowanie awaryjne
  - H3: Lokalizacja przechowywania plików
  - H2: Ankiety (Adaptive Cards)
  - H2: Karty prezentacji
  - H2: Formaty celów
  - H2: Wiadomości proaktywne
  - H2: Identyfikatory zespołu i kanału (częsta pułapka)
  - H2: Kanały prywatne
  - H2: Rozwiązywanie problemów
  - H3: Typowe problemy
  - H3: Błędy przesyłania manifestu
  - H3: Uprawnienia RSC nie działają
  - H2: Odwołania
  - H2: Powiązane

## channels/nextcloud-talk.md

- Trasa: /channels/nextcloud-talk
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Uwagi
  - H2: Kontrola dostępu (DM)
  - H2: Pokoje (grupy)
  - H2: Możliwości
  - H2: Dokumentacja konfiguracji (Nextcloud Talk)
  - H2: Powiązane

## channels/nostr.md

- Trasa: /channels/nostr
- Nagłówki:
  - H2: Dołączony Plugin
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

- Trasa: /channels/pairing
- Nagłówki:
  - H2: 1) Parowanie DM (dostęp do czatu przychodzącego)
  - H3: Zatwierdź nadawcę
  - H3: Grupy nadawców wielokrotnego użytku
  - H3: Gdzie znajduje się stan
  - H2: 2) Parowanie urządzenia Node (węzły iOS/Android/macOS/headless)
  - H3: Paruj przez Telegram (zalecane dla iOS)
  - H3: Zatwierdź urządzenie Node
  - H3: Opcjonalne automatyczne zatwierdzanie Node dla zaufanego CIDR
  - H3: Przechowywanie stanu parowania Node
  - H3: Uwagi
  - H2: Powiązana dokumentacja

## channels/qa-channel.md

- Trasa: /channels/qa-channel
- Nagłówki:
  - H2: Co robi
  - H2: Konfiguracja
  - H2: Uruchamiacze
  - H2: Powiązane

## channels/qqbot.md

- Trasa: /channels/qqbot
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja początkowa
  - H2: Konfiguracja
  - H3: Konfiguracja wielu kont
  - H3: Czaty grupowe
  - H3: Głos (STT / TTS)
  - H2: Formaty celów
  - H2: Polecenia ukośnikowe
  - H2: Architektura silnika
  - H2: Wdrażanie przez kod QR
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/raft.md

- Trasa: /channels/raft
- Nagłówki:
  - H2: Instalacja
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Weryfikacja
  - H2: Rozwiązywanie problemów
  - H2: Odwołania

## channels/signal.md

- Trasa: /channels/signal
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
  - H2: Multimedia + limity
  - H2: Pisanie + potwierdzenia odczytu
  - H2: Reakcje stanu cyklu życia
  - H2: Reakcje (narzędzie wiadomości)
  - H2: Reakcje zatwierdzania
  - H2: Cele dostarczania (CLI/cron)
  - H2: Aliasy
  - H2: Rozwiązywanie problemów
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Dokumentacja konfiguracji (Signal)
  - H2: Powiązane

## channels/slack.md

- Trasa: /channels/slack
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
  - H2: Wątki, sesje i tagi odpowiedzi
  - H2: Reakcje potwierdzenia
  - H3: Emoji (ackReaction)
  - H3: Zakres (messages.ackReactionScope)
  - H2: Strumieniowanie tekstu
  - H2: Awaryjna reakcja pisania
  - H2: Multimedia, dzielenie na części i dostarczanie
  - H2: Polecenia i zachowanie ukośnikowe
  - H2: Odpowiedzi interaktywne
  - H3: Przesłania modalne należące do pluginu
  - H2: Natywne zatwierdzenia w Slack
  - H2: Zdarzenia i zachowanie operacyjne
  - H2: Dokumentacja konfiguracji
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja vision załączników
  - H3: Obsługiwane typy multimediów
  - H3: Potok przychodzący
  - H3: Dziedziczenie załączników korzenia wątku
  - H3: Obsługa wielu załączników
  - H3: Limity rozmiaru, pobierania i modelu
  - H3: Znane ograniczenia
  - H3: Powiązana dokumentacja
  - H2: Powiązane

## channels/sms.md

- Trasa: /channels/sms
- Nagłówki:
  - H2: Zanim zaczniesz
  - H2: Szybka konfiguracja
  - H2: Przykłady konfiguracji
  - H3: Plik konfiguracji
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
  - H3: Nie pojawia się żądanie parowania
  - H3: Wysyłanie wychodzące kończy się niepowodzeniem
  - H3: Wiadomości docierają, ale agent nie odpowiada

## channels/synology-chat.md

- Trasa: /channels/synology-chat
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja
  - H2: Zmienne środowiskowe
  - H2: Zasady DM i kontrola dostępu
  - H2: Dostarczanie wychodzące
  - H2: Wiele kont
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/telegram.md

- Trasa: /channels/telegram
- Nagłówki:
  - H2: Szybka konfiguracja
  - H2: Ustawienia po stronie Telegram
  - H2: Kontrola dostępu i aktywacja
  - H3: Tożsamość bota grupowego
  - H2: Zachowanie w czasie działania
  - H2: Dokumentacja funkcji
  - H2: Kontrole odpowiedzi na błędy
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Powiązane

## channels/tlon.md

- Trasa: /channels/tlon
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Konfiguracja początkowa
  - H2: Prywatne/LAN statki
  - H2: Kanały grupowe
  - H2: Kontrola dostępu
  - H2: System właściciela i zatwierdzania
  - H2: Ustawienia automatycznej akceptacji
  - H2: Cele dostarczania (CLI/cron)
  - H2: Dołączony Skills
  - H2: Możliwości
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## channels/troubleshooting.md

- Trasa: /channels/troubleshooting
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

- Ścieżka: /channels/twitch
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Konfiguracja (szczegółowa)
  - H3: Wygeneruj poświadczenia
  - H3: Skonfiguruj bota
  - H3: Kontrola dostępu (zalecana)
  - H2: Odświeżanie tokenów (opcjonalne)
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

- Ścieżka: /channels/wechat
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

- Ścieżka: /channels/whatsapp
- Nagłówki:
  - H2: Instalacja (na żądanie)
  - H2: Szybka konfiguracja
  - H2: Zadzwoń do bieżącego requester za pomocą MeowCaller (eksperymentalne)
  - H2: Wzorce wdrożenia
  - H2: Model wykonawczy
  - H2: Monity zatwierdzania
  - H2: Hooki Plugin i prywatność
  - H2: Kontrola dostępu i aktywacja
  - H2: Skonfigurowane powiązania ACP
  - H2: Zachowanie numeru osobistego i czatu z samym sobą
  - H2: Normalizacja wiadomości i kontekst
  - H2: Dostarczanie, dzielenie na fragmenty i multimedia
  - H2: Cytowanie odpowiedzi
  - H2: Poziom reakcji
  - H2: Reakcje potwierdzenia
  - H2: Reakcje statusu cyklu życia
  - H2: Wiele kont i poświadczenia
  - H2: Narzędzia, akcje i zapisy konfiguracji
  - H2: Rozwiązywanie problemów
  - H2: Monity systemowe
  - H2: Wskaźniki referencji konfiguracji
  - H2: Powiązane

## channels/yuanbao.md

- Ścieżka: /channels/yuanbao
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
  - H3: Dostosuj strategię scalania tekstu
  - H2: Typowe polecenia
  - H2: Rozwiązywanie problemów
  - H3: Bot nie odpowiada w czatach grupowych
  - H3: Bot nie odbiera wiadomości
  - H3: Bot wysyła puste lub zastępcze odpowiedzi
  - H3: Wyciek App Secret
  - H2: Konfiguracja zaawansowana
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Strumieniowanie
  - H3: Kontekst historii czatu grupowego
  - H3: Tryb odpowiedzi do
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

- Ścieżka: /channels/zalo
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
  - H2: Long-polling kontra Webhook
  - H2: Obsługiwane typy wiadomości
  - H2: Możliwości
  - H2: Cele dostarczania (CLI/Cron)
  - H2: Rozwiązywanie problemów
  - H2: Referencja konfiguracji (Zalo)
  - H2: Powiązane

## channels/zaloclawbot.md

- Ścieżka: /channels/zaloclawbot
- Nagłówki:
  - H2: Zgodność
  - H2: Wymagania wstępne
  - H2: Instalacja przez onboard (zalecana)
  - H2: Instalacja ręczna
  - H3: 1. Zainstaluj Plugin
  - H3: 2. Włącz Plugin w konfiguracji
  - H3: 3. Wygeneruj kod QR i zaloguj się
  - H3: 4. Uruchom ponownie Gateway
  - H2: Jak to działa
  - H2: Pod maską
  - H2: Rozwiązywanie problemów

## channels/zalouser.md

- Ścieżka: /channels/zalouser
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (dla początkujących)
  - H2: Co to jest
  - H2: Nazewnictwo
  - H2: Znajdowanie identyfikatorów (katalog)
  - H2: Limity
  - H2: Kontrola dostępu (DM)
  - H2: Dostęp grupowy (opcjonalny)
  - H3: Bramka wzmianki grupowej
  - H2: Wiele kont
  - H2: Zmienne środowiskowe
  - H2: Wpisywanie, reakcje i potwierdzenia dostarczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## ci.md

- Ścieżka: /ci
- Nagłówki:
  - H2: Przegląd Pipeline
  - H2: Kolejność szybkiego przerywania
  - H2: Kontekst PR i dowody
  - H2: Zakres i routing
  - H2: Przekazywanie aktywności ClawSweeper
  - H2: Ręczne uruchomienia
  - H2: Runnery
  - H2: Budżet rejestracji runnerów
  - H2: Lokalne odpowiedniki
  - H2: Wydajność OpenClaw
  - H2: Pełna walidacja wydania
  - H2: Shardy Live i E2E
  - H2: Akceptacja pakietu
  - H3: Zadania
  - H3: Źródła kandydatów
  - H3: Profile zestawów
  - H3: Okna zgodności ze starszymi wersjami
  - H3: Przykłady
  - H2: Smoke test instalacji
  - H2: Lokalne Docker E2E
  - H3: Parametry strojenia
  - H3: Wielokrotnego użytku workflow live/E2E
  - H3: Fragmenty ścieżki wydania
  - H2: Wersja przedpremierowa Plugin
  - H2: QA Lab
  - H2: CodeQL
  - H3: Kategorie bezpieczeństwa
  - H3: Shardy bezpieczeństwa specyficzne dla platform
  - H3: Kategorie krytycznej jakości
  - H2: Workflow utrzymaniowe
  - H3: Agent dokumentacji
  - H3: Agent wydajności testów
  - H3: Zduplikowane PR po scaleniu
  - H2: Lokalne bramki sprawdzania i routing zmian
  - H2: Walidacja Testbox
  - H2: Powiązane

## clawhub/cli.md

- Ścieżka: /clawhub/cli
- Nagłówki:
  - H1: CLI ClawHub
  - H2: Odkrywanie i instalacja
  - H2: Publikowanie i utrzymanie
  - H2: Powiązane

## clawhub/publishing.md

- Ścieżka: /clawhub/publishing
- Nagłówki:
  - H1: Publikowanie w ClawHub
  - H2: Właściciele
  - H2: Skills
  - H2: Plugins
  - H2: Przepływ wydania
  - H2: FAQ
  - H3: Zakres pakietu musi pasować do wybranego właściciela

## cli/acp.md

- Ścieżka: /cli/acp
- Nagłówki:
  - H2: Czym to nie jest
  - H2: Macierz zgodności
  - H2: Znane ograniczenia
  - H2: Użycie
  - H2: Klient ACP (debugowanie)
  - H2: Smoke test protokołu
  - H2: Jak tego używać
  - H2: Wybieranie agentów
  - H2: Użycie z acpx (Codex, Claude, inni klienci ACP)
  - H2: Konfiguracja edytora Zed
  - H2: Mapowanie sesji
  - H2: Opcje
  - H3: opcje klienta acp
  - H2: Powiązane

## cli/agent.md

- Ścieżka: /cli/agent
- Nagłówki:
  - H1: openclaw agent
  - H2: Opcje
  - H2: Przykłady
  - H2: Uwagi
  - H2: Status dostarczania JSON
  - H2: Powiązane

## cli/agents.md

- Ścieżka: /cli/agents
- Nagłówki:
  - H1: openclaw agents
  - H2: Przykłady
  - H2: Powiązania routingu
  - H3: format --bind
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

- Ścieżka: /cli/approvals
- Nagłówki:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Typowe polecenia
  - H2: Zastąp zatwierdzenia z pliku
  - H2: Przykład „Nigdy nie pytaj” / YOLO
  - H2: Pomocniki listy dozwolonych
  - H2: Typowe opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/attach.md

- Ścieżka: /cli/attach
- Nagłówki: brak

## cli/backup.md

- Ścieżka: /cli/backup
- Nagłówki:
  - H1: openclaw backup
  - H2: Uwagi
  - H2: Co jest uwzględniane w kopii zapasowej
  - H2: Zachowanie przy nieprawidłowej konfiguracji
  - H2: Rozmiar i wydajność
  - H2: Powiązane

## cli/browser.md

- Ścieżka: /cli/browser
- Nagłówki:
  - H1: openclaw browser
  - H2: Typowe flagi
  - H2: Szybki start (lokalnie)
  - H2: Szybkie rozwiązywanie problemów
  - H2: Cykl życia
  - H2: Jeśli brakuje polecenia
  - H2: Profile
  - H2: Karty
  - H2: Migawka / zrzut ekranu / akcje
  - H2: Stan i przechowywanie
  - H2: Debugowanie
  - H2: Istniejący Chrome przez MCP
  - H2: Zdalne sterowanie przeglądarką (proxy hosta Node)
  - H2: Powiązane

## cli/channels.md

- Ścieżka: /cli/channels
- Nagłówki:
  - H1: openclaw channels
  - H2: Typowe polecenia
  - H2: Status / możliwości / rozwiązywanie / logi
  - H2: Dodawanie / usuwanie kont
  - H2: Logowanie i wylogowanie (interaktywne)
  - H2: Rozwiązywanie problemów
  - H2: Sonda możliwości
  - H2: Rozwiązywanie nazw na identyfikatory
  - H2: Powiązane

## cli/clawbot.md

- Ścieżka: /cli/clawbot
- Nagłówki:
  - H1: openclaw clawbot
  - H2: Migracja
  - H2: Powiązane

## cli/commitments.md

- Ścieżka: /cli/commitments
- Nagłówki:
  - H2: Użycie
  - H2: Opcje
  - H2: Przykłady
  - H2: Dane wyjściowe
  - H2: Powiązane

## cli/completion.md

- Ścieżka: /cli/completion
- Nagłówki:
  - H1: openclaw completion
  - H2: Użycie
  - H2: Opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/config.md

- Ścieżka: /cli/config
- Nagłówki:
  - H2: Opcje główne
  - H2: Przykłady
  - H3: config schema
  - H3: Ścieżki
  - H2: Wartości
  - H2: tryby config set
  - H2: config patch
  - H2: Flagi kreatora dostawcy
  - H2: Przebieg próbny
  - H3: Kształt danych wyjściowych JSON
  - H2: Bezpieczeństwo zapisu
  - H2: Podpolecenia
  - H2: Walidacja
  - H2: Powiązane

## cli/configure.md

- Ścieżka: /cli/configure
- Nagłówki:
  - H1: openclaw configure
  - H2: Opcje
  - H2: Przykłady
  - H2: Powiązane

## cli/crestodian.md

- Ścieżka: /cli/crestodian
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

- Ścieżka: /cli/cron
- Nagłówki:
  - H1: openclaw cron
  - H2: Szybkie tworzenie zadań
  - H2: Sesje
  - H2: Dostarczanie
  - H3: Własność dostarczania
  - H3: Dostarczanie błędów
  - H2: Harmonogramowanie
  - H3: Zadania jednorazowe
  - H3: Zadania cykliczne
  - H3: Uruchomienia ręczne
  - H2: Modele
  - H3: Izolowany priorytet modelu Cron
  - H3: Tryb szybki
  - H3: Ponowienia przełączania modelu live
  - H2: Dane wyjściowe uruchomienia i odmowy
  - H3: Tłumienie nieaktualnych potwierdzeń
  - H3: Ciche tłumienie tokenów
  - H3: Strukturalne odmowy
  - H2: Retencja
  - H2: Migrowanie starszych zadań
  - H2: Typowe edycje
  - H2: Typowe polecenia administratora
  - H2: Powiązane

## cli/daemon.md

- Ścieżka: /cli/daemon
- Nagłówki:
  - H1: openclaw daemon
  - H2: Użycie
  - H2: Podpolecenia
  - H2: Typowe opcje
  - H2: Preferuj
  - H2: Powiązane

## cli/dashboard.md

- Ścieżka: /cli/dashboard
- Nagłówki:
  - H1: openclaw dashboard
  - H2: Powiązane

## cli/devices.md

- Ścieżka: /cli/devices
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

- Ścieżka: /cli/directory
- Nagłówki:
  - H1: openclaw directory
  - H2: Typowe flagi
  - H2: Uwagi
  - H2: Używanie wyników przy wysyłaniu wiadomości
  - H2: Formaty identyfikatorów (według kanału)
  - H2: Self („me”)
  - H2: Peers (kontakty/użytkownicy)
  - H2: Grupy
  - H2: Powiązane

## cli/dns.md

- Ścieżka: /cli/dns
- Nagłówki:
  - H1: openclaw dns
  - H2: Konfiguracja
  - H2: dns setup
  - H2: Powiązane

## cli/docs.md

- Ścieżka: /cli/docs
- Nagłówki:
  - H1: openclaw docs
  - H2: Użycie
  - H2: Przykłady
  - H2: Jak to działa
  - H2: Dane wyjściowe
  - H2: Kody wyjścia
  - H2: Powiązane

## cli/doctor.md

- Ścieżka: /cli/doctor
- Nagłówki:
  - H1: openclaw doctor
  - H2: Dlaczego warto tego używać
  - H2: Przykłady
  - H2: Opcje
  - H2: Tryb lint
  - H2: Strukturalne kontrole kondycji
  - H2: Wybór kontroli
  - H2: Tryb po aktualizacji
  - H2: macOS: nadpisania env launchctl
  - H2: Powiązane

## cli/flows.md

- Ścieżka: /cli/flows
- Nagłówki:
  - H1: openclaw tasks flow
  - H2: Podpolecenia
  - H3: Wartości filtra statusu
  - H2: Przykłady
  - H2: Powiązane

## cli/gateway.md

- Ścieżka: /cli/gateway
- Nagłówki:
  - H2: Uruchom Gateway
  - H3: Opcje
  - H2: Uruchom ponownie Gateway
  - H3: Profilowanie Gateway
  - H2: Odpytaj działający Gateway
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Zdalnie przez SSH (parytet aplikacji Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Zarządzaj usługą Gateway
  - H3: Instalacja z wrapperem
  - H2: Wykrywanie Gateway (Bonjour)
  - H3: gateway discover
  - H2: Powiązane

## cli/health.md

- Ścieżka: /cli/health
- Nagłówki:
  - H1: openclaw health
  - H2: Opcje
  - H2: Powiązane

## cli/hooks.md

- Ścieżka: /cli/hooks
- Nagłówki:
  - H1: openclaw hooks
  - H2: Wyświetl wszystkie hooki
  - H2: Pobierz informacje o hooku
  - H2: Sprawdź kwalifikowalność hooków
  - H2: Włącz Hook
  - H2: Wyłącz Hook
  - H2: Uwagi
  - H2: Zainstaluj pakiety hooków
  - H2: Zaktualizuj pakiety hooków
  - H2: Wbudowane hooki
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Powiązane

## cli/index.md

- Ścieżka: /cli
- Nagłówki:
  - H2: Strony poleceń
  - H2: Flagi globalne
  - H2: Tryby wyjścia
  - H2: Drzewo poleceń
  - H2: Polecenia slash czatu
  - H2: Śledzenie użycia
  - H2: Powiązane

## cli/infer.md

- Ścieżka: /cli/infer
- Nagłówki:
  - H2: Zmień infer w skill
  - H2: Dlaczego warto używać infer
  - H2: Drzewo poleceń
  - H2: Typowe zadania
  - H2: Zachowanie
  - H2: Model
  - H2: Obraz
  - H2: Audio
  - H2: TTS
  - H2: Wideo
  - H2: Web
  - H2: Osadzanie
  - H2: Wyjście JSON
  - H2: Typowe pułapki
  - H2: Uwagi
  - H2: Powiązane

## cli/logs.md

- Ścieżka: /cli/logs
- Nagłówki:
  - H1: openclaw logs
  - H2: Opcje
  - H2: Współdzielone opcje RPC Gateway
  - H2: Przykłady
  - H2: Uwagi
  - H2: Powiązane

## cli/mcp.md

- Ścieżka: /cli/mcp
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
  - H2: OpenClaw jako rejestr klientów MCP
  - H3: Zapisane definicje serwerów MCP
  - H3: Typowe receptury serwera
  - H3: Kształty wyjścia JSON
  - H3: Transport stdio
  - H3: Transport SSE / HTTP
  - H3: Przepływ OAuth
  - H3: Transport HTTP ze strumieniowaniem
  - H2: Control UI
  - H2: Obecne ograniczenia
  - H2: Powiązane

## cli/memory.md

- Ścieżka: /cli/memory
- Nagłówki:
  - H1: openclaw memory
  - H2: Przykłady
  - H2: Opcje
  - H2: Dreaming
  - H2: Powiązane

## cli/message.md

- Ścieżka: /cli/message
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

- Ścieżka: /cli/migrate
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
  - H3: Stan wyłącznie archiwalny
  - H3: Po zastosowaniu
  - H2: Kontrakt Plugin
  - H2: Integracja onboardingu
  - H2: Powiązane

## cli/models.md

- Ścieżka: /cli/models
- Nagłówki:
  - H1: openclaw models
  - H2: Typowe polecenia
  - H3: Skanowanie modeli
  - H3: Stan modeli
  - H2: Aliasy + rozwiązania awaryjne
  - H2: Profile uwierzytelniania
  - H2: Powiązane

## cli/node.md

- Ścieżka: /cli/node
- Nagłówki:
  - H1: openclaw node
  - H2: Dlaczego używać hosta Node?
  - H2: Proxy przeglądarki (bez konfiguracji)
  - H2: Uruchomienie (pierwszy plan)
  - H2: Uwierzytelnianie Gateway dla hosta Node
  - H2: Usługa (tło)
  - H2: Parowanie
  - H2: Zatwierdzanie exec
  - H2: Powiązane

## cli/nodes.md

- Ścieżka: /cli/nodes
- Nagłówki:
  - H1: openclaw nodes
  - H2: Typowe polecenia
  - H2: Wywołanie
  - H2: Powiązane

## cli/onboard.md

- Ścieżka: /cli/onboard
- Nagłówki:
  - H1: openclaw onboard
  - H2: Powiązane przewodniki
  - H2: Przykłady
  - H2: Ustawienia regionalne
  - H3: Nieinteraktywne wybory endpointu Z.AI
  - H2: Dodatkowe flagi nieinteraktywne
  - H2: Uwagi dotyczące przepływu
  - H2: Typowe polecenia uzupełniające

## cli/pairing.md

- Ścieżka: /cli/pairing
- Nagłówki:
  - H1: openclaw pairing
  - H2: Polecenia
  - H2: pairing list
  - H2: pairing approve
  - H2: Uwagi
  - H2: Powiązane

## cli/path.md

- Ścieżka: /cli/path
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
  - H2: Receptury według rodzaju pliku
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Referencja podpólceń
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

- Ścieżka: /cli/plugins
- Nagłówki:
  - H2: Polecenia
  - H3: Autor
  - H3: Szkielet dostawcy
  - H3: Instalacja
  - H4: Skrót marketplace
  - H3: Lista
  - H3: Indeks Plugin
  - H3: Odinstalowanie
  - H3: Aktualizacja
  - H3: Inspekcja
  - H3: Doctor
  - H3: Rejestr
  - H3: Marketplace
  - H2: Powiązane

## cli/policy.md

- Ścieżka: /cli/policy
- Nagłówki:
  - H1: openclaw policy
  - H2: Szybki start
  - H3: Referencja reguł polityki
  - H4: Nakładki zakresowe
  - H4: Kanały
  - H4: Serwery MCP
  - H4: Dostawcy modeli
  - H4: Sieć
  - H4: Ingress i dostęp do kanałów
  - H4: Gateway
  - H4: Obszar roboczy agenta
  - H4: Postawa sandboxa
  - H4: Obsługa danych
  - H4: Sekrety
  - H4: Zatwierdzanie exec
  - H4: Profile uwierzytelniania
  - H4: Metadane narzędzi
  - H4: Postawa narzędzi
  - H2: Konfiguracja polityki
  - H2: Akceptacja stanu polityki
  - H2: Ustalenia
  - H2: Naprawa
  - H2: Kody wyjścia
  - H2: Powiązane

## cli/proxy.md

- Ścieżka: /cli/proxy
- Nagłówki:
  - H1: openclaw proxy
  - H2: Polecenia
  - H2: Walidacja
  - H2: Presety zapytań
  - H2: Uwagi
  - H2: Powiązane

## cli/qr.md

- Ścieżka: /cli/qr
- Nagłówki:
  - H1: openclaw qr
  - H2: Użycie
  - H2: Opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/reset.md

- Ścieżka: /cli/reset
- Nagłówki:
  - H1: openclaw reset
  - H2: Powiązane

## cli/sandbox.md

- Ścieżka: /cli/sandbox
- Nagłówki:
  - H2: Przegląd
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
  - H2: Dlaczego jest to potrzebne
  - H2: Migracja rejestru
  - H2: Konfiguracja
  - H2: Powiązane

## cli/secrets.md

- Ścieżka: /cli/secrets
- Nagłówki:
  - H1: openclaw secrets
  - H2: Przeładuj migawkę runtime
  - H2: Audyt
  - H2: Konfiguracja (interaktywny pomocnik)
  - H2: Zastosuj zapisany plan
  - H2: Dlaczego nie ma kopii zapasowych do wycofania
  - H2: Przykład
  - H2: Powiązane

## cli/security.md

- Ścieżka: /cli/security
- Nagłówki:
  - H1: openclaw security
  - H2: Audyt
  - H2: Wyjście JSON
  - H2: Co zmienia --fix
  - H2: Powiązane

## cli/sessions.md

- Ścieżka: /cli/sessions
- Nagłówki:
  - H1: openclaw sessions
  - H2: Konserwacja czyszczenia
  - H2: Skompaktuj sesję
  - H3: RPC sessions.compact
  - H2: Powiązane

## cli/setup.md

- Ścieżka: /cli/setup
- Nagłówki:
  - H1: openclaw setup
  - H2: Opcje
  - H3: Tryb bazowy
  - H2: Przykłady
  - H2: Uwagi
  - H2: Powiązane

## cli/skills.md

- Ścieżka: /cli/skills
- Nagłówki:
  - H1: openclaw skills
  - H2: Polecenia
  - H2: Warsztat Skills
  - H2: Powiązane

## cli/status.md

- Ścieżka: /cli/status
- Nagłówki:
  - H2: Powiązane

## cli/system.md

- Ścieżka: /cli/system
- Nagłówki:
  - H1: openclaw system
  - H2: Typowe polecenia
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Uwagi
  - H2: Powiązane

## cli/tasks.md

- Ścieżka: /cli/tasks
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

- Ścieżka: /cli/transcripts
- Nagłówki:
  - H1: openclaw transcripts
  - H2: Polecenia
  - H2: Wyjście
  - H2: Wiele spotkań dziennie
  - H2: Brakujące podsumowania
  - H2: Konfiguracja

## cli/tui.md

- Ścieżka: /cli/tui
- Nagłówki:
  - H1: openclaw tui
  - H2: Opcje
  - H2: Przykłady
  - H2: Pętla naprawy konfiguracji
  - H2: Powiązane

## cli/uninstall.md

- Ścieżka: /cli/uninstall
- Nagłówki:
  - H1: openclaw uninstall
  - H2: Powiązane

## cli/update.md

- Ścieżka: /cli/update
- Nagłówki:
  - H1: openclaw update
  - H2: Użycie
  - H2: Opcje
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Co robi
  - H3: Kształt odpowiedzi płaszczyzny sterowania
  - H2: Przepływ checkoutu Git
  - H3: Wybór kanału
  - H3: Kroki aktualizacji
  - H2: Skrót --update
  - H2: Powiązane

## cli/voicecall.md

- Ścieżka: /cli/voicecall
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
  - H2: Udostępnianie webhooków
  - H3: expose
  - H2: Powiązane

## cli/webhooks.md

- Ścieżka: /cli/webhooks
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

- Ścieżka: /cli/wiki
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
  - H2: Powiązania konfiguracji
  - H2: Powiązane

## cli/workboard.md

- Ścieżka: /cli/workboard
- Nagłówki:
  - H2: Użycie
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Parzystość poleceń slash
  - H2: Uprawnienia
  - H2: Rozwiązywanie problemów
  - H3: Nie pojawiają się żadne karty
  - H3: Dispatch mówi, że tylko dane
  - H3: Dispatch niczego nie uruchamia
  - H2: Powiązane

## concepts/active-memory.md

- Ścieżka: /concepts/active-memory
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
  - H2: Polityka fallbacku modeli
  - H2: Narzędzia pamięci
  - H3: Wbudowany memory-core
  - H3: Pamięć LanceDB
  - H3: Lossless Claw
  - H2: Zaawansowane wyjścia awaryjne
  - H2: Utrwalanie transkryptu
  - H2: Konfiguracja
  - H2: Zalecana konfiguracja
  - H3: Okres karencji przy cold start
  - H2: Debugowanie
  - H2: Typowe problemy
  - H2: Powiązane strony

## concepts/agent-loop.md

- Ścieżka: /concepts/agent-loop
- Nagłówki:
  - H2: Punkty wejścia
  - H2: Jak to działa (wysoki poziom)
  - H2: Kolejkowanie + współbieżność
  - H2: Przygotowanie sesji + obszaru roboczego
  - H2: Składanie promptu + prompt systemowy
  - H2: Punkty hooków (gdzie możesz przechwytywać)
  - H3: Hooki wewnętrzne (hooki Gateway)
  - H3: Hooki Plugin (cykl życia agenta + gateway)
  - H2: Strumieniowanie + częściowe odpowiedzi
  - H2: Wykonywanie narzędzi + narzędzia wiadomości
  - H2: Kształtowanie odpowiedzi + tłumienie
  - H2: Compaction + ponowienia
  - H2: Strumienie zdarzeń (obecnie)
  - H2: Obsługa kanału czatu
  - H2: Limity czasu
  - H2: Gdzie rzeczy mogą zakończyć się wcześniej
  - H2: Powiązane

## concepts/agent-runtimes.md

- Ścieżka: /concepts/agent-runtimes
- Nagłówki:
  - H2: Powierzchnie Codex
  - H2: Własność runtime
  - H2: Wybór runtime
  - H2: Runtime agenta GitHub Copilot
  - H2: Kontrakt zgodności
  - H2: Etykiety stanu
  - H2: Powiązane

## concepts/agent-workspace.md

- Ścieżka: /concepts/agent-workspace
- Nagłówki:
  - H2: Domyślna lokalizacja
  - H2: Dodatkowe foldery przestrzeni roboczej
  - H2: Mapa plików przestrzeni roboczej
  - H2: Czego NIE ma w przestrzeni roboczej
  - H2: Kopia zapasowa Git (zalecana, prywatna)
  - H2: Nie commituj sekretów
  - H2: Przenoszenie przestrzeni roboczej na nową maszynę
  - H2: Uwagi zaawansowane
  - H2: Powiązane

## concepts/agent.md

- Ścieżka: /concepts/agent
- Nagłówki:
  - H2: Przestrzeń robocza (wymagana)
  - H2: Pliki startowe (wstrzykiwane)
  - H2: Wbudowane narzędzia
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
  - H2: Przegląd
  - H2: Komponenty i przepływy
  - H3: Gateway (demon)
  - H3: Klienci (aplikacja Mac / CLI / administrator webowy)
  - H3: Węzły (macOS / iOS / Android / bez interfejsu)
  - H3: WebChat
  - H2: Cykl życia połączenia (pojedynczy klient)
  - H2: Protokół przewodowy (podsumowanie)
  - H2: Parowanie + lokalne zaufanie
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
  - H3: Zachowanie identyfikatorów
  - H3: Ochrona bajtów aktywnego transkryptu
  - H3: Transkrypty następcze
  - H3: Powiadomienia Compaction
  - H3: Opróżnianie pamięci
  - H2: Wymienne dostawcy Compaction
  - H2: Compaction a przycinanie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/context-engine.md

- Ścieżka: /concepts/context-engine
- Nagłówki:
  - H2: Szybki start
  - H2: Jak to działa
  - H3: Cykl życia subagenta (opcjonalnie)
  - H3: Dodatek do promptu systemowego
  - H2: Starszy silnik
  - H2: Silniki Plugin
  - H3: Interfejs ContextEngine
  - H3: Ustawienia środowiska uruchomieniowego
  - H3: Wymagania hosta
  - H3: Izolacja awarii
  - H3: ownsCompaction
  - H2: Referencja konfiguracji
  - H2: Relacja z Compaction i pamięcią
  - H2: Wskazówki
  - H2: Powiązane

## concepts/context.md

- Ścieżka: /concepts/context
- Nagłówki:
  - H2: Szybki start (inspekcja kontekstu)
  - H2: Przykładowe wyjście
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Co wlicza się do okna kontekstu
  - H2: Jak OpenClaw buduje prompt systemowy
  - H2: Wstrzykiwane pliki przestrzeni roboczej (kontekst projektu)
  - H2: Skills: wstrzykiwane a ładowane na żądanie
  - H2: Narzędzia: istnieją dwa koszty
  - H2: Polecenia, dyrektywy i „skróty inline”
  - H2: Sesje, Compaction i przycinanie (co jest zachowywane)
  - H2: Co faktycznie raportuje /context
  - H2: Powiązane

## concepts/delegate-architecture.md

- Ścieżka: /concepts/delegate-architecture
- Nagłówki:
  - H2: Czym jest delegat?
  - H2: Po co delegaci?
  - H2: Poziomy możliwości
  - H3: Poziom 1: tylko odczyt + wersja robocza
  - H3: Poziom 2: wysyłanie w imieniu
  - H3: Poziom 3: proaktywny
  - H2: Wymagania wstępne: izolacja i utwardzenie
  - H3: Twarde blokady (niepodlegające negocjacji)
  - H3: Ograniczenia narzędzi
  - H3: Izolacja piaskownicy
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
  - H2: Pobieranie transkryptów sesji
  - H2: Dziennik snów
  - H2: Głębokie sygnały rankingowe
  - H2: Pokrycie raportu próbnego QA w cieniu
  - H2: Harmonogram
  - H2: Szybki start
  - H2: Polecenie ukośnikowe
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
  - H2: GitHub dispatch
  - H2: Lokalne CLI
  - H2: Tryby Hydrate
  - H2: Interpretacja czasu
  - H2: Lista kontrolna dowodów
  - H2: Obsługa awarii
  - H2: Powiązane

## concepts/mantis.md

- Ścieżka: /concepts/mantis
- Nagłówki:
  - H2: Cele
  - H2: Poza zakresem celów
  - H2: Własność
  - H2: Kształt polecenia
  - H2: Cykl życia uruchomienia
  - H2: Discord MVP
  - H2: Istniejące elementy QA
  - H2: Model dowodów
  - H2: Przeglądarka i VNC
  - H2: Maszyny
  - H2: Sekrety
  - H2: Artefakty GitHub i komentarze PR
  - H2: Prywatne uwagi dotyczące wdrożenia
  - H2: Dodawanie scenariusza
  - H2: Rozszerzanie dostawców
  - H2: Otwarte pytania

## concepts/markdown-formatting.md

- Ścieżka: /concepts/markdown-formatting
- Nagłówki:
  - H2: Cele
  - H2: Potok
  - H2: Przykład IR
  - H2: Gdzie jest używany
  - H2: Obsługa tabel
  - H2: Reguły dzielenia na fragmenty
  - H2: Zasady dotyczące linków
  - H2: Spoilery
  - H2: Jak dodać lub zaktualizować formatter kanału
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
  - H2: Migracja istniejącej pamięci
  - H2: Jak to działa
  - H2: Honcho a wbudowana pamięć
  - H2: Polecenia CLI
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/memory-qmd.md

- Ścieżka: /concepts/memory-qmd
- Nagłówki:
  - H2: Co dodaje względem wbudowanej pamięci
  - H2: Pierwsze kroki
  - H3: Wymagania wstępne
  - H3: Włącz
  - H2: Jak działa sidecar
  - H2: Wydajność wyszukiwania i zgodność
  - H2: Nadpisania modeli
  - H2: Indeksowanie dodatkowych ścieżek
  - H2: Indeksowanie transkryptów sesji
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
  - H2: Wspomnienia wrażliwe na działania
  - H2: Wywnioskowane zobowiązania
  - H2: Narzędzia pamięci
  - H2: Towarzyszący Plugin Memory Wiki
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
  - H2: Poza zakresem celów
  - H2: Model referencyjny
  - H2: Model rdzenia
  - H2: Terminy wiadomości
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
  - H2: Relacja z wejściem kanału
  - H2: Bariery zgodności
  - H2: Przechowywanie wewnętrzne
  - H2: Klasy awarii
  - H2: Mapowanie kanałów
  - H2: Plan migracji
  - H3: Faza 1: wewnętrzna domena wiadomości
  - H3: Faza 2: trwały rdzeń wysyłania
  - H3: Faza 3: most wejścia kanału
  - H3: Faza 4: most przygotowanego dyspozytora
  - H3: Faza 5: ujednolicony cykl życia na żywo
  - H3: Faza 6: publiczne SDK
  - H3: Faza 7: wszyscy nadawcy
  - H3: Faza 8: usuń zgodność z nazwami tur
  - H2: Plan testów
  - H2: Otwarte pytania
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
  - H2: Polityka źródła wyboru
  - H2: Pamięć podręczna pomijania awarii uwierzytelniania
  - H2: Widoczne dla użytkownika powiadomienia o awaryjnym przełączeniu
  - H2: Przechowywanie uwierzytelniania (klucze + OAuth)
  - H2: Identyfikatory profili
  - H2: Kolejność rotacji
  - H3: Przywiązanie sesji (przyjazne dla pamięci podręcznej)
  - H3: Subskrypcja OpenAI Codex plus zapasowy klucz API
  - H2: Okresy wyciszenia
  - H2: Wyłączenia rozliczeniowe
  - H2: Awaryjne przełączenie modelu
  - H3: Reguły łańcucha kandydatów
  - H3: Które błędy przesuwają awaryjne przełączenie
  - H3: Pomijanie okresu wyciszenia a zachowanie sondowania
  - H2: Nadpisania sesji i przełączanie modelu na żywo
  - H2: Obserwowalność i podsumowania awarii
  - H2: Powiązana konfiguracja

## concepts/model-providers.md

- Ścieżka: /concepts/model-providers
- Nagłówki:
  - H2: Szybkie reguły
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
  - H3: Programowanie Kimi
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
  - H2: Źródło wyboru i zachowanie awaryjnego przełączania
  - H2: Szybka polityka modeli
  - H2: Wdrażanie (zalecane)
  - H2: Klucze konfiguracji (przegląd)
  - H3: Bezpieczne edycje listy dozwolonych
  - H2: „Model is not allowed” (i dlaczego odpowiedzi się zatrzymują)
  - H2: Przełączanie modeli w czacie (/model)
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
  - H2: Wyszukiwanie pamięci QMD między agentami
  - H2: Jeden numer WhatsApp, wiele osób (podział DM)
  - H2: Reguły routingu (jak wiadomości wybierają agenta)
  - H2: Wiele kont / numerów telefonów
  - H2: Pojęcia
  - H2: Przykłady platform
  - H2: Typowe wzorce
  - H2: Piaskownica i konfiguracja narzędzi na agenta
  - H2: Powiązane

## concepts/oauth.md

- Trasa: /concepts/oauth
- Nagłówki:
  - H2: Odbiornik tokenów (dlaczego istnieje)
  - H2: Przechowywanie (gdzie znajdują się tokeny)
  - H2: Zgodność ze starszym tokenem Anthropic
  - H2: Migracja Anthropic Claude CLI
  - H2: Wymiana OAuth (jak działa logowanie)
  - H3: setup-token Anthropic
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Odświeżanie + wygaśnięcie
  - H2: Wiele kont (profile) + routing
  - H3: 1) Zalecane: oddzielni agenci
  - H3: 2) Zaawansowane: wiele profili w jednym agencie
  - H2: Powiązane

## concepts/parallel-specialist-lanes.md

- Trasa: /concepts/parallel-specialist-lanes
- Nagłówki:
  - H2: Podstawowe zasady
  - H2: Zalecane wdrożenie
  - H3: Faza 1: kontrakty torów + ciężka praca w tle
  - H3: Faza 2: priorytet i kontrola współbieżności
  - H3: Faza 3: koordynator / kontroler ruchu
  - H2: Minimalny szablon kontraktu toru
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
  - H3: 1) Własny wpis Gateway
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
  - H2: Odniesienie QA dla Telegram, Discord, Slack i WhatsApp
  - H3: Współdzielone flagi CLI
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Konfiguracja obszaru roboczego Slack
  - H3: QA WhatsApp
  - H3: Pula poświadczeń Convex
  - H2: Seedy oparte na repozytorium
  - H2: Tory mocków dostawców
  - H2: Adaptery transportu
  - H3: Dodawanie kanału
  - H3: Nazwy pomocników scenariuszy
  - H2: Raportowanie
  - H2: Powiązana dokumentacja

## concepts/qa-matrix.md

- Trasa: /concepts/qa-matrix
- Nagłówki:
  - H2: Szybki start
  - H2: Co robi tor
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
  - H2: Przykład serii
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
  - H2: Nadpisania dla sesji
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
  - H2: Dlaczego to ważne
  - H2: Jak to działa
  - H2: Czyszczenie starszych obrazów
  - H2: Inteligentne ustawienia domyślne
  - H2: Włącz lub wyłącz
  - H2: Przycinanie a compaction
  - H2: Więcej informacji
  - H2: Powiązane

## concepts/session-tool.md

- Trasa: /concepts/session-tool
- Nagłówki:
  - H2: Dostępne narzędzia
  - H2: Wyświetlanie i odczytywanie sesji
  - H2: Wysyłanie wiadomości między sesjami
  - H2: Pomocniki statusu i orkiestracji
  - H2: Uruchamianie subagentów
  - H2: Widoczność
  - H2: Więcej informacji
  - H2: Powiązane

## concepts/session.md

- Trasa: /concepts/session
- Nagłówki:
  - H2: Jak routowane są wiadomości
  - H2: Izolacja DM
  - H3: Kanały połączone z Dock
  - H2: Cykl życia sesji
  - H2: Gdzie znajduje się stan
  - H2: Utrzymanie sesji
  - H2: Inspekcja sesji
  - H2: Więcej informacji
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
  - H2: Tempo między blokami podobne do ludzkiego
  - H2: "Streamuj fragmenty albo wszystko"
  - H2: Tryby streamingu podglądu
  - H3: Mapowanie kanału
  - H3: Zachowanie środowiska wykonawczego
  - H3: Aktualizacje podglądu postępu narzędzi
  - H3: Tor postępu komentarza
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
  - H2: Obecny pipeline
  - H2: Jak schematy są używane w czasie działania
  - H2: Przykładowe ramki
  - H2: Minimalny klient (Node.js)
  - H2: Przykład krok po kroku: dodanie metody od początku do końca
  - H2: Zachowanie codegen Swift
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
  - H3: Formy części
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
  - H2: Payloady narzędzi + konektory (surowy czas dostawcy + znormalizowane pola)
  - H2: Powiązana dokumentacja

## debug/node-issue.md

- Trasa: /debug/node-issue
- Nagłówki:
  - H1: Awaria Node + tsx "\\name is not a function"
  - H2: Podsumowanie
  - H2: Środowisko
  - H2: Repro (tylko Node)
  - H2: Minimalne repro w repozytorium
  - H2: Sprawdzenie wersji Node
  - H2: Uwagi / hipoteza
  - H2: Historia regresji
  - H2: Obejścia
  - H2: Odwołania
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
  - H2: Wyodrębnij logi
  - H2: Uwagi
  - H2: Powiązane

## gateway/authentication.md

- Trasa: /gateway/authentication
- Nagłówki:
  - H2: Zalecana konfiguracja (klucz API, dowolny dostawca)
  - H2: Anthropic: zgodność Claude CLI i tokenów
  - H2: Uwaga Anthropic
  - H2: Sprawdzanie statusu uwierzytelnienia modelu
  - H2: Zachowanie rotacji klucza API (gateway)
  - H2: Usuwanie uwierzytelnienia dostawcy podczas działania gateway
  - H2: Kontrola używanego poświadczenia
  - H3: OpenAI i starsze identyfikatory openai-codex
  - H3: Podczas logowania (CLI)
  - H3: Dla sesji (polecenie czatu)
  - H3: Dla agenta (nadpisanie CLI)
  - H2: Rozwiązywanie problemów
  - H3: "Nie znaleziono poświadczeń"
  - H3: Token wygasa/wygasł
  - H2: Powiązane

## gateway/background-process.md

- Trasa: /gateway/background-process
- Nagłówki:
  - H2: narzędzie exec
  - H2: Mostkowanie procesów potomnych
  - H2: narzędzie process
  - H2: Przykłady
  - H2: Powiązane

## gateway/bonjour.md

- Trasa: /gateway/bonjour
- Nagłówki:
  - H2: Szerokoobszarowy Bonjour (Unicast DNS-SD) przez Tailscale
  - H3: Konfiguracja Gateway (zalecana)
  - H3: Jednorazowa konfiguracja serwera DNS (host gateway)
  - H3: Ustawienia DNS Tailscale
  - H3: Bezpieczeństwo nasłuchiwania Gateway (zalecane)
  - H2: Co ogłasza
  - H2: Typy usług
  - H2: Klucze TXT (niesekretne wskazówki)
  - H2: Debugowanie w macOS
  - H2: Debugowanie w logach Gateway
  - H2: Debugowanie w węźle iOS
  - H2: Kiedy włączyć Bonjour
  - H2: Kiedy wyłączyć Bonjour
  - H2: Pułapki Docker
  - H2: Rozwiązywanie problemów z wyłączonym Bonjour
  - H2: Typowe tryby awarii
  - H2: Nazwy instancji z ucieczką (\032)
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
  - H2: Szybki start przyjazny dla początkujących
  - H2: Używanie jako fallback
  - H2: Omówienie konfiguracji
  - H3: Przykładowa konfiguracja
  - H2: Jak to działa
  - H2: Sesje
  - H2: Prelude fallback z sesji claude-cli
  - H2: Obrazy (przekazywanie)
  - H2: Wejścia / wyjścia
  - H2: Domyślne (własność pluginu)
  - H2: Domyślne należące do pluginu
  - H2: Własność natywnej compaction
  - H2: Nakładki MCP pakietu
  - H2: Limit historii reseed
  - H2: Ograniczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/config-agents.md

- Trasa: /gateway/config-agents
- Nagłówki:
  - H2: Domyślne ustawienia agentów
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Nadpisania profilu bootstrapu dla agenta
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
  - H3: Polityka środowiska wykonawczego
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming bloków
  - H3: Wskaźniki pisania
  - H3: agents.defaults.sandbox
  - H3: agents.list (nadpisania dla agentów)
  - H2: Routing wieloagentowy
  - H3: Pola dopasowania wiązania
  - H3: Profile dostępu dla agentów
  - H2: Sesja
  - H2: Wiadomości
  - H3: Prefiks odpowiedzi
  - H3: Reakcja potwierdzenia
  - H3: Debounce przychodzących
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: Powiązane

## gateway/config-channels.md

- Trasa: /gateway/config-channels
- Nagłówki:
  - H2: Kanały
  - H3: Dostęp do DM i grup
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
  - H3: Inne kanały Plugin
  - H3: Bramkowanie wzmianek na czacie grupowym
  - H4: Limity historii DM
  - H4: Tryb czatu ze sobą
  - H3: Polecenia (obsługa poleceń czatu)
  - H2: Powiązane

## gateway/config-tools.md

- Trasa: /gateway/config-tools
- Nagłówki:
  - H2: Narzędzia
  - H3: Profile narzędzi
  - H3: Grupy narzędzi
  - H3: Narzędzia MCP i Plugin w zasadach narzędzi piaskownicy
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
  - H2: Dostawcy niestandardowi i bazowe adresy URL
  - H3: Szczegóły pól dostawcy
  - H3: Przykłady dostawców
  - H2: Powiązane

## gateway/configuration-examples.md

- Trasa: /gateway/configuration-examples
- Nagłówki:
  - H2: Szybki start
  - H3: Absolutne minimum
  - H3: Zalecana konfiguracja początkowa
  - H2: Rozszerzony przykład (główne opcje)
  - H3: Dowiązane symbolicznie siostrzane repozytorium Skills
  - H2: Typowe wzorce
  - H3: Wspólna baza Skills z jednym nadpisaniem
  - H3: Konfiguracja wieloplatformowa
  - H3: Automatyczne zatwierdzanie zaufanej sieci węzłów
  - H3: Bezpieczny tryb DM (wspólna skrzynka odbiorcza / DM wielu użytkowników)
  - H3: Klucz API Anthropic + awaryjne MiniMax
  - H3: Bot roboczy (ograniczony dostęp)
  - H3: Tylko modele lokalne
  - H2: Wskazówki
  - H2: Powiązane

## gateway/configuration-reference.md

- Trasa: /gateway/configuration-reference
- Nagłówki:
  - H2: Kanały
  - H2: Domyślne ustawienia agentów, wielu agentów, sesje i wiadomości
  - H2: Narzędzia i dostawcy niestandardowi
  - H2: Modele
  - H2: MCP
  - H2: Skills
  - H2: Pluginy
  - H3: Konfiguracja Plugin uprzęży Codex
  - H2: Zobowiązania
  - H2: Przeglądarka
  - H2: UI
  - H2: Gateway
  - H3: Punkty końcowe zgodne z OpenAI
  - H3: Izolacja wielu instancji
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooki
  - H3: Integracja z Gmail
  - H2: Host Plugin canvas
  - H2: Wykrywanie
  - H3: mDNS (Bonjour)
  - H3: Szeroki obszar (DNS-SD)
  - H2: Środowisko
  - H3: env (wbudowane zmienne środowiskowe)
  - H3: Podstawianie zmiennych środowiskowych
  - H2: Sekrety
  - H3: SecretRef
  - H3: Obsługiwany zakres poświadczeń
  - H3: Konfiguracja dostawców sekretów
  - H2: Przechowywanie auth
  - H3: auth.cooldowns
  - H2: Logowanie
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
  - H2: Dołączenia konfiguracji ($include)
  - H2: Powiązane

## gateway/configuration.md

- Trasa: /gateway/configuration
- Nagłówki:
  - H2: Minimalna konfiguracja
  - H2: Edytowanie konfiguracji
  - H2: Ścisła walidacja
  - H2: Typowe zadania
  - H2: Gorące przeładowanie konfiguracji
  - H3: Tryby przeładowania
  - H3: Co stosuje się na gorąco, a co wymaga restartu
  - H3: Planowanie przeładowania
  - H2: RPC konfiguracji (aktualizacje programowe)
  - H2: Zmienne środowiskowe
  - H2: Pełna dokumentacja referencyjna
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
  - H2: Dlaczego zachowujemy zarówno tryb bezpośredni, jak i SSH
  - H2: Wejścia wykrywania (jak klienci dowiadują się, gdzie jest Gateway)
  - H3: 1) Wykrywanie Bonjour / DNS-SD
  - H4: Szczegóły sygnału usługi
  - H3: 2) Tailnet (między sieciami)
  - H3: 3) Ręczny cel / SSH
  - H2: Wybór transportu (zasady klienta)
  - H2: Parowanie + auth (transport bezpośredni)
  - H2: Odpowiedzialności według komponentu
  - H2: Powiązane

## gateway/doctor.md

- Trasa: /gateway/doctor
- Nagłówki:
  - H2: Szybki start
  - H3: Tryby headless i automatyzacji
  - H2: Tryb lint tylko do odczytu
  - H2: Co robi (podsumowanie)
  - H2: Uzupełnianie i reset UI Dreams
  - H2: Szczegółowe zachowanie i uzasadnienie
  - H2: Powiązane

## gateway/external-apps.md

- Trasa: /gateway/external-apps
- Nagłówki:
  - H2: Co jest dostępne dzisiaj
  - H2: Zalecana ścieżka
  - H2: Kod aplikacji a kod Plugin
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
  - H3: Przykłady konfiguracji usług monitorowania
  - H2: Gdy coś zawiedzie
  - H2: Dedykowane polecenie "health"
  - H2: Powiązane

## gateway/heartbeat.md

- Trasa: /gateway/heartbeat
- Nagłówki:
  - H2: Szybki start (dla początkujących)
  - H2: Ustawienia domyślne
  - H2: Do czego służy prompt Heartbeat
  - H2: Kontrakt odpowiedzi
  - H2: Konfiguracja
  - H3: Zakres i pierwszeństwo
  - H3: Heartbeat dla poszczególnych agentów
  - H3: Przykład aktywnych godzin
  - H3: Konfiguracja 24/7
  - H3: Przykład wielu kont
  - H3: Uwagi z praktyki
  - H2: Zachowanie dostarczania
  - H2: Kontrole widoczności
  - H3: Co robi każda flaga
  - H3: Przykłady dla kanału i konta
  - H3: Typowe wzorce
  - H2: HEARTBEAT.md (opcjonalne)
  - H3: Bloki tasks:
  - H3: Czy agent może aktualizować HEARTBEAT.md?
  - H2: Ręczne wybudzenie (na żądanie)
  - H2: Dostarczanie rozumowania (opcjonalne)
  - H2: Świadomość kosztów
  - H2: Przepełnienie kontekstu po Heartbeat
  - H2: Powiązane

## gateway/index.md

- Trasa: /gateway
- Nagłówki:
  - H2: 5-minutowy lokalny start
  - H2: Model uruchomieniowy
  - H2: Punkty końcowe zgodne z OpenAI
  - H3: Pierwszeństwo portu i wiązania
  - H3: Tryby gorącego przeładowania
  - H2: Zestaw poleceń operatora
  - H2: Wiele bram Gateway (ten sam host)
  - H2: Dostęp zdalny
  - H2: Nadzór i cykl życia usługi
  - H2: Szybka ścieżka profilu deweloperskiego
  - H2: Szybka dokumentacja protokołu (widok operatora)
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
  - H2: Minimalny sprzęt
  - H2: Wybierz backend
  - H2: Zalecane: LM Studio + duży model lokalny (Responses API)
  - H3: Konfiguracja hybrydowa: hostowany podstawowy, lokalny awaryjny
  - H3: Najpierw lokalnie z hostowaną siatką bezpieczeństwa
  - H3: Hosting regionalny / trasowanie danych
  - H2: Inne lokalne proxy zgodne z OpenAI
  - H2: Mniejsze lub bardziej restrykcyjne backendy
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/logging.md

- Trasa: /gateway/logging
- Nagłówki:
  - H1: Logowanie
  - H2: Logger oparty na plikach
  - H2: Przechwytywanie konsoli
  - H2: Redakcja
  - H2: Logi WebSocket Gateway
  - H3: Styl logów WS
  - H2: Formatowanie konsoli (logowanie podsystemów)
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
  - H2: Uwagi dotyczące przeglądarki/CDP (częsta pułapka)
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
  - H2: Lista modeli i trasowanie agentów
  - H2: Strumieniowanie (SSE)
  - H2: Kontrakt narzędzi czatu
  - H3: Obsługiwane pola żądania
  - H3: Nieobsługiwane warianty
  - H3: Kształt odpowiedzi narzędzia bez strumieniowania
  - H3: Kształt odpowiedzi narzędzia ze strumieniowaniem
  - H3: Pętla kontynuacji narzędzia
  - H2: Szybka konfiguracja Open WebUI
  - H2: Przykłady
  - H2: Powiązane

## gateway/openresponses-http-api.md

- Trasa: /gateway/openresponses-http-api
- Nagłówki:
  - H2: Uwierzytelnianie, bezpieczeństwo i trasowanie
  - H2: Zachowanie sesji
  - H2: Kształt żądania (obsługiwany)
  - H2: Elementy (wejście)
  - H3: message
  - H3: functioncalloutput (narzędzia oparte na turach)
  - H3: reasoning i itemreference
  - H2: Narzędzia (narzędzia funkcji po stronie klienta)
  - H2: Obrazy (inputimage)
  - H2: Pliki (inputfile)
  - H2: Limity plików i obrazów (konfiguracja)
  - H2: Strumieniowanie (SSE)
  - H2: Użycie
  - H2: Błędy
  - H2: Przykłady
  - H2: Powiązane

## gateway/openshell.md

- Trasa: /gateway/openshell
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybki start
  - H2: Tryby przestrzeni roboczej
  - H3: mirror
  - H3: remote
  - H3: Wybór trybu
  - H2: Dokumentacja konfiguracji
  - H2: Przykłady
  - H3: Minimalna konfiguracja zdalna
  - H3: Tryb mirror z GPU
  - H3: OpenShell dla poszczególnych agentów z niestandardowym Gateway
  - H2: Zarządzanie cyklem życia
  - H3: Kiedy odtworzyć
  - H2: Wzmacnianie bezpieczeństwa
  - H2: Obecne ograniczenia
  - H2: Jak to działa
  - H2: Powiązane

## gateway/opentelemetry.md

- Trasa: /gateway/opentelemetry
- Nagłówki:
  - H2: Jak to łączy się w całość
  - H2: Szybki start
  - H2: Eksportowane sygnały
  - H2: Dokumentacja konfiguracji
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
  - H3: Wykonanie narzędzia
  - H3: Exec
  - H3: Wewnętrzna diagnostyka (pamięć i pętla narzędzi)
  - H2: Eksportowane przedziały
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
  - H2: Auth z współdzielonym sekretem

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
  - H2: Automatyczne zatwierdzanie urządzeń trusted-CIDR
  - H2: Automatyczne zatwierdzanie aktualizacji metadanych
  - H2: Pomocniki parowania QR
  - H2: Lokalność i przekazywane nagłówki
  - H2: Przechowywanie (lokalne, prywatne)
  - H2: Zachowanie transportu
  - H2: Powiązane

## gateway/prometheus.md

- Trasa: /gateway/prometheus
- Nagłówki:
  - H2: Szybki start
  - H2: Eksportowane metryki
  - H2: Zasady etykiet
  - H2: Receptury PromQL
  - H2: Wybór między eksportem Prometheus i OpenTelemetry
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/protocol.md

- Trasa: /gateway/protocol
- Nagłówki:
  - H2: Transport
  - H2: Uzgadnianie (połączenie)
  - H3: Przykład Node
  - H2: Ramkowanie
  - H2: Role + zakresy
  - H3: Role
  - H3: Zakresy (operator)
  - H3: Możliwości/polecenia/uprawnienia (węzeł)
  - H2: Obecność
  - H3: Zdarzenie aktywności węzła w tle
  - H2: Zakresowanie zdarzeń rozgłoszeniowych
  - H2: Typowe rodziny metod RPC
  - H3: Typowe rodziny zdarzeń
  - H3: Metody pomocnicze węzła
  - H3: RPC rejestru zadań
  - H3: Metody pomocnicze operatora
  - H3: Widoki models.list
  - H2: Zatwierdzenia exec
  - H2: Awaryjne dostarczanie agentów
  - H2: Wersjonowanie
  - H3: Stałe klienta
  - H2: Auth
  - H2: Tożsamość urządzenia + parowanie
  - H3: Diagnostyka migracji auth urządzenia
  - H2: TLS + pinning
  - H2: Zakres
  - H2: Powiązane

## gateway/remote-gateway-readme.md

- Trasa: /gateway/remote-gateway-readme
- Nagłówki:
  - H1: Uruchamianie OpenClaw.app ze zdalnym Gateway
  - H2: Omówienie
  - H2: Szybka konfiguracja
  - H3: Krok 1: dodaj konfigurację SSH
  - H3: Krok 2: skopiuj klucz SSH
  - H3: Krok 3: skonfiguruj uwierzytelnianie zdalnego Gateway
  - H3: Krok 4: uruchom tunel SSH
  - H3: Krok 5: uruchom ponownie OpenClaw.app
  - H2: Automatyczne uruchamianie tunelu przy logowaniu
  - H3: Utwórz plik PLIST
  - H3: Załaduj agenta LaunchAgent
  - H2: Rozwiązywanie problemów
  - H2: Jak to działa
  - H2: Powiązane

## gateway/remote.md

- Trasa: /gateway/remote
- Nagłówki:
  - H2: Główna idea
  - H2: Typowe konfiguracje VPN i tailnet
  - H3: Stale działający Gateway w Twoim tailnet
  - H3: Komputer domowy uruchamia Gateway
  - H3: Laptop uruchamia Gateway
  - H2: Przepływ poleceń (co działa gdzie)
  - H2: Tunel SSH (CLI + narzędzia)
  - H2: Zdalne wartości domyślne CLI
  - H2: Priorytet poświadczeń
  - H2: Zdalny dostęp do interfejsu czatu
  - H2: Tryb zdalny aplikacji macOS
  - H2: Reguły bezpieczeństwa (zdalnie/VPN)
  - H3: macOS: trwały tunel SSH przez LaunchAgent
  - H4: Krok 1: dodaj konfigurację SSH
  - H4: Krok 2: skopiuj klucz SSH (jednorazowo)
  - H4: Krok 3: skonfiguruj token Gateway
  - H4: Krok 4: utwórz LaunchAgent
  - H4: Krok 5: załaduj LaunchAgent
  - H4: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Trasa: /gateway/sandbox-vs-tool-policy-vs-elevated
- Nagłówki:
  - H2: Szybkie debugowanie
  - H2: Piaskownica: gdzie działają narzędzia
  - H3: Montowania bind (szybka kontrola bezpieczeństwa)
  - H2: Zasady narzędzi: które narzędzia istnieją/są wywoływalne
  - H3: Grupy narzędzi (skróty)
  - H2: Podwyższone uprawnienia: tylko exec „uruchom na hoście”
  - H2: Typowe poprawki „więzienia piaskownicy”
  - H3: „Narzędzie X zablokowane przez zasady narzędzi piaskownicy”
  - H3: „Myślałem, że to main, dlaczego jest w piaskownicy?”
  - H2: Powiązane

## gateway/sandboxing.md

- Trasa: /gateway/sandboxing
- Nagłówki:
  - H2: Co trafia do piaskownicy
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
  - H2: Zasady narzędzi i furtki awaryjne
  - H2: Nadpisania dla wielu agentów
  - H2: Minimalny przykład włączenia
  - H2: Powiązane

## gateway/secrets-plan-contract.md

- Trasa: /gateway/secrets-plan-contract
- Nagłówki:
  - H2: Kształt pliku planu
  - H2: Upserty i usunięcia dostawców
  - H2: Obsługiwany zakres celu
  - H2: Zachowanie typu celu
  - H2: Reguły walidacji ścieżek
  - H2: Zachowanie przy niepowodzeniu
  - H2: Zachowanie zgody dostawcy exec
  - H2: Uwagi o zakresie środowiska uruchomieniowego i audytu
  - H2: Kontrole operatora
  - H2: Powiązana dokumentacja

## gateway/secrets.md

- Trasa: /gateway/secrets
- Nagłówki:
  - H2: Cele i model środowiska uruchomieniowego
  - H2: Granica dostępu agenta
  - H2: Filtrowanie aktywnej powierzchni
  - H2: Diagnostyka powierzchni uwierzytelniania Gateway
  - H2: Kontrola wstępna referencji wdrożeniowych
  - H2: Kontrakt SecretRef
  - H2: Konfiguracja dostawcy
  - H2: Klucze API oparte na plikach
  - H2: Przykłady integracji exec
  - H2: Zmienne środowiskowe serwera MCP
  - H2: Materiał uwierzytelniania SSH piaskownicy
  - H2: Obsługiwana powierzchnia poświadczeń
  - H2: Wymagane zachowanie i priorytet
  - H2: Wyzwalacze aktywacji
  - H2: Sygnały degradacji i odzyskania
  - H2: Rozwiązywanie ścieżki polecenia
  - H2: Przepływ pracy audytu i konfiguracji
  - H2: Jednokierunkowa polityka bezpieczeństwa
  - H2: Uwagi o zgodności starszego uwierzytelniania
  - H2: Uwaga o interfejsie Web UI
  - H2: Powiązane

## gateway/security/audit-checks.md

- Trasa: /gateway/security/audit-checks
- Nagłówki:
  - H2: Powiązane

## gateway/security/exposure-runbook.md

- Trasa: /gateway/security/exposure-runbook
- Nagłówki:
  - H2: Wybierz wzorzec ekspozycji
  - H2: Inwentaryzacja przedwdrożeniowa
  - H2: Kontrole bazowe
  - H2: Minimalna bezpieczna baza
  - H2: Ekspozycja DM i grup
  - H2: Kontrole reverse proxy
  - H2: Przegląd narzędzi i piaskownicy
  - H2: Walidacja po zmianie
  - H2: Plan wycofania
  - H2: Lista kontrolna przeglądu

## gateway/security/index.md

- Trasa: /gateway/security
- Nagłówki:
  - H2: Najpierw zakres: model bezpieczeństwa osobistego asystenta
  - H2: Szybka kontrola: openclaw security audit
  - H3: Blokada zależności opublikowanego pakietu
  - H3: Wdrożenie i zaufanie do hosta
  - H3: Bezpieczne operacje na plikach
  - H3: Współdzielony obszar roboczy Slack: realne ryzyko
  - H3: Agent współdzielony w firmie: akceptowalny wzorzec
  - H2: Koncepcja zaufania do Gateway i Node
  - H2: Macierz granic zaufania
  - H2: Nie są podatnościami z założenia
  - H2: Wzmocniona baza w 60 sekund
  - H2: Szybka reguła dla współdzielonej skrzynki odbiorczej
  - H2: Model widoczności kontekstu
  - H2: Co sprawdza audyt (wysoki poziom)
  - H2: Mapa przechowywania poświadczeń
  - H2: Lista kontrolna audytu bezpieczeństwa
  - H2: Słownik audytu bezpieczeństwa
  - H2: Control UI przez HTTP
  - H2: Podsumowanie niebezpiecznych lub ryzykownych flag
  - H2: Konfiguracja reverse proxy
  - H2: Uwagi o HSTS i pochodzeniu
  - H2: Lokalne dzienniki sesji znajdują się na dysku
  - H2: Wykonywanie na Node (system.run)
  - H2: Dynamiczne Skills (obserwator / zdalne Node)
  - H2: Model zagrożeń
  - H2: Podstawowa koncepcja: kontrola dostępu przed inteligencją
  - H2: Model autoryzacji poleceń
  - H2: Ryzyko narzędzi płaszczyzny sterowania
  - H2: Plugins
  - H2: Model dostępu DM: parowanie, lista dozwolonych, otwarte, wyłączone
  - H2: Izolacja sesji DM (tryb wielu użytkowników)
  - H3: Bezpieczny tryb DM (zalecany)
  - H2: Listy dozwolonych dla DM i grup
  - H2: Prompt injection (czym jest i dlaczego ma znaczenie)
  - H2: Sanityzacja specjalnych tokenów w treściach zewnętrznych
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
  - H3: Zablokuj WebSocket Gateway (lokalne uwierzytelnianie)
  - H3: Nagłówki tożsamości Tailscale Serve
  - H3: Sterowanie przeglądarką przez host Node (zalecane)
  - H3: Sekrety na dysku
  - H3: Pliki .env obszaru roboczego
  - H3: Dzienniki i transkrypty (redakcja i retencja)
  - H3: DM: domyślne parowanie
  - H3: Grupy: wymagaj wzmianki wszędzie
  - H3: Oddzielne numery (WhatsApp, Signal, Telegram)
  - H3: Tryb tylko do odczytu (przez piaskownicę i narzędzia)
  - H3: Bezpieczna baza (kopiuj/wklej)
  - H2: Piaskownica (zalecana)
  - H3: Zabezpieczenie delegowania do podagentów
  - H2: Ryzyka sterowania przeglądarką
  - H3: Polityka SSRF przeglądarki (domyślnie rygorystyczna)
  - H2: Profile dostępu per agent (wielu agentów)
  - H3: Przykład: pełny dostęp (bez piaskownicy)
  - H3: Przykład: narzędzia tylko do odczytu + obszar roboczy tylko do odczytu
  - H3: Przykład: brak dostępu do systemu plików/powłoki (wiadomości dostawcy dozwolone)
  - H2: Reakcja na incydent
  - H3: Ogranicz
  - H3: Rotuj (zakładaj kompromitację, jeśli sekrety wyciekły)
  - H3: Audytuj
  - H3: Zbierz do raportu
  - H2: Skanowanie sekretów
  - H2: Zgłaszanie problemów z bezpieczeństwem

## gateway/security/secure-file-operations.md

- Trasa: /gateway/security/secure-file-operations
- Nagłówki:
  - H2: Domyślnie: brak pomocnika Python
  - H2: Co pozostaje chronione bez Python
  - H2: Co dodaje Python
  - H2: Wskazówki dla Plugin i rdzenia

## gateway/security/shrinkwrap.md

- Trasa: /gateway/security/shrinkwrap
- Nagłówki:
  - H2: Prosta wersja
  - H2: Dlaczego OpenClaw tego używa
  - H2: Szczegóły techniczne

## gateway/tailscale.md

- Trasa: /gateway/tailscale
- Nagłówki:
  - H2: Tryby
  - H2: Uwierzytelnianie
  - H2: Przykłady konfiguracji
  - H3: Tylko tailnet (Serve)
  - H3: Tylko tailnet (bind do adresu IP tailnet)
  - H3: Internet publiczny (Funnel + współdzielone hasło)
  - H2: Przykłady CLI
  - H2: Uwagi
  - H2: Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)
  - H2: Wymagania wstępne i limity Tailscale
  - H2: Dowiedz się więcej
  - H2: Powiązane

## gateway/tools-invoke-http-api.md

- Trasa: /gateway/tools-invoke-http-api
- Nagłówki:
  - H2: Uwierzytelnianie
  - H2: Granica bezpieczeństwa (ważne)
  - H2: Treść żądania
  - H2: Zachowanie zasad + routingu
  - H2: Odpowiedzi
  - H2: Przykład
  - H2: Powiązane

## gateway/troubleshooting.md

- Trasa: /gateway/troubleshooting
- Nagłówki:
  - H2: Drabina poleceń
  - H2: Po aktualizacji
  - H2: Rozdwojone instalacje i zabezpieczenie nowszej konfiguracji
  - H2: Niezgodność protokołu po wycofaniu
  - H2: Symlink Skill pominięty jako wyjście poza ścieżkę
  - H2: Anthropic 429 wymaga dodatkowego użycia dla długiego kontekstu
  - H2: Odpowiedzi zablokowane przez upstream 403
  - H2: Lokalny backend zgodny z OpenAI przechodzi bezpośrednie próby, ale uruchomienia agenta zawodzą
  - H2: Brak odpowiedzi
  - H2: Łączność Control UI panelu
  - H3: Szybka mapa kodów szczegółów uwierzytelniania
  - H2: Usługa Gateway nie działa
  - H2: Gateway na macOS po cichu przestaje odpowiadać, a potem wznawia po dotknięciu panelu
  - H2: Gateway kończy działanie przy wysokim użyciu pamięci
  - H2: Gateway odrzucił nieprawidłową konfigurację
  - H2: Ostrzeżenia sondy Gateway
  - H2: Kanał połączony, wiadomości nie przepływają
  - H2: Dostarczanie Cron i Heartbeat
  - H2: Node sparowany, narzędzie zawodzi
  - H2: Narzędzie przeglądarki zawodzi
  - H2: Jeśli po aktualizacji coś nagle się zepsuło
  - H2: Powiązane

## gateway/trusted-proxy-auth.md

- Trasa: /gateway/trusted-proxy-auth
- Nagłówki:
  - H2: Kiedy używać
  - H2: Kiedy NIE używać
  - H2: Jak to działa
  - H2: Zachowanie parowania Control UI
  - H2: Konfiguracja
  - H3: Referencja konfiguracji
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

- Trasa: /help/debugging
- Nagłówki:
  - H2: Nadpisania debugowania środowiska uruchomieniowego
  - H2: Dane wyjściowe śladu sesji
  - H2: Ślad cyklu życia Plugin
  - H2: Profilowanie uruchamiania CLI i poleceń
  - H2: Tryb obserwacji Gateway
  - H2: Profil deweloperski + deweloperski Gateway (--dev)
  - H2: Surowe rejestrowanie strumienia (OpenClaw)
  - H2: Surowe rejestrowanie fragmentów zgodnych z OpenAI
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Debugowanie w VSCode
  - H3: Konfiguracja
  - H3: Uwagi
  - H2: Powiązane

## help/environment.md

- Trasa: /help/environment
- Nagłówki:
  - H2: Priorytet (najwyższy → najniższy)
  - H2: Poświadczenia dostawcy i .env obszaru roboczego
  - H2: Blok env konfiguracji
  - H2: Import env powłoki
  - H2: Migawki powłoki exec
  - H2: Zmienne env wstrzykiwane przez środowisko uruchomieniowe
  - H2: Zmienne env interfejsu użytkownika
  - H2: Podstawianie zmiennych env w konfiguracji
  - H2: Odwołania do sekretów kontra ciągi ${ENV}
  - H2: Zmienne env związane ze ścieżkami
  - H2: Rejestrowanie
  - H3: OPENCLAWHOME
  - H2: Użytkownicy nvm: błędy TLS webfetch
  - H2: Starsze zmienne środowiskowe
  - H2: Powiązane

## help/faq-first-run.md

- Trasa: /help/faq-first-run
- Nagłówki:
  - H2: Szybki start i konfiguracja pierwszego uruchomienia
  - H2: Powiązane

## help/faq-models.md

- Trasa: /help/faq-models
- Nagłówki:
  - H2: Modele: wartości domyślne, wybór, aliasy, przełączanie
  - H2: Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”
  - H2: Profile uwierzytelniania: czym są i jak nimi zarządzać
  - H2: Powiązane

## help/faq.md

- Trasa: /help/faq
- Nagłówki:
  - H2: Pierwsze 60 sekund, jeśli coś jest zepsute
  - H2: Szybki start i konfiguracja pierwszego uruchomienia
  - H2: Czym jest OpenClaw?
  - H2: Skills i automatyzacja
  - H2: Piaskownica i pamięć
  - H2: Gdzie rzeczy znajdują się na dysku
  - H2: Podstawy konfiguracji
  - H2: Zdalne Gateway i Node
  - H2: Zmienne env i ładowanie .env
  - H2: Sesje i wiele czatów
  - H2: Modele, przełączanie awaryjne i profile uwierzytelniania
  - H2: Gateway: porty, „już działa” i tryb zdalny
  - H2: Rejestrowanie i debugowanie
  - H2: Multimedia i załączniki
  - H2: Bezpieczeństwo i kontrola dostępu
  - H2: Polecenia czatu, przerywanie zadań i „to się nie zatrzyma”
  - H2: Różne
  - H2: Powiązane

## help/index.md

- Trasa: /help
- Nagłówki:
  - H2: FAQ
  - H2: Diagnostyka
  - H2: Testowanie
  - H2: Społeczność i meta

## help/scripts.md

- Trasa: /help/scripts
- Nagłówki:
  - H2: Konwencje
  - H2: Skrypty monitorowania uwierzytelniania
  - H2: Pomocnik odczytu GitHub
  - H2: Podczas dodawania skryptów
  - H2: Powiązane

## help/testing-live.md

- Trasa: /help/testing-live
- Nagłówki:
  - H2: Live: lokalne polecenia smoke
  - H2: Live: przegląd możliwości węzła Android
  - H2: Live: smoke modelu (klucze profili)
  - H3: Warstwa 1: bezpośrednie uzupełnianie modelu (bez Gateway)
  - H3: Warstwa 2: Gateway + smoke agenta deweloperskiego (co faktycznie robi „@openclaw”)
  - H2: Live: smoke backendu CLI (Claude, Gemini lub inne lokalne CLI)
  - H2: Live: osiągalność proxy APNs HTTP/2
  - H2: Live: smoke bindowania ACP (/acp spawn ... --bind here)
  - H2: Live: smoke uprzęży serwera aplikacji Codex
  - H3: Zalecane receptury live
  - H2: Live: macierz modeli (co obejmujemy)
  - H3: Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)
  - H3: Punkt bazowy: wywoływanie narzędzi (Read + opcjonalnie Exec)
  - H3: Wizja: wysyłanie obrazu (załącznik → wiadomość multimodalna)
  - H3: Agregatory / alternatywne bramy
  - H2: Dane uwierzytelniające (nigdy nie commituj)
  - H2: Deepgram live (transkrypcja audio)
  - H2: BytePlus coding plan live
  - H2: ComfyUI workflow media live
  - H2: Generowanie obrazów live
  - H2: Generowanie muzyki live
  - H2: Generowanie wideo live
  - H2: Uprząż mediów live
  - H2: Powiązane

## help/testing-updates-plugins.md

- Trasa: /help/testing-updates-plugins
- Nagłówki:
  - H2: Co chronimy
  - H2: Lokalny dowód podczas developmentu
  - H2: Ścieżki Docker
  - H2: Akceptacja pakietu
  - H2: Domyślne ustawienie wydania
  - H2: Zgodność ze starszymi wersjami
  - H2: Dodawanie pokrycia
  - H2: Triage awarii

## help/testing.md

- Trasa: /help/testing
- Nagłówki:
  - H2: Szybki start
  - H2: Tymczasowe katalogi testowe
  - H2: Runnery specyficzne dla QA
  - H3: Wspólne dane uwierzytelniające Telegram przez Convex (v1)
  - H3: Dodawanie kanału do QA
  - H2: Zestawy testów (co uruchamia się gdzie)
  - H3: Jednostkowe / integracyjne (domyślne)
  - H3: Stabilność (Gateway)
  - H3: E2E (agregat repozytorium)
  - H3: E2E (smoke Gateway)
  - H3: E2E (zamockowana przeglądarka Control UI)
  - H3: E2E: smoke backendu OpenShell
  - H3: Live (prawdziwi dostawcy + prawdziwe modele)
  - H2: Który zestaw uruchomić?
  - H2: Testy live (dotykające sieci)
  - H2: Runnery Docker (opcjonalne kontrole „działa w Linuksie”)
  - H2: Kontrola poprawności dokumentacji
  - H2: Regresja offline (bezpieczna dla CI)
  - H2: Ewaluacje niezawodności agenta (Skills)
  - H2: Testy kontraktowe (kształt pluginu i kanału)
  - H3: Polecenia
  - H3: Kontrakty kanałów
  - H3: Kontrakty statusu dostawców
  - H3: Kontrakty dostawców
  - H3: Kiedy uruchamiać
  - H2: Dodawanie regresji (wskazówki)
  - H2: Powiązane

## help/troubleshooting.md

- Trasa: /help/troubleshooting
- Nagłówki:
  - H2: Pierwsze 60 sekund
  - H2: Asystent wydaje się ograniczony lub brakuje mu narzędzi
  - H2: Długi kontekst Anthropic 429
  - H2: Lokalny backend zgodny z OpenAI działa bezpośrednio, ale zawodzi w OpenClaw
  - H2: Instalacja Pluginu kończy się błędem z powodu brakujących rozszerzeń openclaw
  - H2: Polityka instalacji blokuje instalacje lub aktualizacje pluginów
  - H2: Plugin obecny, ale zablokowany przez podejrzaną własność
  - H2: Drzewo decyzyjne
  - H2: Powiązane

## index.md

- Trasa: /
- Nagłówki:
  - H1: OpenClaw 🦞
  - H2: Czym jest OpenClaw?
  - H2: Jak to działa
  - H2: Kluczowe możliwości
  - H2: Szybki start
  - H2: Panel
  - H2: Konfiguracja (opcjonalna)
  - H2: Zacznij tutaj
  - H2: Dowiedz się więcej

## install/ansible.md

- Trasa: /install/ansible
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

- Trasa: /install/azure
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

- Trasa: /install/bun
- Nagłówki:
  - H2: Instalacja
  - H2: Skrypty cyklu życia
  - H2: Zastrzeżenia
  - H2: Powiązane

## install/clawdock.md

- Trasa: /install/clawdock
- Nagłówki:
  - H2: Instalacja
  - H2: Co otrzymujesz
  - H3: Podstawowe operacje
  - H3: Dostęp do kontenera
  - H3: Web UI i parowanie
  - H3: Konfiguracja i utrzymanie
  - H3: Narzędzia
  - H2: Przebieg pierwszego uruchomienia
  - H2: Konfiguracja i sekrety
  - H2: Powiązane

## install/development-channels.md

- Trasa: /install/development-channels
- Nagłówki:
  - H2: Przełączanie kanałów
  - H2: Celowanie w jednorazową wersję lub tag
  - H2: Przebieg próbny
  - H2: Pluginy i kanały
  - H2: Sprawdzanie bieżącego statusu
  - H2: Najlepsze praktyki tagowania
  - H2: Dostępność aplikacji macOS
  - H2: Powiązane

## install/digitalocean.md

- Trasa: /install/digitalocean
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Trwałość i kopie zapasowe
  - H2: Wskazówki dla 1 GB RAM
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/docker-vm-runtime.md

- Trasa: /install/docker-vm-runtime
- Nagłówki:
  - H2: Wbuduj wymagane pliki binarne w obraz
  - H2: Zbuduj i uruchom
  - H2: Co gdzie jest utrwalane
  - H2: Aktualizacje
  - H2: Powiązane

## install/docker.md

- Trasa: /install/docker
- Nagłówki:
  - H2: Czy Docker jest dla mnie odpowiedni?
  - H2: Wymagania wstępne
  - H2: Konteneryzowany gateway
  - H3: Przepływ ręczny
  - H3: Zmienne środowiskowe
  - H3: Obserwowalność
  - H3: Kontrole zdrowia
  - H3: LAN vs loopback
  - H3: Lokalne dostawcy hosta
  - H3: Backend Claude CLI w Dockerze
  - H3: Bonjour / mDNS
  - H3: Przechowywanie i trwałość
  - H3: Pomocnicze skrypty powłoki (opcjonalne)
  - H3: Uruchamiasz na VPS?
  - H2: Piaskownica agenta
  - H3: Szybkie włączenie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/exe-dev.md

- Trasa: /install/exe-dev
- Nagłówki:
  - H2: Szybka ścieżka dla początkujących
  - H2: Czego potrzebujesz
  - H2: Automatyczna instalacja z Shelley
  - H2: Instalacja ręczna
  - H2: 1) Utwórz VM
  - H2: 2) Zainstaluj wymagania wstępne (na VM)
  - H2: 3) Zainstaluj OpenClaw
  - H2: 4) Skonfiguruj nginx jako proxy OpenClaw na port 8000
  - H2: 5) Uzyskaj dostęp do OpenClaw i nadaj uprawnienia
  - H2: Konfiguracja kanału zdalnego
  - H2: Dostęp zdalny
  - H2: Aktualizowanie
  - H2: Powiązane

## install/fly.md

- Trasa: /install/fly
- Nagłówki:
  - H2: Czego potrzebujesz
  - H2: Szybka ścieżka dla początkujących
  - H2: Rozwiązywanie problemów
  - H3: „Aplikacja nie nasłuchuje pod oczekiwanym adresem”
  - H3: Kontrole zdrowia nie powiodły się / odmowa połączenia
  - H3: OOM / Problemy z pamięcią
  - H3: Problemy z blokadą Gateway
  - H3: Konfiguracja nie jest odczytywana
  - H3: Zapisywanie konfiguracji przez SSH
  - H3: Stan nie jest utrwalany
  - H2: Aktualizacje
  - H3: Aktualizowanie polecenia maszyny
  - H2: Wdrożenie prywatne (utwardzone)
  - H3: Kiedy używać wdrożenia prywatnego
  - H3: Konfiguracja
  - H3: Dostęp do wdrożenia prywatnego
  - H3: Webhooki z wdrożeniem prywatnym
  - H3: Korzyści bezpieczeństwa
  - H2: Uwagi
  - H2: Koszt
  - H2: Następne kroki
  - H2: Powiązane

## install/gcp.md

- Trasa: /install/gcp
- Nagłówki:
  - H2: Co robimy (w prostych słowach)?
  - H2: Szybka ścieżka (doświadczeni operatorzy)
  - H2: Czego potrzebujesz
  - H2: Rozwiązywanie problemów
  - H2: Konta usług (najlepsza praktyka bezpieczeństwa)
  - H2: Następne kroki
  - H2: Powiązane

## install/hetzner.md

- Trasa: /install/hetzner
- Nagłówki:
  - H2: Cel
  - H2: Co robimy (w prostych słowach)?
  - H2: Szybka ścieżka (doświadczeni operatorzy)
  - H2: Czego potrzebujesz
  - H2: Infrastructure as Code (Terraform)
  - H2: Następne kroki
  - H2: Powiązane

## install/hostinger.md

- Trasa: /install/hostinger
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Opcja A: OpenClaw jednym kliknięciem
  - H2: Opcja B: OpenClaw na VPS
  - H2: Zweryfikuj konfigurację
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/index.md

- Trasa: /install
- Nagłówki:
  - H2: Wymagania systemowe
  - H2: Zalecane: skrypt instalatora
  - H2: Alternatywne metody instalacji
  - H3: Instalator z lokalnym prefiksem (install-cli.sh)
  - H3: npm, pnpm lub bun
  - H3: Ze źródeł
  - H3: Instalacja z checkoutu main GitHub
  - H3: Kontenery i menedżery pakietów
  - H2: Zweryfikuj instalację
  - H2: Hosting i wdrożenie
  - H2: Aktualizuj, migruj lub odinstaluj
  - H2: Rozwiązywanie problemów: nie znaleziono openclaw

## install/installer.md

- Trasa: /install/installer
- Nagłówki:
  - H2: Szybkie polecenia
  - H2: install.sh
  - H3: Przepływ (install.sh)
  - H3: Wykrywanie checkoutu źródłowego
  - H3: Przykłady (install.sh)
  - H2: install-cli.sh
  - H3: Przepływ (install-cli.sh)
  - H3: Przykłady (install-cli.sh)
  - H2: install.ps1
  - H3: Przepływ (install.ps1)
  - H3: Przykłady (install.ps1)
  - H2: CI i automatyzacja
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/kubernetes.md

- Trasa: /install/kubernetes
- Nagłówki:
  - H2: Dlaczego nie Helm?
  - H2: Czego potrzebujesz
  - H2: Szybki start
  - H2: Lokalne testowanie z Kind
  - H2: Krok po kroku
  - H3: 1) Wdróż
  - H3: 2) Uzyskaj dostęp do Gateway
  - H2: Co zostaje wdrożone
  - H2: Dostosowywanie
  - H3: Instrukcje agenta
  - H3: Konfiguracja Gateway
  - H3: Dodaj dostawców
  - H3: Niestandardowa przestrzeń nazw
  - H3: Niestandardowy obraz
  - H3: Udostępnij poza port-forward
  - H2: Wdróż ponownie
  - H2: Usuwanie
  - H2: Uwagi architektoniczne
  - H2: Struktura plików
  - H2: Powiązane

## install/macos-vm.md

- Trasa: /install/macos-vm
- Nagłówki:
  - H2: Zalecana opcja domyślna (większość użytkowników)
  - H2: Opcje VM macOS
  - H3: Lokalna VM na Macu Apple Silicon (Lume)
  - H3: Hostowani dostawcy Mac (chmura)
  - H2: Szybka ścieżka (Lume, doświadczeni użytkownicy)
  - H2: Czego potrzebujesz (Lume)
  - H2: 1) Zainstaluj Lume
  - H2: 2) Utwórz VM macOS
  - H2: 3) Ukończ Asystenta konfiguracji
  - H2: 4) Uzyskaj adres IP VM
  - H2: 5) Połącz się z VM przez SSH
  - H2: 6) Zainstaluj OpenClaw
  - H2: 7) Skonfiguruj kanały
  - H2: 8) Uruchom VM bez interfejsu graficznego
  - H2: Bonus: integracja iMessage
  - H2: Zapisz złoty obraz
  - H2: Działanie 24/7
  - H2: Rozwiązywanie problemów
  - H2: Powiązane dokumenty

## install/migrating-claude.md

- Trasa: /install/migrating-claude
- Nagłówki:
  - H2: Dwa sposoby importu
  - H2: Co zostaje zaimportowane
  - H2: Co pozostaje tylko w archiwum
  - H2: Wybór źródła
  - H2: Zalecany przepływ
  - H2: Obsługa konfliktów
  - H2: Dane wyjściowe JSON dla automatyzacji
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/migrating-hermes.md

- Trasa: /install/migrating-hermes
- Nagłówki:
  - H2: Dwa sposoby importu
  - H2: Co zostaje zaimportowane
  - H2: Co pozostaje tylko w archiwum
  - H2: Zalecany przepływ
  - H2: Obsługa konfliktów
  - H2: Sekrety
  - H2: Dane wyjściowe JSON dla automatyzacji
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/migrating.md

- Trasa: /install/migrating
- Nagłówki:
  - H2: Import z innego systemu agentowego
  - H2: Przenieś OpenClaw na nową maszynę
  - H3: Kroki migracji
  - H3: Typowe pułapki
  - H3: Lista kontrolna weryfikacji
  - H2: Uaktualnij plugin w miejscu
  - H2: Powiązane

## install/nix.md

- Trasa: /install/nix
- Nagłówki:
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Zachowanie runtime w trybie Nix
  - H3: Co zmienia się w trybie Nix
  - H3: Ścieżki konfiguracji i stanu
  - H3: Wykrywanie PATH usługi
  - H2: Powiązane

## install/node.md

- Trasa: /install/node
- Nagłówki:
  - H2: Sprawdź wersję
  - H2: Zainstaluj Node
  - H2: Rozwiązywanie problemów
  - H3: openclaw: command not found
  - H3: Błędy uprawnień przy npm install -g (Linux)
  - H2: Powiązane

## install/northflank.mdx

- Trasa: /install/northflank
- Nagłówki:
  - H1: Northflank
  - H2: Jak zacząć
  - H2: Co otrzymujesz
  - H2: Połącz kanał
  - H2: Następne kroki

## install/oracle.md

- Trasa: /install/oracle
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Zweryfikuj postawę bezpieczeństwa
  - H2: Uwagi dotyczące ARM
  - H2: Trwałość i kopie zapasowe
  - H2: Fallback: tunel SSH
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/podman.md

- Trasa: /install/podman
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybki start
  - H2: Podman i Tailscale
  - H2: Systemd (Quadlet, opcjonalnie)
  - H2: Konfiguracja, env i przechowywanie
  - H2: Przydatne polecenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/railway.mdx

- Trasa: /install/railway
- Nagłówki:
  - H1: Railway
  - H2: Szybka lista kontrolna (nowi użytkownicy)
  - H2: Wdrożenie jednym kliknięciem
  - H2: Co otrzymujesz
  - H2: Wymagane ustawienia Railway
  - H3: Sieć publiczna
  - H3: Wolumin (wymagany)
  - H3: Zmienne
  - H2: Połącz kanał
  - H2: Kopie zapasowe &amp; migracja
  - H2: Następne kroki

## install/raspberry-pi.md

- Ścieżka: /install/raspberry-pi
- Nagłówki:
  - H2: Zgodność sprzętu
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Wskazówki dotyczące wydajności
  - H2: Zalecana konfiguracja modelu
  - H2: Uwagi o plikach binarnych ARM
  - H2: Trwałość i kopie zapasowe
  - H2: Rozwiązywanie problemów
  - H2: Następne kroki
  - H2: Powiązane

## install/render.mdx

- Ścieżka: /install/render
- Nagłówki:
  - H1: Render
  - H2: Wymagania wstępne
  - H2: Wdrażanie za pomocą Render Blueprint
  - H2: Zrozumienie Blueprint
  - H2: Wybór planu
  - H2: Po wdrożeniu
  - H3: Dostęp do interfejsu sterowania
  - H2: Funkcje panelu Render
  - H3: Logi
  - H3: Dostęp do powłoki
  - H3: Zmienne środowiskowe
  - H3: Automatyczne wdrażanie
  - H2: Domena niestandardowa
  - H2: Skalowanie
  - H2: Kopie zapasowe i migracja
  - H2: Rozwiązywanie problemów
  - H3: Usługa nie uruchamia się
  - H3: Wolne zimne starty (warstwa bezpłatna)
  - H3: Utrata danych po ponownym wdrożeniu
  - H3: Niepowodzenia kontroli kondycji
  - H2: Następne kroki

## install/uninstall.md

- Ścieżka: /install/uninstall
- Nagłówki:
  - H2: Łatwa ścieżka (CLI nadal zainstalowany)
  - H2: Ręczne usunięcie usługi (CLI nie jest zainstalowany)
  - H3: macOS (launchd)
  - H3: Linux (jednostka użytkownika systemd)
  - H3: Windows (zaplanowane zadanie)
  - H2: Normalna instalacja a checkout źródeł
  - H3: Normalna instalacja (install.sh / npm / pnpm / bun)
  - H3: Checkout źródeł (git clone)
  - H2: Powiązane

## install/updating.md

- Ścieżka: /install/updating
- Nagłówki:
  - H2: Zalecane: openclaw update
  - H2: Przełączanie między instalacjami npm i git
  - H2: Alternatywa: ponowne uruchomienie instalatora
  - H2: Alternatywa: ręczne npm, pnpm lub bun
  - H3: Zaawansowane tematy instalacji npm
  - H2: Automatyczny aktualizator
  - H2: Po aktualizacji
  - H3: Uruchom doctor
  - H3: Uruchom ponownie Gateway
  - H3: Zweryfikuj
  - H2: Wycofanie
  - H3: Przypięcie wersji (npm)
  - H3: Przypięcie commita (źródło)
  - H2: Jeśli utkniesz
  - H2: Powiązane

## install/upstash.md

- Ścieżka: /install/upstash
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Utworzenie Box
  - H2: Połączenie przez tunel SSH
  - H2: Instalacja OpenClaw
  - H2: Uruchomienie onboardingu
  - H2: Uruchomienie Gateway
  - H2: Automatyczne ponowne uruchamianie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## logging.md

- Ścieżka: /logging
- Nagłówki:
  - H2: Gdzie znajdują się logi
  - H2: Jak czytać logi
  - H3: CLI: podgląd na żywo (zalecane)
  - H3: Interfejs sterowania (web)
  - H3: Logi tylko kanału
  - H2: Formaty logów
  - H3: Logi plikowe (JSONL)
  - H3: Wyjście konsoli
  - H3: Logi Gateway WebSocket
  - H2: Konfigurowanie logowania
  - H3: Poziomy logowania
  - H3: Ukierunkowana diagnostyka transportu modelu
  - H3: Korelacja śladów
  - H3: Rozmiar i czas wywołania modelu
  - H3: Style konsoli
  - H3: Redakcja
  - H2: Diagnostyka i OpenTelemetry
  - H2: Wskazówki dotyczące rozwiązywania problemów
  - H2: Powiązane

## maturity/scorecard.md

- Ścieżka: /maturity/scorecard
- Nagłówki:
  - H1: Karta wyników dojrzałości
  - H2: Do czego służy ta strona
  - H2: W skrócie
  - H2: Przedziały wyników
  - H2: Eksplorator powierzchni
  - H2: Podsumowanie dowodów QA
  - H3: Gotowość według obszaru

## maturity/taxonomy.md

- Ścieżka: /maturity/taxonomy
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

- Ścieżka: /network
- Nagłówki:
  - H2: Model rdzeniowy
  - H2: Parowanie + tożsamość
  - H2: Wykrywanie + transporty
  - H2: Węzły + transporty
  - H2: Bezpieczeństwo
  - H2: Powiązane

## nodes/audio.md

- Ścieżka: /nodes/audio
- Nagłówki:
  - H2: Co działa
  - H2: Automatyczne wykrywanie (domyślne)
  - H2: Przykłady konfiguracji
  - H3: Dostawca + awaryjny CLI (OpenAI + Whisper CLI)
  - H3: Tylko dostawca z bramkowaniem zakresu
  - H3: Tylko dostawca (Deepgram)
  - H3: Tylko dostawca (Mistral Voxtral)
  - H3: Tylko dostawca (SenseAudio)
  - H3: Odesłanie transkrypcji do czatu (opt-in)
  - H2: Uwagi i ograniczenia
  - H3: Obsługa środowiska proxy
  - H2: Wykrywanie wzmianek w grupach
  - H2: Pułapki
  - H2: Powiązane

## nodes/camera.md

- Ścieżka: /nodes/camera
- Nagłówki:
  - H2: Węzeł iOS
  - H3: Ustawienie użytkownika (domyślnie włączone)
  - H3: Polecenia (przez Gateway node.invoke)
  - H3: Wymóg działania na pierwszym planie
  - H3: Pomocnik CLI
  - H2: Węzeł Android
  - H3: Ustawienie użytkownika Android (domyślnie włączone)
  - H3: Uprawnienia
  - H3: Wymóg działania Android na pierwszym planie
  - H3: Polecenia Android (przez Gateway node.invoke)
  - H3: Ochrona payloadu
  - H2: Aplikacja macOS
  - H3: Ustawienie użytkownika (domyślnie wyłączone)
  - H3: Pomocnik CLI (wywołanie węzła)
  - H2: Bezpieczeństwo + praktyczne ograniczenia
  - H2: Wideo ekranu macOS (na poziomie OS)
  - H2: Powiązane

## nodes/images.md

- Ścieżka: /nodes/images
- Nagłówki:
  - H2: Cele
  - H2: Powierzchnia CLI
  - H2: Zachowanie kanału WhatsApp Web
  - H2: Pipeline automatycznej odpowiedzi
  - H2: Media przychodzące na polecenia
  - H2: Limity i błędy
  - H2: Uwagi dla testów
  - H2: Powiązane

## nodes/index.md

- Ścieżka: /nodes
- Nagłówki:
  - H2: Parowanie + status
  - H2: Zdalny host węzła (system.run)
  - H3: Co działa gdzie
  - H3: Uruchom host węzła (pierwszy plan)
  - H3: Zdalny Gateway przez tunel SSH (wiązanie loopback)
  - H3: Uruchom host węzła (usługa)
  - H3: Sparuj + nazwij
  - H3: Dodaj polecenia do listy dozwolonych
  - H3: Skieruj exec na węzeł
  - H3: Lokalne wnioskowanie modelu
  - H2: Wywoływanie poleceń
  - H2: Polityka poleceń
  - H2: Konfiguracja (openclaw.json)
  - H2: Zrzuty ekranu (snapshoty canvas)
  - H3: Kontrolki Canvas
  - H3: A2UI (Canvas)
  - H2: Zdjęcia + filmy (kamera węzła)
  - H2: Nagrania ekranu (węzły)
  - H2: Lokalizacja (węzły)
  - H2: SMS (węzły Android)
  - H2: Urządzenie Android + polecenia danych osobistych
  - H2: Polecenia systemowe (host węzła / węzeł Mac)
  - H2: Wiązanie węzła exec
  - H2: Mapa uprawnień
  - H2: Bezheadowy host węzła (wieloplatformowy)
  - H2: Tryb węzła Mac

## nodes/location-command.md

- Ścieżka: /nodes/location-command
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

- Ścieżka: /nodes/media-understanding
- Nagłówki:
  - H2: Cele
  - H2: Zachowanie wysokiego poziomu
  - H2: Przegląd konfiguracji
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
  - H2: Wyjście statusu
  - H2: Uwagi
  - H2: Powiązane

## nodes/talk.md

- Ścieżka: /nodes/talk
- Nagłówki:
  - H2: Zachowanie (macOS)
  - H2: Dyrektywy głosowe w odpowiedziach
  - H2: Konfiguracja (/.openclaw/openclaw.json)
  - H2: Interfejs macOS
  - H2: Interfejs Android
  - H2: Uwagi
  - H2: Powiązane

## nodes/troubleshooting.md

- Ścieżka: /nodes/troubleshooting
- Nagłówki:
  - H2: Drabinka poleceń
  - H2: Wymagania dotyczące pierwszego planu
  - H2: Macierz uprawnień
  - H2: Parowanie a zatwierdzenia
  - H2: Typowe kody błędów węzłów
  - H2: Szybka pętla odzyskiwania
  - H2: Powiązane

## nodes/voicewake.md

- Ścieżka: /nodes/voicewake
- Nagłówki:
  - H2: Pamięć masowa (host Gateway)
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

- Ścieżka: /openclaw-agent-runtime
- Nagłówki:
  - H2: Sprawdzanie typów i linting
  - H2: Uruchamianie testów Agent Runtime
  - H2: Testowanie ręczne
  - H2: Reset do czystego stanu
  - H2: Odwołania
  - H2: Powiązane

## perplexity.md

- Ścieżka: /perplexity
- Nagłówki:
  - H2: Powiązane

## plan/codex-context-engine-harness.md

- Ścieżka: /plan/codex-context-engine-harness
- Nagłówki:
  - H2: Status
  - H2: Cel
  - H2: Poza zakresem
  - H2: Obecna architektura
  - H2: Obecna luka
  - H2: Pożądane zachowanie
  - H2: Ograniczenia projektowe
  - H3: Codex app-server pozostaje kanoniczny dla natywnego stanu wątku
  - H3: Składanie silnika kontekstu musi być rzutowane na wejścia Codex
  - H3: Stabilność pamięci podręcznej promptów ma znaczenie
  - H3: Semantyka wyboru runtime się nie zmienia
  - H2: Plan implementacji
  - H3: 1. Wyeksportuj lub przenieś pomocniki prób silnika kontekstu wielokrotnego użytku
  - H3: 2. Dodaj pomocnik projekcji kontekstu Codex
  - H3: 3. Podłącz bootstrap przed startem wątku Codex
  - H3: 4. Podłącz assemble przed thread/start / thread/resume i turn/start
  - H3: 5. Zachowaj stabilne formatowanie pamięci podręcznej promptów
  - H3: 6. Podłącz post-turn po mirroringu transkrypcji
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
  - H2: Otwarte pytania
  - H2: Kryteria akceptacji

## plan/ui-channels.md

- Ścieżka: /plan/ui-channels
- Nagłówki:
  - H2: Status
  - H2: Problem
  - H2: Cele
  - H2: Poza zakresem
  - H2: Model docelowy
  - H2: Metadane dostarczania
  - H2: Kontrakt możliwości runtime
  - H2: Mapowanie kanałów
  - H2: Kroki refaktoryzacji
  - H2: Testy
  - H2: Otwarte pytania
  - H2: Powiązane

## platforms/android.md

- Ścieżka: /platforms/android
- Nagłówki:
  - H2: Migawka wsparcia
  - H2: Sterowanie systemem
  - H2: Runbook połączenia
  - H3: Wymagania wstępne
  - H3: 1) Uruchom Gateway
  - H3: 2) Zweryfikuj wykrywanie (opcjonalne)
  - H4: Wykrywanie Tailnet (Wiedeń ⇄ Londyn) przez unicast DNS-SD
  - H3: 3) Połącz z Android
  - H3: Sygnały aktywnej obecności
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

- Ścieżka: /platforms/digitalocean
- Nagłówki:
  - H2: Powiązane

## platforms/easyrunner.md

- Ścieżka: /platforms/easyrunner
- Nagłówki:
  - H2: Zanim zaczniesz
  - H2: Aplikacja Compose
  - H2: Skonfiguruj OpenClaw
  - H2: Zweryfikuj
  - H2: Aktualizacje i kopie zapasowe
  - H2: Rozwiązywanie problemów

## platforms/index.md

- Ścieżka: /platforms
- Nagłówki:
  - H2: Wybierz swój OS
  - H2: VPS i hosting
  - H2: Wspólne linki
  - H2: Instalacja usługi Gateway (CLI)
  - H2: Powiązane

## platforms/ios.md

- Ścieżka: /platforms/ios
- Nagłówki:
  - H2: Co robi
  - H2: Wymagania
  - H2: Szybki start (sparuj + połącz)
  - H2: Push oparty na przekaźniku dla oficjalnych buildów
  - H2: Sygnały aktywności w tle
  - H2: Uwierzytelnianie i przepływ zaufania
  - H2: Ścieżki wykrywania
  - H3: Bonjour (LAN)
  - H3: Tailnet (między sieciami)
  - H3: Ręczny host/port
  - H2: Canvas + A2UI
  - H2: Relacja z Computer Use
  - H3: Eval / snapshot Canvas
  - H2: Wybudzanie głosem + tryb rozmowy
  - H2: Typowe błędy
  - H2: Powiązane dokumenty

## platforms/linux.md

- Ścieżka: /platforms/linux
- Nagłówki:
  - H2: Szybka ścieżka dla początkujących (VPS)
  - H2: Instalacja
  - H2: Gateway
  - H2: Instalacja usługi Gateway (CLI)
  - H2: Sterowanie systemem (jednostka użytkownika systemd)
  - H2: Presja pamięci i zabicia OOM
  - H2: Powiązane

## platforms/mac/bundled-gateway.md

- Ścieżka: /platforms/mac/bundled-gateway
- Nagłówki:
  - H2: Automatyczna konfiguracja
  - H2: Ręczne odzyskiwanie
  - H2: Launchd (Gateway jako LaunchAgent)
  - H2: Zgodność wersji
  - H2: Katalog stanu w macOS
  - H2: Debugowanie łączności aplikacji
  - H2: Kontrola dymna
  - H2: Powiązane

## platforms/mac/canvas.md

- Ścieżka: /platforms/mac/canvas
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

- Ścieżka: /platforms/mac/child-process
- Nagłówki:
  - H2: Zachowanie domyślne (launchd)
  - H2: Niepodpisane buildy deweloperskie
  - H2: Tryb tylko dołączania
  - H2: Tryb zdalny
  - H2: Dlaczego preferujemy launchd
  - H2: Powiązane

## platforms/mac/dev-setup.md

- Ścieżka: /platforms/mac/dev-setup
- Nagłówki:
  - H1: Konfiguracja środowiska deweloperskiego macOS
  - H2: Wymagania wstępne
  - H2: 1. Zainstaluj zależności
  - H2: 2. Zbuduj i spakuj aplikację
  - H2: 3. Zainstaluj CLI i Gateway
  - H2: Rozwiązywanie problemów
  - H3: Kompilacja nie powiodła się: niezgodność łańcucha narzędzi lub SDK
  - H3: Aplikacja ulega awarii podczas przyznawania uprawnień
  - H3: Gateway pokazuje „Starting...” bez końca
  - H2: Powiązane

## platforms/mac/health.md

- Ścieżka: /platforms/mac/health
- Nagłówki:
  - H1: Kontrole stanu w macOS
  - H2: Pasek menu
  - H2: Ustawienia
  - H2: Jak działa sonda
  - H2: W razie wątpliwości
  - H2: Powiązane

## platforms/mac/icon.md

- Ścieżka: /platforms/mac/icon
- Nagłówki:
  - H1: Stany ikony paska menu
  - H2: Powiązane

## platforms/mac/logging.md

- Ścieżka: /platforms/mac/logging
- Nagłówki:
  - H1: Logowanie (macOS)
  - H2: Rotacyjny dziennik pliku diagnostycznego (panel debugowania)
  - H2: Prywatne dane ujednoliconego logowania w macOS
  - H2: Włącz dla OpenClaw (ai.openclaw)
  - H2: Wyłącz po debugowaniu
  - H2: Powiązane

## platforms/mac/menu-bar.md

- Ścieżka: /platforms/mac/menu-bar
- Nagłówki:
  - H2: Co jest wyświetlane
  - H2: Model stanu
  - H2: Wyliczenie IconState (Swift)
  - H3: ActivityKind → glif
  - H3: Mapowanie wizualne
  - H2: Podmenu kontekstowe
  - H2: Tekst wiersza stanu (menu)
  - H2: Pobieranie zdarzeń
  - H2: Nadpisanie debugowania
  - H2: Lista kontrolna testowania
  - H2: Powiązane

## platforms/mac/peekaboo.md

- Ścieżka: /platforms/mac/peekaboo
- Nagłówki:
  - H2: Czym to jest (i czym nie jest)
  - H2: Relacja z Computer Use
  - H2: Włącz most
  - H2: Kolejność wykrywania klienta
  - H2: Bezpieczeństwo i uprawnienia
  - H2: Zachowanie migawki (automatyzacja)
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## platforms/mac/permissions.md

- Ścieżka: /platforms/mac/permissions
- Nagłówki:
  - H2: Wymagania dla stabilnych uprawnień
  - H2: Przyznania dostępności dla środowisk uruchomieniowych Node i CLI
  - H2: Lista kontrolna odzyskiwania, gdy monity znikają
  - H2: Uprawnienia do plików i folderów (Desktop/Documents/Downloads)
  - H2: Powiązane

## platforms/mac/remote.md

- Ścieżka: /platforms/mac/remote
- Nagłówki:
  - H2: Tryby
  - H2: Transporty zdalne
  - H2: Wymagania wstępne na hoście zdalnym
  - H2: Konfiguracja aplikacji macOS
  - H2: Czat internetowy
  - H2: Uprawnienia
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Przepływ logowania WhatsApp (zdalny)
  - H2: Rozwiązywanie problemów
  - H2: Dźwięki powiadomień
  - H2: Powiązane

## platforms/mac/signing.md

- Ścieżka: /platforms/mac/signing
- Nagłówki:
  - H1: Podpisywanie mac (kompilacje debugowania)
  - H2: Użycie
  - H3: Uwaga dotycząca podpisywania ad hoc
  - H2: Metadane kompilacji dla ekranu Informacje
  - H2: Dlaczego
  - H2: Powiązane

## platforms/mac/skills.md

- Ścieżka: /platforms/mac/skills
- Nagłówki:
  - H2: Źródło danych
  - H2: Akcje instalacji
  - H2: Klucze środowiskowe/API
  - H2: Tryb zdalny
  - H2: Powiązane

## platforms/mac/voice-overlay.md

- Ścieżka: /platforms/mac/voice-overlay
- Nagłówki:
  - H1: Cykl życia nakładki głosowej (macOS)
  - H2: Obecna intencja
  - H2: Wdrożono (9 grudnia 2025)
  - H2: Następne kroki
  - H2: Lista kontrolna debugowania
  - H2: Kroki migracji (sugerowane)
  - H2: Powiązane

## platforms/mac/voicewake.md

- Ścieżka: /platforms/mac/voicewake
- Nagłówki:
  - H1: Wybudzanie głosowe i push-to-talk
  - H2: Wymagania
  - H2: Tryby
  - H2: Zachowanie środowiska uruchomieniowego (słowo wybudzające)
  - H2: Niezmienniki cyklu życia
  - H2: Tryb awarii lepkiej nakładki (poprzedni)
  - H2: Szczegóły push-to-talk
  - H2: Ustawienia widoczne dla użytkownika
  - H2: Zachowanie przekazywania
  - H2: Ładunek przekazywania
  - H2: Szybka weryfikacja
  - H2: Powiązane

## platforms/mac/webchat.md

- Ścieżka: /platforms/mac/webchat
- Nagłówki:
  - H2: Uruchamianie i debugowanie
  - H2: Jak jest połączone
  - H2: Powierzchnia bezpieczeństwa
  - H2: Znane ograniczenia
  - H2: Powiązane

## platforms/mac/xpc.md

- Ścieżka: /platforms/mac/xpc
- Nagłówki:
  - H1: Architektura IPC OpenClaw macOS
  - H2: Cele
  - H2: Jak to działa
  - H3: Gateway + transport node
  - H3: Usługa Node + IPC aplikacji
  - H3: PeekabooBridge (automatyzacja UI)
  - H2: Przepływy operacyjne
  - H2: Uwagi dotyczące utwardzania
  - H2: Powiązane

## platforms/macos.md

- Ścieżka: /platforms/macos
- Nagłówki:
  - H2: Pobieranie
  - H2: Pierwsze uruchomienie
  - H2: Wybierz tryb Gateway
  - H2: Za co odpowiada aplikacja
  - H2: Strony szczegółowe macOS
  - H2: Powiązane

## platforms/oracle.md

- Ścieżka: /platforms/oracle
- Nagłówki:
  - H2: Powiązane

## platforms/raspberry-pi.md

- Ścieżka: /platforms/raspberry-pi
- Nagłówki:
  - H2: Powiązane

## platforms/windows.md

- Ścieżka: /platforms/windows
- Nagłówki:
  - H2: Zalecane: Windows Hub
  - H3: Co obejmuje Windows Hub
  - H3: Pierwsze uruchomienie
  - H2: Tryb węzła Windows
  - H2: Lokalny tryb MCP
  - H2: Natywne Windows CLI i Gateway
  - H2: WSL2 Gateway
  - H2: Automatyczne uruchamianie Gateway przed logowaniem do Windows
  - H2: Udostępnianie usług WSL przez LAN
  - H2: Rozwiązywanie problemów
  - H3: Ikona zasobnika się nie pojawia
  - H3: Konfiguracja lokalna nie powiodła się
  - H3: Aplikacja informuje, że wymagane jest parowanie
  - H3: Czat internetowy nie może połączyć się ze zdalnym Gateway
  - H3: Polecenia screen.snapshot, camera lub audio kończą się niepowodzeniem
  - H3: Łączność Git lub GitHub kończy się niepowodzeniem
  - H2: Powiązane

## plugins/adding-capabilities.md

- Ścieżka: /plugins/adding-capabilities
- Nagłówki:
  - H2: Kiedy utworzyć możliwość
  - H2: Standardowa sekwencja
  - H2: Co gdzie trafia
  - H2: Granice provider i harness
  - H2: Lista kontrolna plików
  - H2: Przykład praktyczny: generowanie obrazów
  - H2: Providerzy osadzania
  - H2: Lista kontrolna przeglądu
  - H2: Powiązane

## plugins/admin-http-rpc.md

- Ścieżka: /plugins/admin-http-rpc
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

- Ścieżka: /plugins/agent-tools
- Nagłówki:
  - H2: Powiązane

## plugins/architecture-internals.md

- Ścieżka: /plugins/architecture-internals
- Nagłówki:
  - H2: Potok ładowania
  - H3: Zachowanie oparte najpierw na manifeście
  - H3: Granica pamięci podręcznej Plugin
  - H2: Model rejestru
  - H2: Wywołania zwrotne wiązania konwersacji
  - H2: Hooki środowiska uruchomieniowego providera
  - H3: Kolejność hooków i użycie
  - H3: Przykład providera
  - H3: Wbudowane przykłady
  - H2: Pomocniki środowiska uruchomieniowego
  - H3: api.runtime.imageGeneration
  - H2: Trasy HTTP Gateway
  - H2: Ścieżki importu Plugin SDK
  - H2: Schematy narzędzi wiadomości
  - H2: Rozpoznawanie celu kanału
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

- Ścieżka: /plugins/architecture
- Nagłówki:
  - H2: Publiczny model możliwości
  - H3: Stanowisko dotyczące kompatybilności zewnętrznej
  - H3: Kształty Plugin
  - H3: Starsze hooki
  - H3: Sygnały kompatybilności
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
  - H2: Wewnętrzne elementy i referencje
  - H2: Powiązane

## plugins/building-extensions.md

- Ścieżka: /plugins/building-extensions
- Nagłówki:
  - H2: Powiązane

## plugins/building-plugins.md

- Ścieżka: /plugins/building-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Wybierz kształt Plugin
  - H2: Szybki start
  - H2: Rejestrowanie narzędzi
  - H2: Konwencje importu
  - H2: Lista kontrolna przed zgłoszeniem
  - H2: Testuj względem wydań beta
  - H2: Następne kroki
  - H2: Powiązane

## plugins/bundles.md

- Ścieżka: /plugins/bundles
- Nagłówki:
  - H2: Dlaczego istnieją pakiety
  - H2: Zainstaluj pakiet
  - H2: Co OpenClaw mapuje z pakietów
  - H3: Obecnie obsługiwane
  - H4: Zawartość Skills
  - H4: Pakiety hooków
  - H4: MCP dla osadzonego OpenClaw
  - H4: Ustawienia osadzonego OpenClaw
  - H4: Osadzony OpenClaw LSP
  - H3: Wykrywane, ale niewykonywane
  - H2: Formaty pakietów
  - H2: Priorytet wykrywania
  - H2: Zależności środowiska uruchomieniowego i czyszczenie
  - H2: Bezpieczeństwo
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/cli-backend-plugins.md

- Ścieżka: /plugins/cli-backend-plugins
- Nagłówki:
  - H2: Za co odpowiada Plugin
  - H2: Minimalny backendowy Plugin
  - H2: Kształt konfiguracji
  - H2: Zaawansowane backendowe hooki
  - H3: ownsNativeCompaction: rezygnacja z Compaction OpenClaw
  - H2: Most narzędzi MCP
  - H2: Konfiguracja użytkownika
  - H2: Weryfikacja
  - H2: Lista kontrolna
  - H2: Powiązane

## plugins/codex-computer-use.md

- Ścieżka: /plugins/codex-computer-use
- Nagłówki:
  - H2: OpenClaw.app i Peekaboo
  - H2: Aplikacja iOS
  - H2: Bezpośredni MCP cua-driver
  - H2: Szybka konfiguracja
  - H2: Polecenia
  - H2: Wybory z marketplace
  - H2: Dołączony marketplace macOS
  - H2: Limit zdalnego katalogu
  - H2: Referencja konfiguracji
  - H2: Co sprawdza OpenClaw
  - H2: Uprawnienia macOS
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/codex-harness-reference.md

- Ścieżka: /plugins/codex-harness-reference
- Nagłówki:
  - H2: Powierzchnia konfiguracji Plugin
  - H2: Transport serwera aplikacji
  - H2: Tryby zatwierdzania i sandbox
  - H2: Sandboksowane wykonywanie natywne
  - H2: Izolacja uwierzytelniania i środowiska
  - H2: Narzędzia dynamiczne
  - H2: Limity czasu
  - H2: Wykrywanie modeli
  - H2: Pliki inicjalizacji workspace
  - H2: Nadpisania środowiska
  - H2: Powiązane

## plugins/codex-harness-runtime.md

- Ścieżka: /plugins/codex-harness-runtime
- Nagłówki:
  - H2: Przegląd
  - H2: Wiązania wątków i zmiany modeli
  - H2: Widoczne odpowiedzi i Heartbeat
  - H2: Granice hooków
  - H2: Kontrakt obsługi V1
  - H2: Uprawnienia natywne i elicitations MCP
  - H2: Sterowanie kolejką
  - H2: Przesyłanie opinii Codex
  - H2: Compaction i lustro transkrypcji
  - H2: Media i dostarczanie
  - H2: Powiązane

## plugins/codex-harness.md

- Ścieżka: /plugins/codex-harness
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Udostępnianie wątków Codex Desktop i CLI
  - H2: Konfiguracja
  - H2: Zweryfikuj środowisko uruchomieniowe Codex
  - H2: Routing i wybór modelu
  - H2: Wzorce wdrożenia
  - H3: Podstawowe wdrożenie Codex
  - H3: Wdrożenie z mieszanymi providerami
  - H3: Wdrożenie Codex z fail-closed
  - H2: Polityka serwera aplikacji
  - H2: Polecenia i diagnostyka
  - H3: Inspekcja wątków Codex lokalnie
  - H2: Natywne pluginy Codex
  - H2: Computer Use
  - H2: Granice środowiska uruchomieniowego
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/codex-native-plugins.md

- Ścieżka: /plugins/codex-native-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Zarządzaj pluginami z czatu
  - H2: Jak działa konfiguracja natywnego Plugin
  - H2: Granica obsługi V1
  - H2: Inwentarz aplikacji i własność
  - H2: Konfiguracja aplikacji wątku
  - H2: Polityka działań destrukcyjnych
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/community.md

- Ścieżka: /plugins/community
- Nagłówki:
  - H2: Znajdź pluginy
  - H2: Publikuj pluginy
  - H2: Powiązane

## plugins/compatibility.md

- Ścieżka: /plugins/compatibility
- Nagłówki:
  - H2: Rejestr kompatybilności
  - H2: Pakiet inspektora Plugin
  - H3: Ścieżka akceptacji maintainerów
  - H2: Polityka wycofywania
  - H2: Obecne obszary kompatybilności
  - H3: Płaskie aliasy wywołań zwrotnych przychodzących WhatsApp
  - H3: Pola dopuszczania przychodzącego WhatsApp
  - H2: Informacje o wydaniu

## plugins/copilot.md

- Ścieżka: /plugins/copilot
- Nagłówki:
  - H2: Wymagania
  - H2: Instalacja Plugin
  - H2: Szybki start
  - H2: Obsługiwani providerzy
  - H2: BYOK
  - H2: Uwierzytelnianie
  - H2: Powierzchnia konfiguracji
  - H2: Compaction
  - H2: Lustrzane odbicie transkrypcji
  - H2: Pytania poboczne (/btw)
  - H2: Doctor
  - H2: Ograniczenia
  - H2: Uprawnienia i askuser
  - H3: Token GitHub na poziomie sesji
  - H2: Powiązane

## plugins/dependency-resolution.md

- Ścieżka: /plugins/dependency-resolution
- Nagłówki:
  - H2: Podział odpowiedzialności
  - H2: Korzenie instalacji
  - H2: Lokalne pluginy
  - H2: Uruchamianie i ponowne ładowanie
  - H2: Dołączone pluginy
  - H2: Czyszczenie starszych elementów

## plugins/google-meet.md

- Ścieżka: /plugins/google-meet
- Nagłówki:
  - H2: Szybki start
  - H3: Lokalny Gateway + Parallels Chrome
  - H2: Uwagi dotyczące instalacji
  - H2: Transporty
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth i preflight
  - H3: Utwórz dane uwierzytelniające Google
  - H3: Wygeneruj token odświeżania
  - H3: Zweryfikuj OAuth za pomocą doctor
  - H2: Konfiguracja
  - H2: Narzędzie
  - H2: Tryby agenta i bidi
  - H2: Lista kontrolna testu live
  - H2: Rozwiązywanie problemów
  - H3: Agent nie widzi narzędzia Google Meet
  - H3: Brak połączonego Node obsługującego Google Meet
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
  - H3: Hook środowiska exec
  - H3: Utrwalanie wyników narzędzi
  - H2: Hooki promptów i modeli
  - H3: Rozszerzenia sesji i wstrzyknięcia w następnej turze
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
  - H2: Wyświetlaj i wyszukuj Pluginy
  - H2: Instaluj Pluginy
  - H2: Uruchom ponownie i sprawdź
  - H2: Aktualizuj Pluginy
  - H2: Odinstaluj Pluginy
  - H2: Wybierz źródło
  - H2: Publikuj Pluginy
  - H2: Powiązane

## plugins/manifest.md

- Ścieżka: /plugins/manifest
- Nagłówki:
  - H2: Co robi ten plik
  - H2: Minimalny przykład
  - H2: Rozbudowany przykład
  - H2: Odniesienie do pól najwyższego poziomu
  - H2: Odniesienie do metadanych providera generowania
  - H2: Odniesienie do metadanych narzędzia
  - H2: Odniesienie do providerAuthChoices
  - H2: Odniesienie do commandAliases
  - H2: Odniesienie do activation
  - H2: Odniesienie do qaRunners
  - H2: Odniesienie do setup
  - H3: Odniesienie do setup.providers
  - H3: Pola setup
  - H2: Odniesienie do uiHints
  - H2: Odniesienie do contracts
  - H2: Odniesienie do mediaUnderstandingProviderMetadata
  - H2: Odniesienie do channelConfigs
  - H3: Zastępowanie innego Pluginu kanału
  - H2: Odniesienie do modelSupport
  - H2: Odniesienie do modelCatalog
  - H2: Odniesienie do modelIdNormalization
  - H2: Odniesienie do providerEndpoints
  - H2: Odniesienie do providerRequest
  - H2: Odniesienie do secretProviderIntegrations
  - H2: Odniesienie do modelPricing
  - H3: Indeks providerów OpenClaw
  - H2: Manifest kontra package.json
  - H3: Pola package.json wpływające na wykrywanie
  - H2: Priorytet wykrywania (zduplikowane identyfikatory Pluginów)
  - H2: Wymagania JSON Schema
  - H2: Zachowanie walidacji
  - H2: Uwagi
  - H2: Powiązane

## plugins/memory-lancedb.md

- Ścieżka: /plugins/memory-lancedb
- Nagłówki:
  - H2: Instalacja
  - H2: Szybki start
  - H2: Embeddingi oparte na providerze
  - H2: Embeddingi Ollama
  - H2: Providerzy zgodni z OpenAI
  - H2: Limity przywoływania i przechwytywania
  - H2: Polecenia
  - H2: Pamięć masowa
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
  - H2: Jak współdziała z pamięcią
  - H2: Zalecany wzorzec hybrydowy
  - H2: Tryby vault
  - H3: izolowany
  - H3: most
  - H3: niebezpieczny-lokalny
  - H2: Układ vault
  - H2: Importy Open Knowledge Format
  - H2: Ustrukturyzowane twierdzenia i dowody
  - H2: Metadane encji widoczne dla agenta
  - H2: Potok kompilacji
  - H2: Panele i raporty zdrowia
  - H2: Wyszukiwanie i pobieranie
  - H2: Narzędzia agenta
  - H2: Zachowanie promptu i kontekstu
  - H2: Konfiguracja
  - H3: Przykład: QMD + tryb mostu
  - H2: CLI
  - H2: Obsługa Obsidian
  - H2: Zalecany przepływ pracy
  - H2: Powiązane dokumenty

## plugins/message-presentation.md

- Ścieżka: /plugins/message-presentation
- Nagłówki:
  - H2: Kontrakt
  - H2: Przykłady producentów
  - H2: Kontrakt renderera
  - H2: Główny przepływ renderowania
  - H2: Reguły degradacji
  - H3: Widoczność wartości zastępczej przycisku
  - H2: Mapowanie providera
  - H2: Prezentacja kontra InteractiveReply
  - H2: Przypięcie dostarczania
  - H2: Lista kontrolna autora Pluginu
  - H2: Powiązane dokumenty

## plugins/oc-path.md

- Ścieżka: /plugins/oc-path
- Nagłówki:
  - H2: Dlaczego warto to włączyć
  - H2: Gdzie działa
  - H2: Włącz
  - H2: Zależności
  - H2: Co zapewnia
  - H2: Relacja z innymi Pluginami
  - H2: Bezpieczeństwo
  - H2: Powiązane

## plugins/plugin-inventory.md

- Ścieżka: /plugins/plugin-inventory
- Nagłówki:
  - H1: Inwentarz Pluginów
  - H2: Definicje
  - H2: Zainstaluj Plugin
  - H2: Główny pakiet npm
  - H2: Oficjalne pakiety zewnętrzne
  - H2: Tylko checkout źródłowy

## plugins/plugin-permission-requests.md

- Ścieżka: /plugins/plugin-permission-requests
- Nagłówki:
  - H2: Wybierz właściwą bramkę
  - H2: Poproś o zatwierdzenie przed wywołaniem narzędzia
  - H2: Zachowanie decyzji
  - H2: Kieruj prompty zatwierdzania
  - H2: Natywne uprawnienia Codex
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/reference.md

- Ścieżka: /plugins/reference
- Nagłówki:
  - H1: Odniesienie do Pluginów

## plugins/reference/acpx.md

- Ścieżka: /plugins/reference/acpx
- Nagłówki:
  - H1: Plugin ACPx
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/admin-http-rpc.md

- Ścieżka: /plugins/reference/admin-http-rpc
- Nagłówki:
  - H1: Plugin Admin Http Rpc
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/alibaba.md

- Ścieżka: /plugins/reference/alibaba
- Nagłówki:
  - H1: Plugin Alibaba
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/amazon-bedrock-mantle.md

- Ścieżka: /plugins/reference/amazon-bedrock-mantle
- Nagłówki:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/amazon-bedrock.md

- Ścieżka: /plugins/reference/amazon-bedrock
- Nagłówki:
  - H1: Plugin Amazon Bedrock
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/anthropic-vertex.md

- Ścieżka: /plugins/reference/anthropic-vertex
- Nagłówki:
  - H1: Plugin Anthropic Vertex
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Ścieżka: /plugins/reference/anthropic
- Nagłówki:
  - H1: Plugin Anthropic
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/arcee.md

- Ścieżka: /plugins/reference/arcee
- Nagłówki:
  - H1: Plugin Arcee
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/azure-speech.md

- Ścieżka: /plugins/reference/azure-speech
- Nagłówki:
  - H1: Plugin Azure Speech
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/bonjour.md

- Ścieżka: /plugins/reference/bonjour
- Nagłówki:
  - H1: Plugin Bonjour
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/brave.md

- Ścieżka: /plugins/reference/brave
- Nagłówki:
  - H1: Plugin Brave
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/browser.md

- Ścieżka: /plugins/reference/browser
- Nagłówki:
  - H1: Plugin przeglądarki
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/byteplus.md

- Ścieżka: /plugins/reference/byteplus
- Nagłówki:
  - H1: Plugin BytePlus
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/canvas.md

- Ścieżka: /plugins/reference/canvas
- Nagłówki:
  - H1: Plugin Canvas
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/cerebras.md

- Ścieżka: /plugins/reference/cerebras
- Nagłówki:
  - H1: Plugin Cerebras
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/chutes.md

- Ścieżka: /plugins/reference/chutes
- Nagłówki:
  - H1: Plugin Chutes
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/clawrouter.md

- Ścieżka: /plugins/reference/clawrouter
- Nagłówki:
  - H1: Plugin ClawRouter
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/clickclack.md

- Ścieżka: /plugins/reference/clickclack
- Nagłówki:
  - H1: Plugin Clickclack
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/cloudflare-ai-gateway.md

- Ścieżka: /plugins/reference/cloudflare-ai-gateway
- Nagłówki:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/codex-supervisor.md

- Ścieżka: /plugins/reference/codex-supervisor
- Nagłówki:
  - H1: Plugin Codex Supervisor
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Lista sesji

## plugins/reference/codex.md

- Ścieżka: /plugins/reference/codex
- Nagłówki:
  - H1: Plugin Codex
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/cohere.md

- Ścieżka: /plugins/reference/cohere
- Nagłówki:
  - H1: Plugin Cohere
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/comfy.md

- Ścieżka: /plugins/reference/comfy
- Nagłówki:
  - H1: Plugin ComfyUI
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/copilot-proxy.md

- Ścieżka: /plugins/reference/copilot-proxy
- Nagłówki:
  - H1: Plugin Copilot Proxy
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/copilot.md

- Ścieżka: /plugins/reference/copilot
- Nagłówki:
  - H1: Plugin Copilot
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/deepgram.md

- Ścieżka: /plugins/reference/deepgram
- Nagłówki:
  - H1: Plugin Deepgram
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/deepinfra.md

- Ścieżka: /plugins/reference/deepinfra
- Nagłówki:
  - H1: Plugin DeepInfra
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/deepseek.md

- Ścieżka: /plugins/reference/deepseek
- Nagłówki:
  - H1: Plugin DeepSeek
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/diagnostics-otel.md

- Ścieżka: /plugins/reference/diagnostics-otel
- Nagłówki:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/diagnostics-prometheus.md

- Ścieżka: /plugins/reference/diagnostics-prometheus
- Nagłówki:
  - H1: Plugin Diagnostics Prometheus
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/diffs-language-pack.md

- Ścieżka: /plugins/reference/diffs-language-pack
- Nagłówki:
  - H1: Plugin Diffs Language Pack
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Dodane języki

## plugins/reference/diffs.md

- Ścieżka: /plugins/reference/diffs
- Nagłówki:
  - H1: Plugin Diffs
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/discord.md

- Ścieżka: /plugins/reference/discord
- Nagłówki:
  - H1: Plugin Discord
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/document-extract.md

- Ścieżka: /plugins/reference/document-extract
- Nagłówki:
  - H1: Plugin Document Extract
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/duckduckgo.md

- Ścieżka: /plugins/reference/duckduckgo
- Nagłówki:
  - H1: Plugin DuckDuckGo
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/elevenlabs.md

- Ścieżka: /plugins/reference/elevenlabs
- Nagłówki:
  - H1: Plugin Elevenlabs
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/exa.md

- Ścieżka: /plugins/reference/exa
- Nagłówki:
  - H1: Plugin Exa
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/fal.md

- Ścieżka: /plugins/reference/fal
- Nagłówki:
  - H1: Plugin fal
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/feishu.md

- Ścieżka: /plugins/reference/feishu
- Nagłówki:
  - H1: Plugin Feishu
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązane dokumenty

## plugins/reference/file-transfer.md

- Ścieżka: /plugins/reference/file-transfer
- Nagłówki:
  - H1: Plugin File Transfer
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/firecrawl.md

- Trasa: /plugins/reference/firecrawl
- Nagłówki:
  - H1: Plugin Firecrawl
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/fireworks.md

- Trasa: /plugins/reference/fireworks
- Nagłówki:
  - H1: Plugin Fireworks
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/github-copilot.md

- Trasa: /plugins/reference/github-copilot
- Nagłówki:
  - H1: Plugin GitHub Copilot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/gmi.md

- Trasa: /plugins/reference/gmi
- Nagłówki:
  - H1: Plugin Gmi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/google-meet.md

- Trasa: /plugins/reference/google-meet
- Nagłówki:
  - H1: Plugin Google Meet
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/google.md

- Trasa: /plugins/reference/google
- Nagłówki:
  - H1: Plugin Google
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/googlechat.md

- Trasa: /plugins/reference/googlechat
- Nagłówki:
  - H1: Plugin Google Chat
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/gradium.md

- Trasa: /plugins/reference/gradium
- Nagłówki:
  - H1: Plugin Gradium
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/groq.md

- Trasa: /plugins/reference/groq
- Nagłówki:
  - H1: Plugin Groq
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/huggingface.md

- Trasa: /plugins/reference/huggingface
- Nagłówki:
  - H1: Plugin Hugging Face
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/imessage.md

- Trasa: /plugins/reference/imessage
- Nagłówki:
  - H1: Plugin iMessage
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/inworld.md

- Trasa: /plugins/reference/inworld
- Nagłówki:
  - H1: Plugin Inworld
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/irc.md

- Trasa: /plugins/reference/irc
- Nagłówki:
  - H1: Plugin IRC
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/kilocode.md

- Trasa: /plugins/reference/kilocode
- Nagłówki:
  - H1: Plugin Kilocode
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/kimi.md

- Trasa: /plugins/reference/kimi
- Nagłówki:
  - H1: Plugin Kimi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/line.md

- Trasa: /plugins/reference/line
- Nagłówki:
  - H1: Plugin LINE
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/litellm.md

- Trasa: /plugins/reference/litellm
- Nagłówki:
  - H1: Plugin LiteLLM
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/llama-cpp.md

- Trasa: /plugins/reference/llama-cpp
- Nagłówki:
  - H1: Plugin Llama Cpp
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/llm-task.md

- Trasa: /plugins/reference/llm-task
- Nagłówki:
  - H1: Plugin LLM Task
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/lmstudio.md

- Trasa: /plugins/reference/lmstudio
- Nagłówki:
  - H1: Plugin LM Studio
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/lobster.md

- Trasa: /plugins/reference/lobster
- Nagłówki:
  - H1: Plugin Lobster
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/matrix.md

- Trasa: /plugins/reference/matrix
- Nagłówki:
  - H1: Plugin Matrix
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/mattermost.md

- Trasa: /plugins/reference/mattermost
- Nagłówki:
  - H1: Plugin Mattermost
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/memory-core.md

- Trasa: /plugins/reference/memory-core
- Nagłówki:
  - H1: Plugin Memory Core
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/memory-lancedb.md

- Trasa: /plugins/reference/memory-lancedb
- Nagłówki:
  - H1: Plugin Memory Lancedb
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/memory-wiki.md

- Trasa: /plugins/reference/memory-wiki
- Nagłówki:
  - H1: Plugin Memory Wiki
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/microsoft-foundry.md

- Trasa: /plugins/reference/microsoft-foundry
- Nagłówki:
  - H1: Plugin Microsoft Foundry
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Wymagania
  - H2: Modele czatu
  - H2: Generowanie obrazów MAI
  - H2: Rozwiązywanie problemów

## plugins/reference/microsoft.md

- Trasa: /plugins/reference/microsoft
- Nagłówki:
  - H1: Plugin Microsoft
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-claude.md

- Trasa: /plugins/reference/migrate-claude
- Nagłówki:
  - H1: Plugin migracji Claude
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-hermes.md

- Trasa: /plugins/reference/migrate-hermes
- Nagłówki:
  - H1: Plugin migracji Hermes
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/minimax.md

- Trasa: /plugins/reference/minimax
- Nagłówki:
  - H1: Plugin MiniMax
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/mistral.md

- Trasa: /plugins/reference/mistral
- Nagłówki:
  - H1: Plugin Mistral
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/moonshot.md

- Trasa: /plugins/reference/moonshot
- Nagłówki:
  - H1: Plugin Moonshot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/msteams.md

- Trasa: /plugins/reference/msteams
- Nagłówki:
  - H1: Plugin Microsoft Teams
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nextcloud-talk.md

- Trasa: /plugins/reference/nextcloud-talk
- Nagłówki:
  - H1: Plugin Nextcloud Talk
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nostr.md

- Trasa: /plugins/reference/nostr
- Nagłówki:
  - H1: Plugin Nostr
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/novita.md

- Trasa: /plugins/reference/novita
- Nagłówki:
  - H1: Plugin Novita
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/nvidia.md

- Trasa: /plugins/reference/nvidia
- Nagłówki:
  - H1: Plugin NVIDIA
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/oc-path.md

- Trasa: /plugins/reference/oc-path
- Nagłówki:
  - H1: Plugin Oc Path
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/ollama.md

- Trasa: /plugins/reference/ollama
- Nagłówki:
  - H1: Plugin Ollama
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/open-prose.md

- Trasa: /plugins/reference/open-prose
- Nagłówki:
  - H1: Plugin Open Prose
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/openai.md

- Trasa: /plugins/reference/openai
- Nagłówki:
  - H1: Plugin OpenAI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/opencode-go.md

- Trasa: /plugins/reference/opencode-go
- Nagłówki:
  - H1: Plugin OpenCode Go
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/opencode.md

- Trasa: /plugins/reference/opencode
- Nagłówki:
  - H1: Plugin OpenCode
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/openrouter.md

- Trasa: /plugins/reference/openrouter
- Nagłówki:
  - H1: Plugin OpenRouter
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/openshell.md

- Trasa: /plugins/reference/openshell
- Nagłówki:
  - H1: Plugin Openshell
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/perplexity.md

- Trasa: /plugins/reference/perplexity
- Nagłówki:
  - H1: Plugin Perplexity
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/pixverse.md

- Trasa: /plugins/reference/pixverse
- Nagłówki:
  - H1: Plugin PixVerse
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/policy.md

- Trasa: /plugins/reference/policy
- Nagłówki:
  - H1: Plugin Policy
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Zachowanie
  - H2: Powiązana dokumentacja

## plugins/reference/qa-channel.md

- Trasa: /plugins/reference/qa-channel
- Nagłówki:
  - H1: Plugin QA Channel
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qa-lab.md

- Trasa: /plugins/reference/qa-lab
- Nagłówki:
  - H1: Plugin QA Lab
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qa-matrix.md

- Trasa: /plugins/reference/qa-matrix
- Nagłówki:
  - H1: Plugin QA Matrix
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qianfan.md

- Trasa: /plugins/reference/qianfan
- Nagłówki:
  - H1: Plugin Qianfan
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qqbot.md

- Trasa: /plugins/reference/qqbot
- Nagłówki:
  - H1: Plugin QQ Bot
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/qwen.md

- Trasa: /plugins/reference/qwen
- Nagłówki:
  - H1: Plugin Qwen
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/raft.md

- Trasa: /plugins/reference/raft
- Nagłówki:
  - H1: Plugin Raft
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/runway.md

- Trasa: /plugins/reference/runway
- Nagłówki:
  - H1: Plugin Runway
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/searxng.md

- Trasa: /plugins/reference/searxng
- Nagłówki:
  - H1: Plugin SearXNG
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/senseaudio.md

- Trasa: /plugins/reference/senseaudio
- Nagłówki:
  - H1: Plugin Senseaudio
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/sglang.md

- Trasa: /plugins/reference/sglang
- Nagłówki:
  - H1: Plugin SGLang
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/signal.md

- Trasa: /plugins/reference/signal
- Nagłówki:
  - H1: Plugin Signal
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/slack.md

- Trasa: /plugins/reference/slack
- Nagłówki:
  - H1: Plugin Slack
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/sms.md

- Trasa: /plugins/reference/sms
- Nagłówki:
  - H1: Plugin Sms
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/stepfun.md

- Trasa: /plugins/reference/stepfun
- Nagłówki:
  - H1: Plugin StepFun
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/synology-chat.md

- Trasa: /plugins/reference/synology-chat
- Nagłówki:
  - H1: Plugin Synology Chat
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/synthetic.md

- Trasa: /plugins/reference/synthetic
- Nagłówki:
  - H1: Plugin Synthetic
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tavily.md

- Trasa: /plugins/reference/tavily
- Nagłówki:
  - H1: Plugin Tavily
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/telegram.md

- Trasa: /plugins/reference/telegram
- Nagłówki:
  - H1: Plugin Telegram
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tencent.md

- Trasa: /plugins/reference/tencent
- Nagłówki:
  - H1: Plugin Tencent
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tlon.md

- Trasa: /plugins/reference/tlon
- Nagłówki:
  - H1: Plugin Tlon
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/together.md

- Trasa: /plugins/reference/together
- Nagłówki:
  - H1: Plugin Together
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tokenjuice.md

- Trasa: /plugins/reference/tokenjuice
- Nagłówki:
  - H1: Plugin Tokenjuice
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/tts-local-cli.md

- Trasa: /plugins/reference/tts-local-cli
- Nagłówki:
  - H1: Plugin TTS Local CLI
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/twitch.md

- Trasa: /plugins/reference/twitch
- Nagłówki:
  - H1: Plugin Twitch
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/venice.md

- Trasa: /plugins/reference/venice
- Nagłówki:
  - H1: Plugin Venice
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/vercel-ai-gateway.md

- Trasa: /plugins/reference/vercel-ai-gateway
- Nagłówki:
  - H1: Plugin Vercel AI Gateway
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/vllm.md

- Trasa: /plugins/reference/vllm
- Nagłówki:
  - H1: Plugin vLLM
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/voice-call.md

- Trasa: /plugins/reference/voice-call
- Nagłówki:
  - H1: Plugin połączeń głosowych
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/volcengine.md

- Trasa: /plugins/reference/volcengine
- Nagłówki:
  - H1: Plugin Volcengine
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/voyage.md

- Trasa: /plugins/reference/voyage
- Nagłówki:
  - H1: Plugin Voyage
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/vydra.md

- Trasa: /plugins/reference/vydra
- Nagłówki:
  - H1: Plugin Vydra
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/web-readability.md

- Trasa: /plugins/reference/web-readability
- Nagłówki:
  - H1: Plugin Web Readability
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/webhooks.md

- Trasa: /plugins/reference/webhooks
- Nagłówki:
  - H1: Plugin Webhooków
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/whatsapp.md

- Trasa: /plugins/reference/whatsapp
- Nagłówki:
  - H1: Plugin WhatsApp
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/workboard.md

- Trasa: /plugins/reference/workboard
- Nagłówki:
  - H1: Plugin Workboard
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/xai.md

- Trasa: /plugins/reference/xai
- Nagłówki:
  - H1: Plugin xAI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/xiaomi.md

- Trasa: /plugins/reference/xiaomi
- Nagłówki:
  - H1: Plugin Xiaomi
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zai.md

- Trasa: /plugins/reference/zai
- Nagłówki:
  - H1: Plugin Z.AI
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zalo.md

- Trasa: /plugins/reference/zalo
- Nagłówki:
  - H1: Plugin Zalo
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/reference/zalouser.md

- Trasa: /plugins/reference/zalouser
- Nagłówki:
  - H1: Plugin Zalo Personal
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązana dokumentacja

## plugins/sdk-agent-harness.md

- Trasa: /plugins/sdk-agent-harness
- Nagłówki:
  - H2: Kiedy używać harness
  - H2: Za co nadal odpowiada rdzeń
  - H2: Rejestrowanie harness
  - H2: Zasady wyboru
  - H2: Parowanie dostawcy z harness
  - H3: Oprogramowanie pośredniczące wyników narzędzi
  - H3: Klasyfikacja wyniku terminala
  - H3: Efekty uboczne po zakończeniu agenta
  - H3: Dane wejściowe użytkownika i powierzchnie narzędzi
  - H3: Natywny tryb harness Codex
  - H2: Rygor środowiska uruchomieniowego
  - H2: Natywne sesje i lustrzana kopia transkryptu
  - H2: Wyniki narzędzi i multimediów
  - H2: Obecne ograniczenia
  - H2: Powiązane

## plugins/sdk-channel-inbound.md

- Trasa: /plugins/sdk-channel-inbound
- Nagłówki:
  - H2: Pomocniki rdzenia
  - H2: Migracja

## plugins/sdk-channel-ingress.md

- Trasa: /plugins/sdk-channel-ingress
- Nagłówki:
  - H1: API ruchu przychodzącego kanału
  - H2: Resolver środowiska uruchomieniowego
  - H2: Wynik
  - H2: Grupy dostępu
  - H2: Tryby zdarzeń
  - H2: Trasy i aktywacja
  - H2: Redakcja
  - H2: Weryfikacja

## plugins/sdk-channel-message.md

- Trasa: /plugins/sdk-channel-message
- Nagłówki: brak

## plugins/sdk-channel-outbound.md

- Trasa: /plugins/sdk-channel-outbound
- Nagłówki:
  - H2: Adapter
  - H2: Istniejące adaptery wychodzące
  - H2: Trwałe wysyłki
  - H2: Wysyłanie zgodnościowe

## plugins/sdk-channel-plugins.md

- Trasa: /plugins/sdk-channel-plugins
- Nagłówki:
  - H2: Jak działają Plugin kanałów
  - H2: Zatwierdzenia i możliwości kanałów
  - H2: Zasady wzmianek przychodzących
  - H2: Przewodnik krok po kroku
  - H2: Struktura plików
  - H2: Tematy zaawansowane
  - H2: Następne kroki
  - H2: Powiązane

## plugins/sdk-channel-turn.md

- Trasa: /plugins/sdk-channel-turn
- Nagłówki: brak

## plugins/sdk-entrypoints.md

- Trasa: /plugins/sdk-entrypoints
- Nagłówki:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Tryb rejestracji
  - H2: Kształty Plugin
  - H2: Powiązane

## plugins/sdk-migration.md

- Trasa: /plugins/sdk-migration
- Nagłówki:
  - H2: Co się zmienia
  - H2: Dlaczego to się zmieniło
  - H2: Plan migracji rozmów i głosu w czasie rzeczywistym
  - H2: Zasady zgodności
  - H2: Jak migrować
  - H2: Referencja ścieżek importu
  - H2: Aktywne wycofania
  - H2: Harmonogram usunięcia
  - H2: Tymczasowe wyciszanie ostrzeżeń
  - H2: Powiązane

## plugins/sdk-overview.md

- Trasa: /plugins/sdk-overview
- Nagłówki:
  - H2: Konwencja importu
  - H2: Referencja podścieżek
  - H2: API rejestracji
  - H3: Rejestracja możliwości
  - H3: Narzędzia i polecenia
  - H3: Infrastruktura
  - H3: Hooki hosta dla Plugin przepływów pracy
  - H3: Rejestracja wykrywania Gateway
  - H3: Metadane rejestracji CLI
  - H3: Rejestracja backendu CLI
  - H3: Sloty wyłączne
  - H3: Przestarzałe adaptery osadzania pamięci
  - H3: Zdarzenia i cykl życia
  - H3: Semantyka decyzji hooków
  - H3: Pola obiektu API
  - H2: Konwencja modułów wewnętrznych
  - H2: Powiązane

## plugins/sdk-provider-plugins.md

- Trasa: /plugins/sdk-provider-plugins
- Nagłówki:
  - H2: Przewodnik krok po kroku
  - H2: Publikowanie w ClawHub
  - H2: Struktura plików
  - H2: Referencja kolejności katalogu
  - H2: Następne kroki
  - H2: Powiązane

## plugins/sdk-runtime.md

- Trasa: /plugins/sdk-runtime
- Nagłówki:
  - H2: Ładowanie i zapisy konfiguracji
  - H2: Narzędzia wielokrotnego użytku środowiska uruchomieniowego
  - H2: Przestrzenie nazw środowiska uruchomieniowego
  - H2: Przechowywanie referencji środowiska uruchomieniowego
  - H2: Inne pola api najwyższego poziomu
  - H2: Powiązane

## plugins/sdk-setup.md

- Trasa: /plugins/sdk-setup
- Nagłówki:
  - H2: Metadane pakietu
  - H3: Pola openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Odroczone pełne ładowanie
  - H2: Manifest Plugin
  - H2: Publikowanie w ClawHub
  - H2: Wpis konfiguracji
  - H3: Wąskie importy pomocników konfiguracji
  - H3: Promowanie pojedynczego konta należące do kanału
  - H2: Schemat konfiguracji
  - H3: Budowanie schematów konfiguracji kanału
  - H2: Kreatory konfiguracji
  - H2: Publikowanie i instalowanie
  - H2: Powiązane

## plugins/sdk-subpaths.md

- Trasa: /plugins/sdk-subpaths
- Nagłówki:
  - H2: Wpis Plugin
  - H3: Przestarzała zgodność i pomocniki testowe
  - H3: Zarezerwowane podścieżki pomocników wbudowanych Plugin
  - H2: Powiązane

## plugins/sdk-testing.md

- Trasa: /plugins/sdk-testing
- Nagłówki:
  - H2: Narzędzia testowe
  - H3: Dostępne eksporty
  - H3: Typy
  - H2: Testowanie rozstrzygania celu
  - H2: Wzorce testowania
  - H3: Testowanie kontraktów rejestracji
  - H3: Testowanie dostępu do konfiguracji środowiska uruchomieniowego
  - H3: Testy jednostkowe Plugin kanału
  - H3: Testy jednostkowe Plugin dostawcy
  - H3: Mockowanie środowiska uruchomieniowego Plugin
  - H3: Testowanie ze stubami per instancja
  - H2: Testy kontraktowe (Plugin w repozytorium)
  - H3: Uruchamianie testów zakresowych
  - H2: Wymuszanie lintu (Plugin w repozytorium)
  - H2: Konfiguracja testów
  - H2: Powiązane

## plugins/tool-plugins.md

- Trasa: /plugins/tool-plugins
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
  - H3: nie znaleziono wpisu Plugin: ./dist/index.js
  - H3: wpis Plugin nie udostępnia metadanych defineToolPlugin
  - H3: wygenerowane metadane openclaw.plugin.json są nieaktualne
  - H3: package.json openclaw.extensions musi zawierać ./dist/index.js
  - H3: Nie można znaleźć pakietu 'typebox'
  - H3: Narzędzie nie pojawia się po instalacji
  - H2: Zobacz też

## plugins/voice-call.md

- Trasa: /plugins/voice-call
- Nagłówki:
  - H2: Szybki start
  - H2: Konfiguracja
  - H2: Zakres sesji
  - H2: Rozmowy głosowe w czasie rzeczywistym
  - H3: Zasady narzędzi
  - H3: Kontekst głosowy agenta
  - H3: Przykłady dostawców czasu rzeczywistego
  - H2: Transkrypcja strumieniowa
  - H3: Przykłady dostawców strumieniowania
  - H2: TTS dla połączeń
  - H3: Przykłady TTS
  - H2: Połączenia przychodzące
  - H3: Routing per numer
  - H3: Kontrakt wypowiedzi głosowej
  - H3: Zachowanie uruchamiania rozmowy
  - H3: Okres prolongaty rozłączenia strumienia Twilio
  - H2: Czyszczenie nieaktualnych połączeń
  - H2: Bezpieczeństwo Webhook
  - H2: CLI
  - H2: Narzędzie agenta
  - H2: RPC Gateway
  - H2: Rozwiązywanie problemów
  - H3: Konfiguracja nie przechodzi ekspozycji Webhook
  - H3: Dane uwierzytelniające dostawcy nie działają
  - H3: Połączenia startują, ale Webhook dostawcy nie przychodzą
  - H3: Weryfikacja podpisu nie powiodła się
  - H3: Dołączenia Twilio do Google Meet nie działają
  - H3: Połączenie w czasie rzeczywistym nie ma mowy
  - H2: Powiązane

## plugins/webhooks.md

- Trasa: /plugins/webhooks
- Nagłówki:
  - H2: Gdzie działa
  - H2: Konfigurowanie tras
  - H2: Model bezpieczeństwa
  - H2: Format żądania
  - H2: Obsługiwane akcje
  - H3: createflow
  - H3: runtask
  - H2: Kształt odpowiedzi
  - H2: Powiązana dokumentacja

## plugins/workboard.md

- Trasa: /plugins/workboard
- Nagłówki:
  - H2: Stan domyślny
  - H2: Co zawierają karty
  - H2: Wykonania kart i zadania
  - H2: Koordynacja agentów
  - H3: Wybór pracownika dispatch
  - H3: Prompt pracownika i cykl życia
  - H3: Punkty wejścia dispatch
  - H2: CLI i polecenie slash
  - H2: Synchronizacja cyklu życia sesji
  - H2: Przepływ pracy dashboardu
  - H2: Uprawnienia
  - H2: Konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Karta mówi, że Workboard jest niedostępny
  - H3: Karty się nie zapisują
  - H3: Uruchomienie karty nie otwiera oczekiwanej sesji
  - H3: Dispatch nie uruchamia pracownika
  - H2: Powiązane

## plugins/zalouser.md

- Trasa: /plugins/zalouser
- Nagłówki:
  - H2: Nazewnictwo
  - H2: Gdzie działa
  - H2: Instalacja
  - H3: Opcja A: instalacja z npm
  - H3: Opcja B: instalacja z folderu lokalnego (dev)
  - H2: Konfiguracja
  - H2: CLI
  - H2: Narzędzie agenta
  - H2: Powiązane

## prose.md

- Trasa: /prose
- Nagłówki:
  - H2: Instalacja
  - H2: Polecenie slash
  - H2: Co potrafi
  - H2: Przykład: równoległe badanie i synteza
  - H2: Mapowanie środowiska uruchomieniowego OpenClaw
  - H2: Lokalizacje plików
  - H2: Backendy stanu
  - H2: Bezpieczeństwo
  - H2: Powiązane

## providers/alibaba.md

- Trasa: /providers/alibaba
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Wbudowane modele Wan
  - H2: Możliwości i ograniczenia
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/anthropic.md

- Trasa: /providers/anthropic
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Domyślne myślenie (Claude Fable 5, 4.8 i 4.6)
  - H2: Zapasowa obsługa odmowy ze względów bezpieczeństwa (Claude Fable 5)
  - H3: Dlaczego to istnieje
  - H3: Jak to działa
  - H3: Obserwowalność i rozliczenia
  - H3: Zakres
  - H2: Buforowanie promptów
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/arcee.md

- Trasa: /providers/arcee
- Nagłówki:
  - H2: Instalacja Plugin
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Obsługiwane funkcje
  - H2: Powiązane

## providers/azure-speech.md

- Trasa: /providers/azure-speech
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Opcje konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## providers/bedrock-mantle.md

- Trasa: /providers/bedrock-mantle
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Automatyczne wykrywanie modeli
  - H3: Obsługiwane regiony
  - H2: Konfiguracja ręczna
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/bedrock.md

- Trasa: /providers/bedrock
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Automatyczne wykrywanie modeli
  - H2: Szybka konfiguracja (ścieżka AWS)
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/cerebras.md

- Trasa: /providers/cerebras
- Nagłówki:
  - H2: Instalacja Plugin
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Konfiguracja ręczna
  - H2: Powiązane

## providers/chutes.md

- Trasa: /providers/chutes
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Pierwsze kroki
  - H2: Zachowanie wykrywania
  - H2: Domyślne aliasy
  - H2: Wbudowany katalog startowy
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/claude-max-api-proxy.md

- Trasa: /providers/claude-max-api-proxy
- Nagłówki:
  - H2: Dlaczego warto tego używać?
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
  - H2: Protokół i Pluginy dostawców
  - H2: Limity i użycie
  - H2: Rozwiązywanie problemów
  - H2: Zachowanie zabezpieczeń
  - H2: Powiązane

## providers/cloudflare-ai-gateway.md

- Trasa: /providers/cloudflare-ai-gateway
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Pierwsze kroki
  - H2: Przykład nieinteraktywny
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/cohere.md

- Trasa: /providers/cohere
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Konfiguracja tylko przez środowisko
  - H2: Powiązane

## providers/comfy.md

- Trasa: /providers/comfy
- Nagłówki:
  - H2: Co obsługuje
  - H2: Pierwsze kroki
  - H2: Konfiguracja
  - H3: Klucze współdzielone
  - H3: Klucze dla poszczególnych możliwości
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
  - H2: Zainstaluj Plugin
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
  - H2: Zainstaluj Plugin
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
  - H2: Trzy sposoby używania Copilot w OpenClaw
  - H2: Opcjonalne flagi
  - H2: Nieinteraktywny onboarding
  - H2: Embeddingi wyszukiwania pamięci
  - H3: Konfiguracja
  - H3: Jak to działa
  - H2: Powiązane

## providers/gmi.md

- Trasa: /providers/gmi
- Nagłówki:
  - H2: Konfiguracja
  - H2: Wartości domyślne
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
  - H2: Zainstaluj Plugin
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Głosy
  - H3: Nadpisanie głosu dla pojedynczej wiadomości
  - H2: Dane wyjściowe
  - H2: Kolejność automatycznego wyboru
  - H2: Powiązane

## providers/groq.md

- Trasa: /providers/groq
- Nagłówki:
  - H2: Zainstaluj Plugin
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
  - H2: Przykład pełnej konfiguracji
  - H2: Uruchamianie na żądanie
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/inworld.md

- Trasa: /providers/inworld
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Pierwsze kroki
  - H2: Opcje konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## providers/kilocode.md

- Trasa: /providers/kilocode
- Nagłówki:
  - H2: Zainstaluj Plugin
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
  - H2: Nieinteraktywny onboarding
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
  - H2: Konfiguracja przez openclaw configure
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
  - H2: Wartości domyślne
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
  - H2: Wartości domyślne
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
  - H2: Modele chmurowe
  - H2: Wykrywanie modeli (niejawny dostawca)
  - H2: Wnioskowanie lokalne dla Node
  - H2: Wizja i opis obrazu
  - H2: Konfiguracja
  - H2: Typowe przepisy
  - H3: Wybór modelu
  - H3: Szybka weryfikacja
  - H2: Wyszukiwanie w sieci Ollama
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/openai.md

- Trasa: /providers/openai
- Nagłówki:
  - H2: Szybki wybór
  - H2: Mapa nazw
  - H2: Ograniczony podgląd GPT-5.6
  - H2: Pokrycie funkcji OpenClaw
  - H2: Embeddingi pamięci
  - H2: Pierwsze kroki
  - H2: Natywne uwierzytelnianie serwera aplikacji Codex
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Wkład promptów GPT-5
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
  - H2: Zamiana mowy na tekst (przychodzące audio)
  - H2: Router fuzji
  - H2: Uwierzytelnianie i nagłówki
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/perplexity-provider.md

- Trasa: /providers/perplexity-provider
- Nagłówki:
  - H2: Zainstaluj Plugin
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
  - H2: Zainstaluj Plugin
  - H2: Pierwsze kroki
  - H2: Wbudowany katalog
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/qwen-oauth.md

- Trasa: /providers/qwen-oauth
- Nagłówki:
  - H2: Konfiguracja
  - H2: Wartości domyślne
  - H2: Czym różni się to od Qwen
  - H2: Kiedy wybrać Qwen OAuth / Portal
  - H2: Modele
  - H2: Migracja
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/qwen.md

- Trasa: /providers/qwen
- Nagłówki:
  - H2: Zainstaluj Plugin
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
  - H2: Wykrywanie modeli (niejawny dostawca)
  - H2: Jawna konfiguracja (modele ręczne)
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/stepfun.md

- Trasa: /providers/stepfun
- Nagłówki:
  - H2: Zainstaluj Plugin
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
  - H2: Konfiguracja jawna (modele ręczne)
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/volcengine.md

- Trasa: /providers/volcengine
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Dostawcy i punkty końcowe
  - H2: Wbudowany katalog
  - H2: Zamiana tekstu na mowę
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/vydra.md

- Trasa: /providers/vydra
- Nagłówki:
  - H2: Konfiguracja
  - H2: Możliwości
  - H2: Powiązane

## providers/xai.md

- Trasa: /providers/xai
- Nagłówki:
  - H2: Wybierz ścieżkę konfiguracji
  - H2: Rozwiązywanie problemów z OAuth
  - H2: Wbudowany katalog
  - H2: Zakres funkcji OpenClaw
  - H3: Mapowania trybu szybkiego
  - H3: Aliasy zgodności ze starszymi wersjami
  - H2: Funkcje
  - H2: Testowanie na żywo
  - H2: Powiązane

## providers/xiaomi.md

- Trasa: /providers/xiaomi
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Katalog płatności według użycia
  - H2: Katalog planu Token Plan
  - H2: Zamiana tekstu na mowę
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/zai.md

- Trasa: /providers/zai
- Nagłówki:
  - H2: Modele GLM
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Wbudowany katalog
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## refactor/access.md

- Trasa: /refactor/access
- Nagłówki: brak

## refactor/acp.md

- Trasa: /refactor/acp
- Nagłówki:
  - H2: Cele
  - H2: Poza zakresem
  - H2: Model docelowy
  - H3: Tożsamość instancji Gateway
  - H3: Własność sesji ACP
  - H3: Dzierżawy procesów ACPX
  - H2: Kontroler cyklu życia
  - H2: Kontrakt wrappera
  - H2: Kontrakt widoczności sesji
  - H2: Plan migracji
  - H3: Faza 1: Dodanie tożsamości i dzierżaw
  - H3: Faza 2: Czyszczenie najpierw według dzierżaw
  - H3: Faza 3: Sprzątanie przy starcie najpierw według dzierżaw
  - H3: Faza 4: Wiersze własności sesji
  - H3: Faza 5: Usunięcie starszych heurystyk
  - H2: Testy
  - H2: Uwagi o zgodności
  - H2: Kryteria sukcesu

## refactor/canvas.md

- Trasa: /refactor/canvas
- Nagłówki:
  - H1: Refaktoryzacja Pluginu Canvas
  - H2: Cel
  - H2: Poza zakresem
  - H2: Bieżący stan gałęzi
  - H2: Docelowy kształt
  - H2: Kroki migracji
  - H2: Lista kontrolna audytu
  - H2: Polecenia weryfikacyjne

## refactor/database-first.md

- Trasa: /refactor/database-first
- Nagłówki:
  - H1: Refaktoryzacja stanu z priorytetem bazy danych
  - H2: Decyzja
  - H2: Twardy kontrakt
  - H2: Stan docelowy i postęp
  - H3: Twardy cel
  - H3: Stany docelowe
  - H3: Stan bieżący
  - H3: Pozostała praca
  - H3: Nie powoduj regresji
  - H2: Założenia z czytania kodu
  - H2: Ustalenia z czytania kodu
  - H2: Bieżący kształt kodu
  - H2: Docelowy kształt schematu
  - H2: Kształt migracji Doctor
  - H2: Inwentarz migracji
  - H2: Plan migracji
  - H3: Faza 0: Zamrożenie granicy
  - H3: Faza 1: Dokończenie globalnej płaszczyzny sterowania
  - H3: Faza 2: Wprowadzenie baz danych na agenta
  - H3: Faza 3: Zastąpienie API magazynu sesji
  - H3: Faza 4: Przeniesienie transkryptów, strumieni ACP, trajektorii i VFS
  - H3: Faza 5: Kopia zapasowa, odtwarzanie, vacuum i weryfikacja
  - H3: Faza 6: Runtime workera
  - H3: Faza 7: Usunięcie starego świata
  - H2: Kopia zapasowa i odtwarzanie
  - H2: Plan refaktoryzacji runtime
  - H2: Reguły wydajności
  - H2: Zakazy statyczne
  - H2: Kryteria ukończenia

## refactor/ingress-core.md

- Trasa: /refactor/ingress-core
- Nagłówki:
  - H1: Plan usunięcia rdzenia wejścia
  - H2: Budżet
  - H2: Diagnoza
  - H2: Punkty zapalne
  - H2: Bieżące czytanie kodu
  - H2: Granica
  - H2: Reguła akceptacji
  - H2: Pakiety prac
  - H2: Fale usuwania
  - H2: Nie przenosić
  - H2: Weryfikacja
  - H2: Kryteria zakończenia

## reference/AGENTS.default.md

- Trasa: /reference/AGENTS.default
- Nagłówki:
  - H2: Pierwsze uruchomienie (zalecane)
  - H2: Domyślne ustawienia bezpieczeństwa
  - H2: Wstępna kontrola istniejących rozwiązań
  - H2: Start sesji (wymagane)
  - H2: Dusza (wymagane)
  - H2: Przestrzenie współdzielone (zalecane)
  - H2: System pamięci (zalecane)
  - H2: Narzędzia i Skills
  - H2: Wskazówka dotycząca kopii zapasowej (zalecane)
  - H2: Co robi OpenClaw
  - H2: Podstawowe Skills (włącz w Ustawienia → Skills)
  - H2: Uwagi dotyczące użycia
  - H2: Powiązane

## reference/RELEASING.md

- Trasa: /reference/RELEASING
- Nagłówki:
  - H2: Nazewnictwo wersji
  - H2: Kadencja wydań
  - H2: Lista kontrolna operatora wydania
  - H2: Domknięcie stabilnego main
  - H2: Wstępna kontrola wydania
  - H2: Boksy testowe wydania
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Pakiet
  - H2: Automatyzacja publikacji wydania
  - H2: Dane wejściowe workflow NPM
  - H2: Sekwencja stabilnego wydania npm
  - H2: Odwołania publiczne
  - H2: Powiązane

## reference/api-usage-costs.md

- Trasa: /reference/api-usage-costs
- Nagłówki:
  - H2: Gdzie pojawiają się koszty (czat + CLI)
  - H2: Jak wykrywane są klucze
  - H2: Funkcje, które mogą zużywać klucze
  - H3: 1) Podstawowe odpowiedzi modelu (czat + narzędzia)
  - H3: 2) Rozumienie multimediów (audio/obraz/wideo)
  - H3: 3) Generowanie obrazów i wideo
  - H3: 4) Embeddingi pamięci + wyszukiwanie semantyczne
  - H3: 5) Narzędzie wyszukiwania w sieci
  - H3: 5) Narzędzie pobierania z sieci (Firecrawl)
  - H3: 6) Migawki użycia dostawcy (status/kondycja)
  - H3: 7) Podsumowywanie zabezpieczające Compaction
  - H3: 8) Skanowanie / próbkowanie modelu
  - H3: 9) Rozmowa (mowa)
  - H3: 10) Skills (API firm trzecich)
  - H2: Powiązane

## reference/application-modernization-plan.md

- Trasa: /reference/application-modernization-plan
- Nagłówki:
  - H2: Cel
  - H2: Zasady
  - H2: Faza 1: Audyt bazowy
  - H2: Faza 2: Porządkowanie produktu i UX
  - H2: Faza 3: Wzmocnienie architektury frontendu
  - H2: Faza 4: Wydajność i niezawodność
  - H2: Faza 5: Wzmocnienie typów, kontraktów i testów
  - H2: Faza 6: Dokumentacja i gotowość wydania
  - H2: Zalecany pierwszy wycinek
  - H2: Aktualizacja umiejętności frontendowej

## reference/code-mode.md

- Trasa: /reference/code-mode
- Nagłówki:
  - H2: Co to jest?
  - H2: Dlaczego to jest dobre?
  - H2: Jak to włączyć
  - H2: Przegląd techniczny
  - H2: Status runtime
  - H2: Zakres
  - H2: Terminy
  - H2: Konfiguracja
  - H2: Aktywacja
  - H2: Narzędzia widoczne dla modelu
  - H2: exec
  - H2: wait
  - H2: API runtime gościa
  - H2: Wewnętrzne przestrzenie nazw
  - H3: Cykl życia rejestru
  - H3: Kształt rejestracji
  - H3: Własność i widoczność
  - H3: Reguły serializacji zakresu
  - H3: Prompty
  - H3: Czyszczenie
  - H3: Lista kontrolna testów
  - H2: API wyjścia
  - H2: Katalog narzędzi
  - H2: Interakcja Tool Search
  - H2: Nazwy narzędzi i kolizje
  - H2: Zagnieżdżone wykonywanie narzędzi
  - H2: Stan runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Granica bezpieczeństwa
  - H2: Kody błędów
  - H2: Telemetria
  - H2: Debugowanie
  - H2: Układ implementacji
  - H2: Lista kontrolna walidacji
  - H2: Plan testów E2E
  - H2: Powiązane

## reference/credits.md

- Trasa: /reference/credits
- Nagłówki:
  - H2: Nazwa
  - H2: Podziękowania
  - H2: Główni kontrybutorzy
  - H2: Licencja
  - H2: Powiązane

## reference/device-models.md

- Trasa: /reference/device-models
- Nagłówki:
  - H2: Źródło danych
  - H2: Aktualizowanie bazy danych
  - H2: Powiązane

## reference/full-release-validation.md

- Trasa: /reference/full-release-validation
- Nagłówki:
  - H2: Etapy najwyższego poziomu
  - H2: Etapy kontroli wydania
  - H2: Fragmenty ścieżki wydania Docker
  - H2: Profile wydania
  - H2: Dodatki tylko dla pełnej walidacji
  - H2: Skupione ponowne uruchomienia
  - H2: Dowody do zachowania
  - H2: Pliki workflow

## reference/memory-config.md

- Trasa: /reference/memory-config
- Nagłówki:
  - H2: Wybór dostawcy
  - H3: Niestandardowe identyfikatory dostawców
  - H3: Rozwiązywanie klucza API
  - H2: Konfiguracja zdalnego punktu końcowego
  - H2: Konfiguracja specyficzna dla dostawcy
  - H3: Limit czasu embeddingów inline
  - H2: Konfiguracja wyszukiwania hybrydowego
  - H3: Pełny przykład
  - H2: Dodatkowe ścieżki pamięci
  - H2: Pamięć multimodalna (Gemini)
  - H2: Pamięć podręczna embeddingów
  - H2: Indeksowanie wsadowe
  - H2: Wyszukiwanie pamięci sesji (eksperymentalne)
  - H2: Przyspieszenie wektorowe SQLite (sqlite-vec)
  - H2: Przechowywanie indeksu
  - H2: Konfiguracja backendu QMD
  - H3: Pełny przykład QMD
  - H2: Dreaming
  - H3: Ustawienia użytkownika
  - H3: Przykład
  - H2: Powiązane

## reference/prompt-caching.md

- Trasa: /reference/prompt-caching
- Nagłówki:
  - H2: Główne pokrętła
  - H3: cacheRetention (domyślne globalne, model i na agenta)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat utrzymujący rozgrzanie
  - H2: Zachowanie dostawcy
  - H3: Anthropic (bezpośrednie API)
  - H3: OpenAI (bezpośrednie API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Modele OpenRouter
  - H3: Inni dostawcy
  - H3: Bezpośrednie API Google Gemini
  - H3: Użycie Gemini CLI
  - H2: Granica pamięci podręcznej promptu systemowego
  - H2: Zabezpieczenia stabilności pamięci podręcznej OpenClaw
  - H2: Wzorce dostrajania
  - H3: Ruch mieszany (zalecane domyślne)
  - H3: Baza z priorytetem kosztów
  - H2: Diagnostyka pamięci podręcznej
  - H2: Testy regresji na żywo
  - H3: Oczekiwania na żywo dla Anthropic
  - H3: Oczekiwania na żywo dla OpenAI
  - H3: Konfiguracja diagnostics.cacheTrace
  - H3: Przełączniki env (jednorazowe debugowanie)
  - H3: Co sprawdzić
  - H2: Szybkie rozwiązywanie problemów
  - H2: Powiązane

## reference/release-performance-sweep.md

- Trasa: /reference/release-performance-sweep
- Nagłówki:
  - H2: Migawka
  - H2: Oś czasu śladu instalacji
  - H2: Co zmieniło się w 5.28
  - H2: Główne liczby
  - H3: Ślad instalacji
  - H3: Rozmiar pakietu npm
  - H2: Podsumowanie tury agenta Kova
  - H2: Sondy źródłowe
  - H2: Audyt śladu instalacji
  - H3: Granica shrinkwrap
  - H2: Interpretacja łańcucha dostaw

## reference/rich-output-protocol.md

- Trasa: /reference/rich-output-protocol
- Nagłówki:
  - H2: [embed ...]
  - H2: Przechowywany kształt renderowania
  - H2: Powiązane

## reference/rpc.md

- Trasa: /reference/rpc
- Nagłówki:
  - H2: Wzorzec A: demon HTTP (signal-cli)
  - H2: Wzorzec B: proces potomny stdio (imsg)
  - H2: Wytyczne dla adapterów
  - H2: Powiązane

## reference/secret-placeholder-conventions.md

- Trasa: /reference/secret-placeholder-conventions
- Nagłówki:
  - H1: Konwencje placeholderów sekretów
  - H2: Zalecany styl
  - H2: Unikaj tych wzorców w dokumentacji
  - H2: Przykład

## reference/secretref-credential-surface.md

- Trasa: /reference/secretref-credential-surface
- Nagłówki:
  - H2: Obsługiwane dane uwierzytelniające
  - H3: Cele openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Cele auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Nieobsługiwane dane uwierzytelniające
  - H2: Powiązane

## reference/session-management-compaction.md

- Trasa: /reference/session-management-compaction
- Nagłówki:
  - H2: Źródło prawdy: Gateway
  - H2: Dwie warstwy trwałości
  - H2: Lokalizacje na dysku
  - H2: Utrzymanie magazynu i kontrolki dysku
  - H2: Sesje Cron i logi uruchomień
  - H2: Klucze sesji (sessionKey)
  - H2: Identyfikatory sesji (sessionId)
  - H2: Schemat magazynu sesji (sessions.json)
  - H2: Struktura transkryptu (.jsonl)
  - H2: Okna kontekstu a śledzone tokeny
  - H2: Compaction: czym jest
  - H2: Granice fragmentów Compaction i parowanie narzędzi
  - H2: Kiedy następuje automatyczna Compaction (runtime OpenClaw)
  - H2: Ustawienia Compaction (reserveTokens, keepRecentTokens)
  - H2: Wymienni dostawcy Compaction
  - H2: Powierzchnie widoczne dla użytkownika
  - H2: Ciche prace porządkowe (NOREPLY)
  - H2: „Opróżnienie pamięci” przed Compaction (zaimplementowane)
  - H2: Lista kontrolna rozwiązywania problemów
  - H2: Powiązane

## reference/templates/AGENTS.dev.md

- Trasa: /reference/templates/AGENTS.dev
- Nagłówki:
  - H1: AGENTS.md - Przestrzeń robocza OpenClaw
  - H2: Pierwsze uruchomienie (jednorazowe)
  - H2: Wskazówka dotycząca kopii zapasowej (zalecane)
  - H2: Domyślne ustawienia bezpieczeństwa
  - H2: Wstępna kontrola istniejących rozwiązań
  - H2: Codzienna pamięć (zalecane)
  - H2: Heartbeats (opcjonalne)
  - H2: Dostosowanie
  - H2: Pamięć pochodzenia C-3PO
  - H3: Dzień narodzin: 2026-01-09
  - H3: Prawdy podstawowe (od Clawd)
  - H2: Powiązane

## reference/templates/BOOT.md

- Trasa: /reference/templates/BOOT
- Nagłówki:
  - H1: BOOT.md
  - H2: Powiązane

## reference/templates/BOOTSTRAP.md

- Trasa: /reference/templates/BOOTSTRAP
- Nagłówki:
  - H1: BOOTSTRAP.md - Witaj, świecie
  - H2: Rozmowa
  - H2: Gdy już wiesz, kim jesteś
  - H2: Połącz (opcjonalnie)
  - H2: Gdy skończysz
  - H2: Powiązane

## reference/templates/HEARTBEAT.md

- Ścieżka: /reference/templates/HEARTBEAT
- Nagłówki:
  - H1: Szablon HEARTBEAT.md
  - H2: Powiązane

## reference/templates/IDENTITY.dev.md

- Ścieżka: /reference/templates/IDENTITY.dev
- Nagłówki:
  - H1: IDENTITY.md - Tożsamość agenta
  - H2: Rola
  - H2: Dusza
  - H2: Relacja z Clawd
  - H2: Dziwactwa
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
  - H2: Moje dziwactwa
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
  - H2: Klimat
  - H2: Ciągłość
  - H2: Powiązane

## reference/templates/TOOLS.dev.md

- Ścieżka: /reference/templates/TOOLS.dev
- Nagłówki:
  - H1: TOOLS.md - Notatki użytkownika o narzędziach (edytowalne)
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
  - H2: Po co rozdzielać?
  - H2: Powiązane

## reference/templates/USER.dev.md

- Ścieżka: /reference/templates/USER.dev
- Nagłówki:
  - H1: USER.md - Profil użytkownika
  - H2: Powiązane

## reference/templates/USER.md

- Ścieżka: /reference/templates/USER
- Nagłówki:
  - H1: USER.md - O Twoim człowieku
  - H2: Kontekst
  - H2: Powiązane

## reference/test.md

- Ścieżka: /reference/test
- Nagłówki:
  - H2: Lokalna bramka PR
  - H2: Benchmark opóźnień modeli (lokalne klucze)
  - H2: Benchmark uruchamiania CLI
  - H2: Benchmark uruchamiania Gateway
  - H2: Benchmark restartu Gateway
  - H2: E2E onboardingu (Docker)
  - H2: Smoke test importu QR (Docker)
  - H2: Powiązane

## reference/token-use.md

- Ścieżka: /reference/token-use
- Nagłówki:
  - H2: Jak budowany jest prompt systemowy
  - H2: Co wlicza się do okna kontekstu
  - H2: Jak zobaczyć bieżące użycie tokenów
  - H2: Szacowanie kosztów (gdy jest wyświetlane)
  - H2: Wpływ TTL cache i przycinania
  - H3: Przykład: utrzymuj 1-godzinny cache w cieple za pomocą heartbeat
  - H3: Przykład: ruch mieszany ze strategią cache per agent
  - H3: Kontekst Anthropic 1M
  - H2: Wskazówki dotyczące zmniejszania presji tokenów
  - H2: Powiązane

## reference/transcript-hygiene.md

- Ścieżka: /reference/transcript-hygiene
- Nagłówki:
  - H2: Reguła globalna: kontekst runtime nie jest transkrypcją użytkownika
  - H2: Gdzie to działa
  - H2: Reguła globalna: sanityzacja obrazów
  - H2: Reguła globalna: nieprawidłowo sformatowane wywołania narzędzi
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
  - H3: Niezawodność dostarczania kanałów
  - H3: Odzyskiwanie dostawców i modeli
  - H3: Ciągłość sesji, pamięci i zaufania
  - H3: Tryb przekaźnika routera Slack
  - H3: Most wybudzania Raft External Agent
  - H3: Instalacja i naprawa oficjalnych pluginów
  - H2: Kanały i wiadomości
  - H3: Dodatkowe poprawki kanałów
  - H2: Gateway, bezpieczeństwo i zaufanie
  - H3: Odzyskiwanie po restarcie i gotowości
  - H3: Dostarczanie wyników zdalnych i multimediów
  - H2: Klienci i interfejsy
  - H3: Wysyłanie przez klienta i ponowne połączenia
  - H3: Poprawki interfejsu, ustawień i onboardingu
  - H2: Dokumentacja i narzędzia administracyjne
  - H3: Niezawodność konfiguracji i poleceń
  - H3: Narzędzia i prace zaplanowane

## releases/index.md

- Ścieżka: /releases
- Nagłówki:
  - H1: Informacje o wydaniach
  - H2: Wydania
  - H2: Surowa historia wydań

## security/CONTRIBUTING-THREAT-MODEL.md

- Ścieżka: /security/CONTRIBUTING-THREAT-MODEL
- Nagłówki:
  - H2: Sposoby współtworzenia
  - H3: Dodaj zagrożenie
  - H3: Zaproponuj mitygację
  - H3: Zaproponuj łańcuch ataku
  - H3: Napraw lub ulepsz istniejącą treść
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
  - H3: 3.1 Rekonesans (AML.TA0002)
  - H4: T-RECON-001: Wykrywanie punktów końcowych agenta
  - H4: T-RECON-002: Sondowanie integracji kanałów
  - H3: 3.2 Dostęp początkowy (AML.TA0004)
  - H4: T-ACCESS-001: Przechwycenie kodu parowania
  - H4: T-ACCESS-002: Podszywanie się pod AllowFrom
  - H4: T-ACCESS-003: Kradzież tokenu
  - H3: 3.3 Wykonanie (AML.TA0005)
  - H4: T-EXEC-001: Bezpośredni prompt injection
  - H4: T-EXEC-002: Pośredni prompt injection
  - H4: T-EXEC-003: Wstrzyknięcie argumentów narzędzia
  - H4: T-EXEC-004: Obejście zatwierdzenia exec
  - H3: 3.4 Utrwalanie (AML.TA0006)
  - H4: T-PERSIST-001: Instalacja złośliwego Skill
  - H4: T-PERSIST-002: Zatruwanie aktualizacji Skill
  - H4: T-PERSIST-003: Manipulowanie konfiguracją agenta
  - H3: 3.5 Unikanie obrony (AML.TA0007)
  - H4: T-EVADE-001: Obejście wzorca moderacji
  - H4: T-EVADE-002: Ucieczka z opakowania treści
  - H3: 3.6 Odkrywanie (AML.TA0008)
  - H4: T-DISC-001: Enumeracja narzędzi
  - H4: T-DISC-002: Ekstrakcja danych sesji
  - H3: 3.7 Zbieranie i eksfiltracja (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Kradzież danych przez webfetch
  - H4: T-EXFIL-002: Nieautoryzowane wysyłanie wiadomości
  - H4: T-EXFIL-003: Pozyskiwanie danych uwierzytelniających
  - H3: 3.8 Wpływ (AML.TA0011)
  - H4: T-IMPACT-001: Nieautoryzowane wykonanie polecenia
  - H4: T-IMPACT-002: Wyczerpanie zasobów (DoS)
  - H4: T-IMPACT-003: Szkoda reputacyjna
  - H2: 4. Analiza łańcucha dostaw ClawHub
  - H3: 4.1 Bieżące mechanizmy kontroli bezpieczeństwa
  - H3: 4.2 Wzorce flag moderacji
  - H3: 4.3 Planowane ulepszenia
  - H2: 5. Macierz ryzyka
  - H3: 5.1 Prawdopodobieństwo a wpływ
  - H3: 5.2 Krytyczne ścieżki łańcuchów ataku
  - H2: 6. Podsumowanie rekomendacji
  - H3: 6.1 Natychmiastowe (P0)
  - H3: 6.2 Krótkoterminowe (P1)
  - H3: 6.3 Średnioterminowe (P2)
  - H2: 7. Załączniki
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
  - H3: Ekspozycja Gateway i błędna konfiguracja otwartego gateway
  - H3: Potok exec Node (możliwość najwyższego ryzyka)
  - H3: Magazyn parowania (bramkowanie DM)
  - H3: Bramkowanie ingress (wzmianki + obejście polecenia sterującego)
  - H3: Izolacja routingu/klucza sesji
  - H2: v1++: dodatkowe modele ograniczone (współbieżność, ponowienia, poprawność śladu)
  - H3: Współbieżność / idempotencja magazynu parowania
  - H3: Korelacja śladu ingress / idempotencja
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
  - H2: Jak OpenClaw kieruje ruch
  - H2: Powiązane terminy proxy
  - H2: Konfiguracja
  - H3: Tryb loopback Gateway
  - H2: Wymagania proxy
  - H2: Zalecane zablokowane miejsca docelowe
  - H2: Walidacja
  - H2: Zaufanie do CA proxy
  - H2: Limity

## specs/claw-supervisor.md

- Ścieżka: /specs/claw-supervisor
- Nagłówki:
  - H1: Claw Supervisor
  - H2: Cel
  - H2: Model produktu
  - H2: Architektura
  - H2: Kontrakt serwera aplikacji Codex
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
  - H2: Podstawowe pojęcia
  - H2: Dostawcy + ingress
  - H2: Gateway + operacje
  - H2: Narzędzia + automatyzacja
  - H2: Węzły, multimedia, głos
  - H2: Platformy
  - H2: Aplikacja towarzysząca macOS (zaawansowane)
  - H2: Pluginy
  - H2: Workspace + szablony
  - H2: Projekt
  - H2: Testowanie + wydanie
  - H2: Powiązane

## start/lore.md

- Ścieżka: /start/lore
- Nagłówki:
  - H1: Lore OpenClaw 🦞📖
  - H2: Historia pochodzenia
  - H2: Pierwsze linienie (27 stycznia 2026)
  - H2: Nazwa
  - H2: Dalekowie kontra homary
  - H2: Kluczowe postacie
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Wielkie incydenty
  - H3: Zrzut katalogu (3 gru 2025)
  - H3: Wielkie linienie (27 sty 2026)
  - H3: Ostateczna forma (30 stycznia 2026)
  - H3: Zakupowe szaleństwo robota (3 gru 2025)
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
  - H2: Niestandardowi lub niewymienieni dostawcy
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
  - H2: 5-minutowy szybki start
  - H2: Daj agentowi workspace (AGENTS)
  - H2: Konfiguracja, która zamienia go w „asystenta”
  - H2: Sesje i pamięć
  - H2: Heartbeats (tryb proaktywny)
  - H2: Multimedia na wejściu i wyjściu
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
  - H2: Wymagania wstępne (ze źródła)
  - H2: Strategia dostosowywania (aby aktualizacje nie szkodziły)
  - H2: Uruchom Gateway z tego repozytorium
  - H2: Stabilny workflow (najpierw aplikacja macOS)
  - H2: Workflow na granicy zmian (Gateway w terminalu)
  - H3: 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródła
  - H3: 1) Uruchom deweloperski Gateway
  - H3: 2) Skieruj aplikację macOS do działającego Gateway
  - H3: 3) Zweryfikuj
  - H3: Typowe pułapki
  - H2: Mapa przechowywania danych uwierzytelniających
  - H2: Aktualizacja (bez niszczenia konfiguracji)
  - H2: Linux (usługa użytkownika systemd)
  - H2: Powiązane dokumenty

## start/showcase.md

- Ścieżka: /start/showcase
- Nagłówki:
  - H2: Świeżo z Discord
  - H2: Automatyzacja i workflowy
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
  - H2: Powiązana dokumentacja

## start/wizard.md

- Ścieżka: /start/wizard
- Nagłówki:
  - H2: Ustawienia regionalne
  - H2: QuickStart kontra Zaawansowane
  - H2: Co konfiguruje wdrażanie
  - H2: Dodaj kolejnego agenta
  - H2: Pełna dokumentacja referencyjna
  - H2: Powiązana dokumentacja

## tools/acp-agents-setup.md

- Ścieżka: /tools/acp-agents-setup
- Nagłówki:
  - H2: Obsługa uprzęży acpx (bieżąca)
  - H2: Wymagana konfiguracja
  - H2: Konfiguracja Plugin dla backendu acpx
  - H3: Konfiguracja polecenia i wersji acpx
  - H3: Automatyczna instalacja zależności
  - H3: Most MCP narzędzi Plugin
  - H3: Most MCP narzędzi OpenClaw
  - H3: Konfiguracja limitu czasu operacji środowiska wykonawczego
  - H3: Konfiguracja agenta sondy kondycji
  - H2: Konfiguracja uprawnień
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguracja
  - H2: Powiązane

## tools/acp-agents.md

- Ścieżka: /tools/acp-agents
- Nagłówki:
  - H2: Której strony potrzebuję?
  - H2: Czy to działa od razu po instalacji?
  - H2: Obsługiwane cele uprzęży
  - H2: Podręcznik operatora
  - H2: ACP kontra podagenci
  - H2: Jak ACP uruchamia Claude Code
  - H2: Powiązane sesje
  - H3: Model mentalny
  - H3: Wiązania bieżącej konwersacji
  - H2: Trwałe powiązania kanałów
  - H3: Model wiązania
  - H3: Domyślne ustawienia środowiska wykonawczego dla agenta
  - H3: Przykład
  - H3: Zachowanie
  - H2: Uruchamianie sesji ACP
  - H3: parametry sessionsspawn
  - H2: Tryby spawn bind i wątków
  - H2: Model dostarczania
  - H2: Zgodność z piaskownicą
  - H2: Rozpoznawanie celu sesji
  - H2: Kontrolki ACP
  - H3: Mapowanie opcji środowiska wykonawczego
  - H2: Uprząż acpx, konfiguracja Plugin i uprawnienia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/agent-send.md

- Ścieżka: /tools/agent-send
- Nagłówki:
  - H2: Szybki start
  - H2: Flagi
  - H2: Zachowanie
  - H2: Przykłady
  - H2: Powiązane

## tools/apply-patch.md

- Ścieżka: /tools/apply-patch
- Nagłówki:
  - H2: Parametry
  - H2: Uwagi
  - H2: Przykład
  - H2: Powiązane

## tools/brave-search.md

- Ścieżka: /tools/brave-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Przykład konfiguracji
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/browser-control.md

- Ścieżka: /tools/browser-control
- Nagłówki:
  - H2: API sterowania (opcjonalne)
  - H3: Kontrakt błędu /act
  - H3: Wymaganie Playwright
  - H4: Instalacja Docker Playwright
  - H2: Jak to działa (wewnętrznie)
  - H2: Szybka dokumentacja CLI
  - H2: Migawki i odwołania
  - H2: Ulepszenia oczekiwania
  - H2: Przepływy debugowania
  - H2: Dane wyjściowe JSON
  - H2: Stan i opcje środowiskowe
  - H2: Bezpieczeństwo i prywatność
  - H2: Powiązane

## tools/browser-linux-troubleshooting.md

- Ścieżka: /tools/browser-linux-troubleshooting
- Nagłówki:
  - H2: Problem: „Failed to start Chrome CDP on port 18800”
  - H3: Przyczyna źródłowa
  - H3: Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)
  - H3: Rozwiązanie 2: Użyj Snap Chromium w trybie Attach-Only
  - H3: Weryfikacja działania przeglądarki
  - H3: Dokumentacja konfiguracji
  - H3: Problem: „No Chrome tabs found for profile=\"user\"”
  - H2: Powiązane

## tools/browser-login.md

- Ścieżka: /tools/browser-login
- Nagłówki:
  - H2: Ręczne logowanie (zalecane)
  - H2: Który profil Chrome jest używany?
  - H2: X/Twitter: zalecany przepływ
  - H2: Piaskownica i dostęp do przeglądarki hosta
  - H2: Powiązane

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Ścieżka: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Nagłówki:
  - H2: Najpierw wybierz właściwy tryb przeglądarki
  - H3: Opcja 1: Surowy zdalny CDP z WSL2 do Windows
  - H3: Opcja 2: Lokalny dla hosta Chrome MCP
  - H2: Działająca architektura
  - H2: Dlaczego ta konfiguracja jest myląca
  - H2: Krytyczna reguła dla Control UI
  - H2: Waliduj warstwami
  - H3: Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows
  - H3: Warstwa 2: Sprawdź, czy WSL2 może połączyć się z tym punktem końcowym Windows
  - H3: Warstwa 3: Skonfiguruj właściwy profil przeglądarki
  - H3: Warstwa 4: Zweryfikuj osobno warstwę Control UI
  - H3: Warstwa 5: Zweryfikuj kompleksowe sterowanie przeglądarką
  - H2: Częste mylące błędy
  - H2: Szybka lista kontrolna triage
  - H2: Praktyczny wniosek
  - H2: Powiązane

## tools/browser.md

- Ścieżka: /tools/browser
- Nagłówki:
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Sterowanie Plugin
  - H2: Wskazówki dla agenta
  - H2: Brakujące polecenie lub narzędzie przeglądarki
  - H2: Profile: openclaw kontra użytkownik
  - H2: Konfiguracja
  - H3: Wizja zrzutów ekranu (obsługa modeli tylko tekstowych)
  - H2: Użyj Brave lub innej przeglądarki opartej na Chromium
  - H2: Sterowanie lokalne kontra zdalne
  - H2: Proxy przeglądarki Node (domyślne bez konfiguracji)
  - H2: Browserless (hostowany zdalny CDP)
  - H3: Browserless Docker na tym samym hoście
  - H2: Bezpośredni dostawcy WebSocket CDP
  - H3: Browserbase
  - H3: Notte
  - H2: Bezpieczeństwo
  - H2: Profile (wiele przeglądarek)
  - H2: Istniejąca sesja przez Chrome DevTools MCP
  - H3: Niestandardowe uruchamianie Chrome MCP
  - H2: Gwarancje izolacji
  - H2: Wybór przeglądarki
  - H2: API sterowania (opcjonalne)
  - H2: Rozwiązywanie problemów
  - H3: Błąd uruchamiania CDP kontra blokada SSRF nawigacji
  - H2: Narzędzia agenta i sposób działania sterowania
  - H2: Powiązane

## tools/btw.md

- Ścieżka: /tools/btw
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

- Ścieżka: /tools/capability-cookbook
- Nagłówki:
  - H2: Powiązane

## tools/clawhub.md

- Ścieżka: /tools/clawhub
- Nagłówki: brak

## tools/code-execution.md

- Ścieżka: /tools/code-execution
- Nagłówki:
  - H2: Konfiguracja
  - H2: Jak tego używać
  - H2: Błędy
  - H2: Limity
  - H2: Powiązane

## tools/creating-skills.md

- Ścieżka: /tools/creating-skills
- Nagłówki:
  - H2: Utwórz swój pierwszy skill
  - H2: Dokumentacja SKILL.md
  - H3: Wymagane pola
  - H3: Opcjonalne klucze frontmatter
  - H3: Używanie {baseDir}
  - H2: Dodawanie aktywacji warunkowej
  - H2: Zaproponuj przez Skill Workshop
  - H2: Publikowanie w ClawHub
  - H2: Najlepsze praktyki
  - H2: Powiązane

## tools/diffs.md

- Ścieżka: /tools/diffs
- Nagłówki:
  - H2: Szybki start
  - H2: Wyłącz wbudowane wskazówki systemowe
  - H2: Typowy przepływ agenta
  - H2: Przykłady danych wejściowych
  - H2: Dokumentacja danych wejściowych narzędzia
  - H2: Podświetlanie składni
  - H2: Kontrakt szczegółów danych wyjściowych
  - H2: Zwinięte niezmienione sekcje
  - H2: Domyślne ustawienia Plugin
  - H3: Konfiguracja trwałego URL przeglądarki
  - H2: Konfiguracja bezpieczeństwa
  - H2: Cykl życia i przechowywanie artefaktów
  - H2: URL przeglądarki i zachowanie sieciowe
  - H2: Model bezpieczeństwa
  - H2: Wymagania przeglądarki dla trybu plikowego
  - H2: Rozwiązywanie problemów
  - H2: Wskazówki operacyjne
  - H2: Powiązane

## tools/duckduckgo-search.md

- Ścieżka: /tools/duckduckgo-search
- Nagłówki:
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/elevated.md

- Ścieżka: /tools/elevated
- Nagłówki:
  - H2: Dyrektywy
  - H2: Jak to działa
  - H2: Kolejność rozpoznawania
  - H2: Dostępność i listy dozwolonych
  - H2: Czego elevated nie kontroluje
  - H2: Powiązane

## tools/exa-search.md

- Ścieżka: /tools/exa-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Nadpisanie bazowego URL
  - H2: Parametry narzędzia
  - H3: Wyodrębnianie treści
  - H3: Tryby wyszukiwania
  - H2: Uwagi
  - H2: Powiązane

## tools/exec-approvals-advanced.md

- Ścieżka: /tools/exec-approvals-advanced
- Nagłówki:
  - H2: Bezpieczne binaria (tylko stdin)
  - H3: Walidacja argv i odrzucone flagi
  - H3: Zaufane katalogi binarne
  - H3: Łączenie powłoki, wrappery i multipleksery
  - H3: Bezpieczne binaria kontra lista dozwolonych
  - H2: Polecenia interpretera/środowiska wykonawczego
  - H3: Zachowanie dostarczania kontynuacji
  - H2: Przekazywanie zatwierdzeń do kanałów czatu
  - H3: Przekazywanie zatwierdzeń Plugin
  - H3: Zatwierdzenia w tym samym czacie na dowolnym kanale
  - H3: Natywne dostarczanie zatwierdzeń
  - H3: Przepływ IPC macOS
  - H2: FAQ
  - H3: Kiedy accountId i threadId byłyby używane w celu zatwierdzenia?
  - H3: Gdy zatwierdzenia są wysyłane do sesji, czy każdy w tej sesji może je zatwierdzić?
  - H2: Powiązane

## tools/exec-approvals.md

- Ścieżka: /tools/exec-approvals
- Nagłówki:
  - H2: Inspekcja efektywnej polityki
  - H2: Gdzie ma zastosowanie
  - H3: Model zaufania
  - H3: Podział macOS
  - H2: Ustawienia i przechowywanie
  - H2: Opcje polityki
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Tryb YOLO (bez zatwierdzeń)
  - H3: Trwała konfiguracja „nigdy nie pytaj” dla hosta Gateway
  - H3: Skrót lokalny
  - H3: Host Node
  - H3: Skrót tylko dla sesji
  - H2: Lista dozwolonych (na agenta)
  - H3: Ograniczanie argumentów za pomocą argPattern
  - H2: Automatyczne zezwalanie na CLI Skills
  - H2: Bezpieczne binaria i przekazywanie zatwierdzeń
  - H2: Edycja w Control UI
  - H2: Przepływ zatwierdzania
  - H2: Zdarzenia systemowe
  - H2: Zachowanie przy odrzuconym zatwierdzeniu
  - H2: Implikacje
  - H2: Powiązane

## tools/exec.md

- Ścieżka: /tools/exec
- Nagłówki:
  - H2: Parametry
  - H2: Konfiguracja
  - H3: Obsługa PATH
  - H2: Nadpisania sesji (/exec)
  - H2: Model autoryzacji
  - H2: Zatwierdzenia exec (aplikacja towarzysząca / host node)
  - H2: Lista dozwolonych + bezpieczne binaria
  - H2: Przykłady
  - H2: applypatch
  - H2: Powiązane

## tools/firecrawl.md

- Ścieżka: /tools/firecrawl
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: webfetch bez klucza i klucze API
  - H2: Skonfiguruj wyszukiwanie Firecrawl
  - H2: Skonfiguruj fallback webfetch Firecrawl
  - H3: Samodzielnie hostowany Firecrawl
  - H2: Narzędzia Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Ukrywanie działania / obchodzenie botów
  - H2: Jak webfetch używa Firecrawl
  - H2: Powiązane

## tools/gemini-search.md

- Ścieżka: /tools/gemini-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Wybór modelu
  - H2: Nadpisania bazowego URL
  - H2: Powiązane

## tools/goal.md

- Ścieżka: /tools/goal
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

- Ścieżka: /tools/grok-search
- Nagłówki:
  - H2: Wdrażanie i konfiguracja
  - H2: Zaloguj się lub uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Nadpisania bazowego URL
  - H2: Powiązane

## tools/image-generation.md

- Ścieżka: /tools/image-generation
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
  - H2: Szczegółowe omówienia dostawców
  - H2: Przykłady
  - H2: Powiązane

## tools/index.md

- Ścieżka: /tools
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Wybierz narzędzia, Skills lub plugins
  - H2: Kategorie wbudowanych narzędzi
  - H2: Narzędzia dostarczane przez Plugin
  - H2: Konfiguruj dostęp i zatwierdzenia
  - H2: Rozszerz możliwości
  - H2: Rozwiąż problemy z brakującymi narzędziami
  - H2: Powiązane

## tools/kimi-search.md

- Ścieżka: /tools/kimi-search
- Nagłówki:
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Jak to działa
  - H2: Obsługiwane parametry
  - H2: Powiązane

## tools/llm-task.md

- Ścieżka: /tools/llm-task
- Nagłówki:
  - H2: Włącz Plugin
  - H2: Konfiguracja (opcjonalna)
  - H2: Parametry narzędzia
  - H2: Dane wyjściowe
  - H2: Przykład: krok przepływu Lobster
  - H3: Ważne ograniczenie
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Powiązane

## tools/lobster.md

- Ścieżka: /tools/lobster
- Nagłówki:
  - H2: Hak
  - H2: Dlaczego
  - H2: Dlaczego DSL zamiast zwykłych programów?
  - H2: Jak to działa
  - H2: Wzorzec: małe CLI + potoki JSON + zatwierdzenia
  - H2: Kroki LLM tylko JSON (llm-task)
  - H3: Ważne ograniczenie: osadzony Lobster kontra openclaw.invoke
  - H2: Pliki przepływów pracy (.lobster)
  - H2: Zainstaluj Lobster
  - H2: Włącz narzędzie
  - H2: Przykład: triage poczty e-mail
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

- Ścieżka: /tools/loop-detection
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
  - H2: Asynchronicznie a synchronicznie
  - H2: Zamiana mowy na tekst i połączenia głosowe
  - H2: Mapowania dostawców (jak dostawcy dzielą się między powierzchnie)
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
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Uwagi
  - H2: Powiązane

## tools/parallel-search.md

- Ścieżka: /tools/parallel-search
- Nagłówki:
  - H2: Zainstaluj plugin
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
  - H2: Odwołanie wejściowe
  - H2: Obsługiwane odwołania PDF
  - H2: Tryby wykonywania
  - H3: Tryb natywnego dostawcy
  - H3: Tryb awaryjnego wyodrębniania
  - H2: Konfiguracja
  - H2: Szczegóły wyjścia
  - H2: Zachowanie przy błędach
  - H2: Przykłady
  - H2: Powiązane

## tools/permission-modes.md

- Ścieżka: /tools/permission-modes
- Nagłówki:
  - H2: Zalecane ustawienie domyślne
  - H2: Tryby wykonywania hosta OpenClaw
  - H2: Mapowanie Codex Guardian
  - H2: Uprawnienia uprzęży ACPX
  - H2: Wybór trybu
  - H2: Powiązane

## tools/perplexity-search.md

- Ścieżka: /tools/perplexity-search
- Nagłówki:
  - H2: Zainstaluj plugin
  - H2: Uzyskanie klucza API Perplexity
  - H2: Zgodność z OpenRouter
  - H2: Przykłady konfiguracji
  - H3: Natywne API Perplexity Search
  - H3: Zgodność OpenRouter / Sonar
  - H2: Gdzie ustawić klucz
  - H2: Parametry narzędzia
  - H3: Reguły filtrowania domen
  - H2: Uwagi
  - H2: Powiązane

## tools/plugin.md

- Ścieżka: /tools/plugin
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Konfiguracja
  - H3: Wybierz źródło instalacji
  - H3: Polityka instalacji operatora
  - H3: Skonfiguruj politykę pluginów
  - H2: Zrozum formaty pluginów
  - H2: Hooki pluginów
  - H2: Zweryfikuj aktywny Gateway
  - H2: Rozwiązywanie problemów
  - H3: Zablokowana własność ścieżki pluginu
  - H3: Powolna konfiguracja narzędzi pluginu
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
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Zmienna środowiskowa
  - H2: Odwołanie konfiguracji pluginu
  - H2: Uwagi
  - H2: Powiązane

## tools/skill-workshop.md

- Ścieżka: /tools/skill-workshop
- Nagłówki:
  - H2: Jak to działa
  - H2: Cykl życia
  - H2: Czat
  - H2: CLI
  - H2: Zawartość propozycji
  - H2: Pliki pomocnicze
  - H2: Narzędzie agenta
  - H2: Zatwierdzanie i autonomia
  - H2: Metody Gateway
  - H2: Magazyn
  - H2: Limity
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/skills-config.md

- Ścieżka: /tools/skills-config
- Nagłówki:
  - H2: Ładowanie (skills.load)
  - H2: Instalacja (skills.install)
  - H2: Polityka instalacji operatora (security.installPolicy)
  - H2: Lista dozwolonych dołączonych Skills
  - H2: Wpisy poszczególnych Skills (skills.entries)
  - H2: Listy dozwolonych agentów (agents)
  - H2: Warsztat (skills.workshop)
  - H2: Dowiązane symbolicznie katalogi główne Skills
  - H2: Skills w piaskownicy i zmienne środowiskowe
  - H2: Przypomnienie o kolejności ładowania
  - H2: Powiązane

## tools/skills.md

- Ścieżka: /tools/skills
- Nagłówki:
  - H2: Kolejność ładowania
  - H2: Skills na agenta a współdzielone Skills
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
  - H3: Polecenia Docka
  - H3: Polecenia dołączonych pluginów
  - H3: Polecenia Skills
  - H2: /tools — czego agent może teraz użyć
  - H2: /model — wybór modelu
  - H2: /config — zapisy konfiguracji na dysku
  - H2: /mcp — konfiguracja serwera MCP
  - H2: /debug — nadpisania tylko w czasie działania
  - H2: /plugins — zarządzanie pluginami
  - H2: /trace — wyjście śladu pluginu
  - H2: /btw — pytania poboczne
  - H2: Uwagi dotyczące powierzchni
  - H2: Użycie i status dostawcy
  - H2: Powiązane

## tools/steer.md

- Ścieżka: /tools/steer
- Nagłówki:
  - H2: Bieżąca sesja
  - H2: Sterowanie a kolejka
  - H2: Subagenci
  - H2: Sesje ACP
  - H2: Powiązane

## tools/subagents.md

- Ścieżka: /tools/subagents
- Nagłówki:
  - H2: Polecenie ukośnika
  - H3: Kontrolki powiązania wątku
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
  - H3: Kontrolki ręczne
  - H3: Przełączniki konfiguracji
  - H3: Lista dozwolonych
  - H3: Wykrywanie
  - H3: Automatyczna archiwizacja
  - H2: Zagnieżdżeni subagenci
  - H3: Poziomy głębokości
  - H3: Łańcuch ogłaszania
  - H3: Polityka narzędzi według głębokości
  - H3: Limit tworzenia na agenta
  - H3: Kaskadowe zatrzymanie
  - H2: Uwierzytelnianie
  - H2: Ogłaszanie
  - H3: Kontekst ogłaszania
  - H3: Wiersz statystyk
  - H3: Dlaczego preferować sessionshistory
  - H2: Polityka narzędzi
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
  - H2: Odwołanie narzędzia
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Wybór właściwego narzędzia
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## tools/thinking.md

- Ścieżka: /tools/thinking
- Nagłówki:
  - H2: Co robi
  - H2: Kolejność rozwiązywania
  - H2: Ustawianie domyślnej wartości sesji
  - H2: Zastosowanie według agenta
  - H2: Tryb szybki (/fast)
  - H2: Dyrektywy szczegółowości (/verbose lub /v)
  - H2: Dyrektywy śladu pluginu (/trace)
  - H2: Widoczność rozumowania (/reasoning)
  - H2: Powiązane
  - H2: Heartbeats
  - H2: Interfejs czatu WWW
  - H2: Profile dostawców

## tools/tokenjuice.md

- Ścieżka: /tools/tokenjuice
- Nagłówki:
  - H2: Włącz plugin
  - H2: Co zmienia tokenjuice
  - H2: Zweryfikuj, że działa
  - H2: Wyłącz plugin
  - H2: Powiązane

## tools/tool-search.md

- Ścieżka: /tools/tool-search
- Nagłówki:
  - H2: Jak przebiega tura
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
  - H2: Dostosuj limit czasu opróżniania
  - H2: Prywatność i limity
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/tts.md

- Ścieżka: /tools/tts
- Nagłówki:
  - H2: Szybki start
  - H2: Obsługiwani dostawcy
  - H2: Konfiguracja
  - H3: Nadpisania głosu na agenta
  - H2: Persony
  - H3: Minimalna persona
  - H3: Pełna persona (prompt niezależny od dostawcy)
  - H3: Rozwiązywanie persony
  - H3: Jak dostawcy używają promptów persony
  - H3: Polityka awaryjna
  - H2: Dyrektywy sterowane przez model
  - H2: Polecenia ukośnika
  - H2: Preferencje na użytkownika
  - H2: Formaty wyjściowe (stałe)
  - H2: Zachowanie Auto-TTS
  - H2: Formaty wyjściowe według kanału
  - H2: Odwołanie pól
  - H2: Narzędzie agenta
  - H2: RPC Gateway
  - H2: Łącza usług
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
  - H2: Działania
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
  - H2: Awaryjny Firecrawl
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
  - H2: Natywne wyszukiwanie WWW OpenAI
  - H2: Natywne wyszukiwanie WWW Codex
  - H2: Bezpieczeństwo sieci
  - H2: Konfigurowanie wyszukiwania WWW
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
  - H2: Jak działają konfiguracje chmurowe
  - H2: Najpierw wzmocnij dostęp administracyjny
  - H2: Współdzielony agent firmowy na VPS
  - H2: Używanie węzłów z VPS
  - H2: Dostosowanie uruchamiania dla małych VM i hostów ARM
  - H3: Lista kontrolna dostosowania systemd (opcjonalna)
  - H2: Powiązane

## web/control-ui.md

- Ścieżka: /web/control-ui
- Nagłówki:
  - H2: Szybkie otwarcie (lokalne)
  - H2: Parowanie urządzenia (pierwsze połączenie)
  - H2: Tożsamość osobista (lokalna dla przeglądarki)
  - H2: Punkt końcowy konfiguracji czasu działania
  - H2: Obsługa języków
  - H2: Motywy wyglądu
  - H2: Co potrafi (dzisiaj)
  - H2: Strona MCP
  - H2: Karta aktywności
  - H2: Zachowanie czatu
  - H2: Instalacja PWA i web push
  - H2: Osadzenia hostowane
  - H2: Szerokość wiadomości czatu
  - H2: Dostęp przez tailnet (zalecany)
  - H2: Niezabezpieczony HTTP
  - H2: Polityka bezpieczeństwa treści
  - H2: Uwierzytelnianie trasy awatara
  - H2: Uwierzytelnianie trasy multimediów asystenta
  - H2: Budowanie interfejsu UI
  - H2: Pusta strona Control UI
  - H2: Debugowanie/testowanie: serwer deweloperski + zdalny Gateway
  - H2: Powiązane

## web/dashboard.md

- Ścieżka: /web/dashboard
- Nagłówki:
  - H2: Szybka ścieżka (zalecana)
  - H2: Podstawy uwierzytelniania (lokalne a zdalne)
  - H2: Jeśli widzisz "unauthorized" / 1008
  - H2: Powiązane

## web/index.md

- Ścieżka: /web
- Nagłówki:
  - H2: Webhooks
  - H2: Administracyjne HTTP RPC
  - H2: Konfiguracja (domyślnie włączona)
  - H2: Dostęp Tailscale
  - H3: Zintegrowane udostępnianie (zalecane)
  - H3: Powiązanie tailnet + token
  - H3: Publiczny internet (Funnel)
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Budowanie interfejsu UI

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
  - H2: Polecenia ukośnika
  - H2: Lokalne polecenia powłoki
  - H2: Naprawianie konfiguracji z lokalnego TUI
  - H2: Wyjście narzędzia
  - H2: Kolory terminala
  - H2: Historia + strumieniowanie
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
  - H2: Jak to działa (zachowanie)
  - H3: Model transkrypcji i dostarczania
  - H2: Panel narzędzi agentów Control UI
  - H2: Użycie zdalne
  - H2: Dokumentacja konfiguracji (WebChat)
  - H2: Powiązane
