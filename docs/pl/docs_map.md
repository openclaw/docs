---
read_when: Finding which docs page covers a topic before reading the page
summary: Wygenerowana mapa nagłówków dla stron dokumentacji OpenClaw
title: Mapa dokumentacji
x-i18n:
    generated_at: "2026-06-30T14:31:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9526e7b1db302e55d7e598900c7f6db45369ef924946ba8cc0da621482f21cd1
    source_path: docs_map.md
    workflow: 16
---

# Mapa dokumentacji OpenClaw

Ten plik jest generowany z nagłówków `docs/**/*.md` i `docs/**/*.mdx`, aby pomagać agentom poruszać się po drzewie dokumentacji.
Nie edytuj go ręcznie; uruchom `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Trasa: /agent-runtime-architecture
- Nagłówki:
  - H2: Układ środowiska uruchomieniowego
  - H2: Granice
  - H2: Manifesty
  - H2: Wybór środowiska uruchomieniowego
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
  - H2: Stabilne kody przyczyn sondowania
  - H2: Poświadczenia tokenów
  - H3: Reguły kwalifikowalności
  - H3: Reguły rozstrzygania
  - H2: Przenośność kopii agenta
  - H2: Trasy uwierzytelniania tylko z konfiguracji
  - H2: Jawne filtrowanie kolejności uwierzytelniania
  - H2: Rozstrzyganie celu sondowania
  - H2: Wykrywanie poświadczeń zewnętrznego CLI
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
  - H3: Opcje ładunku dla zadań izolowanych
  - H2: Dostarczanie i dane wyjściowe
  - H2: Język danych wyjściowych
  - H2: Przykłady CLI
  - H2: Webhook
  - H3: Uwierzytelnianie
  - H2: Integracja Gmail PubSub
  - H3: Konfiguracja kreatorem (zalecana)
  - H3: Automatyczne uruchamianie Gateway
  - H3: Jednorazowa konfiguracja ręczna
  - H3: Nadpisanie modelu Gmail
  - H2: Zarządzanie zadaniami
  - H2: Konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Drabinka poleceń
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
  - H2: Dokumentacja CLI
  - H2: Najlepsze praktyki
  - H2: Rozwiązywanie problemów
  - H3: Hook nie został wykryty
  - H3: Hook nie kwalifikuje się
  - H3: Hook nie jest wykonywany
  - H2: Powiązane

## automation/index.md

- Trasa: /automation
- Nagłówki:
  - H2: Szybki przewodnik decyzyjny
  - H3: Zaplanowane zadania (Cron) a Heartbeat
  - H2: Podstawowe pojęcia
  - H3: Zaplanowane zadania (Cron)
  - H3: Zadania
  - H3: Wywnioskowane zobowiązania
  - H3: TaskFlow
  - H3: Stałe zlecenia
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
  - H2: Po co stałe zlecenia
  - H2: Jak działają
  - H2: Anatomia stałego zlecenia
  - H2: Stałe zlecenia oraz zadania Cron
  - H2: Przykłady
  - H3: Przykład 1: treści i media społecznościowe (cykl tygodniowy)
  - H3: Przykład 2: operacje finansowe (wyzwalane zdarzeniami)
  - H3: Przykład 3: monitorowanie i alerty (ciągłe)
  - H2: Wzorzec wykonaj-sprawdź-zaraportuj
  - H2: Architektura wieloprogramowa
  - H2: Najlepsze praktyki
  - H3: Rób
  - H3: Unikaj
  - H2: Powiązane

## automation/taskflow.md

- Trasa: /automation/taskflow
- Nagłówki:
  - H2: Kiedy używać TaskFlow
  - H2: Niezawodny wzorzec zaplanowanego przepływu pracy
  - H2: Tryby synchronizacji
  - H3: Tryb zarządzany
  - H3: Tryb lustrzany
  - H2: Trwały stan i śledzenie rewizji
  - H2: Zachowanie anulowania
  - H2: Polecenia CLI
  - H2: Jak przepływy wiążą się z zadaniami
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
  - H2: Dokumentacja CLI
  - H2: Tablica zadań w czacie (/tasks)
  - H2: Integracja statusu (presja zadań)
  - H2: Przechowywanie i utrzymanie
  - H3: Gdzie znajdują się zadania
  - H3: Automatyczne utrzymanie
  - H2: Jak zadania wiążą się z innymi systemami
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
  - H2: Konfigurowanie współdzielonych ustawień domyślnych
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
  - H3: Trasowanie
  - H2: Rozwiązywanie problemów
  - H2: Przykłady
  - H2: Dokumentacja API
  - H3: Schemat konfiguracji
  - H3: Pola
  - H2: Ograniczenia
  - H2: Przyszłe usprawnienia
  - H2: Powiązane

## channels/channel-routing.md

- Trasa: /channels/channel-routing
- Nagłówki:
  - H1: Kanały i trasowanie
  - H2: Kluczowe terminy
  - H2: Prefiksy celów wychodzących
  - H2: Kształty kluczy sesji (przykłady)
  - H2: Przypięcie głównej trasy DM
  - H2: Chronione rejestrowanie wiadomości przychodzących
  - H2: Reguły trasowania (jak wybierany jest agent)
  - H2: Grupy rozgłaszania (uruchamianie wielu agentów)
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
  - H2: Model środowiska uruchomieniowego
  - H2: Kanały forum
  - H2: Komponenty interaktywne
  - H2: Kontrola dostępu i trasowanie
  - H3: Trasowanie agentów oparte na rolach
  - H2: Natywne polecenia i autoryzacja poleceń
  - H2: Szczegóły funkcji
  - H2: Narzędzia i bramki akcji
  - H2: Interfejs Components v2
  - H2: Głos
  - H3: Kanały głosowe
  - H3: Obserwowanie użytkowników w głosie
  - H3: Wiadomości głosowe
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
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
  - H3: Zezwól wszystkim grupom, @mention niewymagane
  - H3: Zezwól wszystkim grupom, nadal wymagaj @mention
  - H3: Zezwól tylko określonym grupom
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
  - H2: Zaawansowana konfiguracja
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Streaming
  - H3: Optymalizacja limitów
  - H3: Sesje ACP
  - H4: Trwałe powiązanie ACP
  - H4: Uruchamianie ACP z czatu
  - H3: Trasowanie wielu agentów
  - H2: Izolacja agenta per użytkownik (dynamiczne tworzenie agentów)
  - H3: Szybka konfiguracja
  - H3: Jak to działa
  - H3: Opcje konfiguracji
  - H3: Zakres sesji
  - H3: Typowe wdrożenie wieloużytkownikowe
  - H3: Weryfikacja
  - H3: Uwagi
  - H2: Dokumentacja konfiguracji
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
  - H2: Dodawanie do Google Chat
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
  - H2: Bramkowanie wzmianek (domyślnie)
  - H2: Wzorce wzmianek skonfigurowane według zakresu
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
  - H2: Translacja konfiguracji
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
  - H2: Kontrola dostępu i trasowanie
  - H2: Powiązania konwersacji ACP
  - H2: Wzorce wdrożenia
  - H2: Multimedia, dzielenie na części i cele dostarczania
  - H2: Akcje prywatnego API
  - H2: Zapisy konfiguracji
  - H2: Scalanie dzielonych wysyłek DM (polecenie + URL w jednej kompozycji)
  - H3: Scenariusze i co widzi agent
  - H2: Odzyskiwanie danych przychodzących po restarcie mostka lub Gateway
  - H3: Sygnał widoczny dla operatora
  - H3: Migracja
  - H2: Rozwiązywanie problemów
  - H2: Wskaźniki dokumentacji konfiguracji
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
  - H2: Domyślne zabezpieczenia
  - H2: Kontrola dostępu
  - H3: Częsta pułapka: allowFrom dotyczy DM, nie kanałów
  - H2: Wyzwalanie odpowiedzi (wzmianki)
  - H2: Uwaga dotycząca bezpieczeństwa (zalecane dla kanałów publicznych)
  - H3: Te same narzędzia dla wszystkich w kanale
  - H3: Różne narzędzia dla każdego nadawcy (właściciel ma większe uprawnienia)
  - H2: NickServ
  - H2: Zmienne środowiskowe
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/line.md

- Trasa: /channels/line
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja
  - H2: Konfigurowanie
  - H2: Kontrola dostępu
  - H2: Zachowanie wiadomości
  - H2: Dane kanału (wiadomości wzbogacone)
  - H2: Obsługa ACP
  - H2: Media wychodzące
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
  - H2: Co migracja robi automatycznie
  - H2: Czego migracja nie może zrobić automatycznie
  - H2: Zalecany przepływ aktualizacji
  - H2: Jak działa zaszyfrowana migracja
  - H2: Typowe komunikaty i ich znaczenie
  - H3: Komunikaty aktualizacji i wykrywania
  - H3: Komunikaty odzyskiwania stanu zaszyfrowanego
  - H3: Komunikaty ręcznego odzyskiwania
  - H3: Komunikaty instalacji niestandardowego Plugin
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
  - H2: Konfiguracja
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
  - H3: Reguły push na własnym serwerze dla cichych sfinalizowanych podglądów
  - H2: Pokoje bot-do-bota
  - H2: Szyfrowanie i weryfikacja
  - H3: Włącz szyfrowanie
  - H3: Sygnały stanu i zaufania
  - H3: Zweryfikuj to urządzenie kluczem odzyskiwania
  - H3: Zainicjuj lub napraw podpisywanie krzyżowe
  - H3: Kopia zapasowa kluczy pokoju
  - H3: Wyświetlanie, żądanie i obsługa weryfikacji
  - H3: Uwagi dotyczące wielu kont
  - H2: Zarządzanie profilem
  - H2: Wątki
  - H3: Routing sesji (sessionScope)
  - H3: Odpowiedzi w wątku (threadReplies)
  - H3: Dziedziczenie wątków i polecenia z ukośnikiem
  - H2: Powiązania konwersacji ACP
  - H3: Konfiguracja powiązania wątku
  - H2: Reakcje
  - H2: Kontekst historii
  - H2: Widoczność kontekstu
  - H2: Zasady DM i pokoi
  - H2: Naprawa pokoju bezpośredniego
  - H2: Zatwierdzenia exec
  - H2: Polecenia z ukośnikiem
  - H2: Wiele kont
  - H2: Prywatne/LAN homeservery
  - H2: Proxy dla ruchu Matrix
  - H2: Rozpoznawanie celu
  - H2: Dokumentacja konfiguracji
  - H3: Konto i połączenie
  - H3: Szyfrowanie
  - H3: Dostęp i zasady
  - H3: Zachowanie odpowiedzi
  - H3: Ustawienia reakcji
  - H3: Narzędzia i nadpisania dla poszczególnych pokoi
  - H3: Ustawienia zatwierdzania exec
  - H2: Powiązane

## channels/mattermost.md

- Trasa: /channels/mattermost
- Nagłówki:
  - H2: Instalacja
  - H2: Szybka konfiguracja
  - H2: Natywne polecenia z ukośnikiem
  - H2: Zmienne środowiskowe (konto domyślne)
  - H2: Tryby czatu
  - H2: Wątki i sesje
  - H2: Kontrola dostępu (DM)
  - H2: Kanały (grupy)
  - H2: Cele dla dostarczania wychodzącego
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
  - H3: Krok 2: Pobierz dane uwierzytelniające
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
  - H2: Bieżące uprawnienia Teams RSC (manifest)
  - H2: Przykładowy manifest Teams (zredagowany)
  - H3: Zastrzeżenia dotyczące manifestu (pola wymagane)
  - H3: Aktualizowanie istniejącej aplikacji
  - H2: Możliwości: tylko RSC kontra Graph
  - H3: Tylko z Teams RSC (aplikacja zainstalowana, bez uprawnień Graph API)
  - H3: Z Teams RSC + uprawnieniami aplikacji Microsoft Graph
  - H3: RSC kontra Graph API
  - H2: Media i historia z włączonym Graph (wymagane dla kanałów)
  - H2: Znane ograniczenia
  - H3: Limity czasu Webhook
  - H3: Obsługa chmury Teams i adresu URL usługi
  - H3: Formatowanie
  - H2: Konfiguracja
  - H2: Routing i sesje
  - H2: Styl odpowiedzi: wątki kontra wpisy
  - H3: Priorytet rozpoznawania
  - H3: Zachowanie kontekstu wątku
  - H2: Załączniki i obrazy
  - H2: Wysyłanie plików w czatach grupowych
  - H3: Dlaczego czaty grupowe potrzebują SharePoint
  - H3: Konfiguracja
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

- Trasa: /channels/nextcloud-talk
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Szybka konfiguracja (początkujący)
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
  - H3: Lokalny przekaźnik
  - H3: Test ręczny
  - H2: Rozwiązywanie problemów
  - H3: Wiadomości nie są odbierane
  - H3: Odpowiedzi nie są wysyłane
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
  - H2: 2) Parowanie urządzeń Node (węzły iOS/Android/macOS/bezgłowe)
  - H3: Sparuj przez Telegram (zalecane dla iOS)
  - H3: Zatwierdź urządzenie Node
  - H3: Opcjonalne automatyczne zatwierdzanie Node z zaufanego CIDR
  - H3: Przechowywanie stanu parowania Node
  - H3: Uwagi
  - H2: Powiązane dokumenty

## channels/qa-channel.md

- Trasa: /channels/qa-channel
- Nagłówki:
  - H2: Co robi
  - H2: Konfiguracja
  - H2: Programy uruchamiające
  - H2: Powiązane

## channels/qqbot.md

- Trasa: /channels/qqbot
- Nagłówki:
  - H2: Instalacja
  - H2: Konfiguracja
  - H2: Konfigurowanie
  - H3: Konfiguracja wielu kont
  - H3: Czaty grupowe
  - H3: Głos (STT / TTS)
  - H2: Formaty celów
  - H2: Polecenia z ukośnikiem
  - H2: Architektura silnika
  - H2: Wprowadzanie za pomocą kodu QR
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## channels/raft.md

- Trasa: /channels/raft
- Nagłówki:
  - H2: Instalacja
  - H2: Wymagania wstępne
  - H2: Konfigurowanie
  - H2: Jak to działa
  - H2: Weryfikacja
  - H2: Rozwiązywanie problemów
  - H2: Odniesienia

## channels/signal.md

- Trasa: /channels/signal
- Nagłówki:
  - H2: Wymagania wstępne
  - H2: Szybka konfiguracja (początkujący)
  - H2: Czym to jest
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
  - H2: Reakcje (narzędzie wiadomości)
  - H2: Reakcje zatwierdzania
  - H2: Cele dostarczania (CLI/cron)
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
  - H2: Reakcja pisania jako zachowanie awaryjne
  - H2: Media, dzielenie na części i dostarczanie
  - H2: Polecenia i zachowanie poleceń z ukośnikiem
  - H2: Odpowiedzi interaktywne
  - H3: Przesłania modali należące do Plugin
  - H2: Natywne zatwierdzenia w Slack
  - H2: Zdarzenia i zachowanie operacyjne
  - H2: Dokumentacja konfiguracji
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja wizji załączników
  - H3: Obsługiwane typy mediów
  - H3: Potok przychodzący
  - H3: Dziedziczenie załączników z korzenia wątku
  - H3: Obsługa wielu załączników
  - H3: Limity rozmiaru, pobierania i modelu
  - H3: Znane limity
  - H3: Powiązana dokumentacja
  - H2: Powiązane

## channels/sms.md

- Trasa: /channels/sms
- Nagłówki:
  - H2: Zanim zaczniesz
  - H2: Szybka konfiguracja
  - H2: Przykłady konfiguracji
  - H3: Plik konfiguracyjny
  - H3: Zmienne środowiskowe
  - H3: Token uwierzytelniania SecretRef
  - H3: Prywatny numer tylko z listą dozwolonych
  - H3: Nadawca usługi Messaging Service
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
  - H2: Kontrolki odpowiedzi błędów
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Powiązane

## channels/tlon.md

- Trasa: /channels/tlon
- Nagłówki:
  - H2: Dołączony Plugin
  - H2: Konfiguracja
  - H2: Prywatne/LAN statki
  - H2: Kanały grupowe
  - H2: Kontrola dostępu
  - H2: Właściciel i system zatwierdzania
  - H2: Ustawienia automatycznego akceptowania
  - H2: Cele dostarczania (CLI/cron)
  - H2: Dołączona Skills
  - H2: Możliwości
  - H2: Rozwiązywanie problemów
  - H2: Dokumentacja konfiguracji
  - H2: Uwagi
  - H2: Powiązane

## channels/troubleshooting.md

- Trasa: /channels/troubleshooting
- Nagłówki:
  - H2: Drabinka poleceń
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
  - H2: Czym to jest
  - H2: Konfiguracja (szczegółowa)
  - H3: Wygeneruj dane uwierzytelniające
  - H3: Skonfiguruj bota
  - H3: Kontrola dostępu (zalecane)
  - H2: Odświeżanie tokena (opcjonalne)
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
  - H2: Wzorce wdrażania
  - H2: Model uruchomieniowy
  - H2: Monity zatwierdzania
  - H2: Hooki Pluginu i prywatność
  - H2: Kontrola dostępu i aktywacja
  - H2: Skonfigurowane powiązania ACP
  - H2: Zachowanie numeru osobistego i czatu z samym sobą
  - H2: Normalizacja wiadomości i kontekst
  - H2: Dostarczanie, dzielenie na części i multimedia
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
  - H3: Podstawowa konfiguracja z otwartą polityką wiadomości bezpośrednich
  - H3: Ogranicz wiadomości bezpośrednie do określonych użytkowników
  - H3: Wyłącz wymaganie @wzmianki w grupach
  - H3: Zoptymalizuj dostarczanie wiadomości wychodzących
  - H3: Dostosuj strategię scalania tekstu
  - H2: Typowe polecenia
  - H2: Rozwiązywanie problemów
  - H3: Bot nie odpowiada w czatach grupowych
  - H3: Bot nie odbiera wiadomości
  - H3: Bot wysyła puste lub awaryjne odpowiedzi
  - H3: App Secret wyciekł
  - H2: Konfiguracja zaawansowana
  - H3: Wiele kont
  - H3: Limity wiadomości
  - H3: Strumieniowanie
  - H3: Kontekst historii czatu grupowego
  - H3: Tryb odpowiedzi do wiadomości
  - H3: Wstrzykiwanie wskazówek Markdown
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
  - H2: Czym to jest
  - H2: Konfiguracja (szybka ścieżka)
  - H3: 1) Utwórz token bota (Zalo Bot Platform)
  - H3: 2) Skonfiguruj token (env lub config)
  - H2: Jak to działa (zachowanie)
  - H2: Limity
  - H2: Kontrola dostępu (wiadomości bezpośrednie)
  - H3: Dostęp do wiadomości bezpośrednich
  - H2: Kontrola dostępu (grupy)
  - H2: Long-polling a webhook
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
  - H2: Instalacja przez onboard (zalecane)
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
  - H2: Czym to jest
  - H2: Nazewnictwo
  - H2: Znajdowanie ID (katalog)
  - H2: Limity
  - H2: Kontrola dostępu (wiadomości bezpośrednie)
  - H2: Dostęp grupowy (opcjonalny)
  - H3: Bramka wzmianek grupowych
  - H2: Wiele kont
  - H2: Zmienne środowiskowe
  - H2: Wpisywanie, reakcje i potwierdzenia dostarczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## ci.md

- Trasa: /ci
- Nagłówki:
  - H2: Przegląd potoku
  - H2: Kolejność szybkiego niepowodzenia
  - H2: Kontekst PR i dowody
  - H2: Zakres i routing
  - H2: Przekazywanie aktywności ClawSweeper
  - H2: Ręczne uruchomienia
  - H2: Runnery
  - H2: Budżet rejestracji runnerów
  - H2: Lokalne odpowiedniki
  - H2: Wydajność OpenClaw
  - H2: Pełna walidacja wydania
  - H2: Shardy live i E2E
  - H2: Akceptacja pakietu
  - H3: Zadania
  - H3: Źródła kandydatów
  - H3: Profile zestawów
  - H3: Okna zgodności ze starszymi wersjami
  - H3: Przykłady
  - H2: Smoke test instalacji
  - H2: Lokalne Docker E2E
  - H3: Parametry dostrajania
  - H3: Wielokrotnego użytku workflow live/E2E
  - H3: Fragmenty ścieżki wydania
  - H2: Wersja przedpremierowa Pluginu
  - H2: QA Lab
  - H2: CodeQL
  - H3: Kategorie bezpieczeństwa
  - H3: Shardy bezpieczeństwa specyficzne dla platformy
  - H3: Kategorie jakości krytycznej
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
  - H1: ClawHub CLI
  - H2: Odkrywanie i instalacja
  - H2: Publikowanie i utrzymanie
  - H2: Powiązane

## clawhub/publishing.md

- Trasa: /clawhub/publishing
- Nagłówki:
  - H1: Publikowanie w ClawHub
  - H2: Właściciele
  - H2: Skills
  - H2: Pluginy
  - H2: Przepływ wydania
  - H2: FAQ
  - H3: Zakres pakietu musi odpowiadać wybranemu właścicielowi

## cli/acp.md

- Trasa: /cli/acp
- Nagłówki:
  - H2: Czym to nie jest
  - H2: Macierz zgodności
  - H2: Znane ograniczenia
  - H2: Użycie
  - H2: Klient ACP (debugowanie)
  - H2: Smoke testy protokołu
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
  - H3: agents delete
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
  - H2: Przykład „Never prompt” / YOLO
  - H2: Pomocniki listy dozwolonych
  - H2: Typowe opcje
  - H2: Uwagi
  - H2: Powiązane

## cli/backup.md

- Trasa: /cli/backup
- Nagłówki:
  - H1: openclaw backup
  - H2: Uwagi
  - H2: Co obejmuje kopia zapasowa
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
  - H2: Migawka / zrzut ekranu / akcje
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
  - H2: Status / możliwości / rozwiązywanie / logi
  - H2: Dodawanie / usuwanie kont
  - H2: Logowanie i wylogowanie (interaktywne)
  - H2: Rozwiązywanie problemów
  - H2: Sonda możliwości
  - H2: Rozwiąż nazwy na ID
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
  - H3: schemat config
  - H3: Ścieżki
  - H2: Wartości
  - H2: Tryby config set
  - H2: config patch
  - H2: Flagi konstruktora dostawcy
  - H2: Przebieg próbny
  - H3: Kształt danych wyjściowych JSON
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
  - H2: Bezpieczny start
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
  - H3: Dostarczanie po niepowodzeniu
  - H2: Harmonogramowanie
  - H3: Zadania jednorazowe
  - H3: Zadania cykliczne
  - H3: Ręczne uruchomienia
  - H2: Modele
  - H3: Pierwszeństwo izolowanego modelu cron
  - H3: Tryb szybki
  - H3: Ponowne próby przełączania modelu live
  - H2: Dane wyjściowe uruchomienia i odmowy
  - H3: Tłumienie nieaktualnych potwierdzeń
  - H3: Ciche tłumienie tokenów
  - H3: Ustrukturyzowane odmowy
  - H2: Retencja
  - H2: Migrowanie starszych zadań
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
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Pierwsze zatwierdzenie Paperclip / openclawgateway
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Typowe opcje
  - H2: Uwagi
  - H2: Lista kontrolna odzyskiwania dryfu tokenów
  - H2: Powiązane

## cli/directory.md

- Trasa: /cli/directory
- Nagłówki:
  - H1: openclaw directory
  - H2: Typowe flagi
  - H2: Uwagi
  - H2: Używanie wyników z wysyłaniem wiadomości
  - H2: Formaty ID (według kanału)
  - H2: Własny użytkownik („me”)
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
  - H4: Zdalnie przez SSH (parytet aplikacji Mac)
  - H3: gateway call
  - H2: Zarządzanie usługą Gateway
  - H3: Instalacja z wrapperem
  - H2: Wykrywanie gatewayów (Bonjour)
  - H3: gateway discover
  - H2: Powiązane

## cli/health.md

- Trasa: /cli/health
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
  - H2: Polecenia ukośnikiem na czacie
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
  - H2: Dźwięk
  - H2: TTS
  - H2: Wideo
  - H2: Sieć
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
  - H3: Granica bezpieczeństwa i zaufania
  - H3: Testowanie
  - H3: Rozwiązywanie problemów
  - H2: OpenClaw jako rejestr klienta MCP
  - H3: Zapisane definicje serwerów MCP
  - H3: Typowe receptury serwerów
  - H3: Kształty wyjścia JSON
  - H3: Transport Stdio
  - H3: Transport SSE / HTTP
  - H3: Przepływ pracy OAuth
  - H3: Transport strumieniowalny HTTP
  - H2: Control UI
  - H2: Bieżące ograniczenia
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
  - H3: Role / kanały / członkowie / głos
  - H3: Zdarzenia
  - H3: Moderacja (Discord)
  - H3: Rozgłaszanie
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
  - H3: Stan archiwum i ręcznej weryfikacji
  - H2: Dostawca Codex
  - H3: Co importuje Codex
  - H3: Stan Codex do ręcznej weryfikacji
  - H2: Dostawca Hermes
  - H3: Co importuje Hermes
  - H3: Obsługiwane klucze .env
  - H3: Stan tylko archiwalny
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
  - H3: Status modeli
  - H2: Aliasy + mechanizmy awaryjne
  - H2: Profile uwierzytelniania
  - H2: Powiązane

## cli/node.md

- Ścieżka: /cli/node
- Nagłówki:
  - H1: openclaw node
  - H2: Dlaczego używać hosta węzła?
  - H2: Proxy przeglądarki (bez konfiguracji)
  - H2: Uruchom (na pierwszym planie)
  - H2: Uwierzytelnianie Gateway dla hosta węzła
  - H2: Usługa (w tle)
  - H2: Parowanie
  - H2: Zatwierdzenia exec
  - H2: Powiązane

## cli/nodes.md

- Ścieżka: /cli/nodes
- Nagłówki:
  - H1: openclaw nodes
  - H2: Typowe polecenia
  - H2: Wywołaj
  - H2: Powiązane

## cli/onboard.md

- Ścieżka: /cli/onboard
- Nagłówki:
  - H1: openclaw onboard
  - H2: Powiązane przewodniki
  - H2: Przykłady
  - H2: Ustawienia regionalne
  - H3: Nieinteraktywne wybory punktu końcowego Z.AI
  - H2: Uwagi dotyczące przepływu
  - H2: Typowe polecenia następcze

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
  - H2: Referencja podpoleceń
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
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
  - H3: Referencja reguł zasad
  - H4: Nakładki zakresowe
  - H4: Kanały
  - H4: Serwery MCP
  - H4: Dostawcy modeli
  - H4: Sieć
  - H4: Dostęp przychodzący i kanałowy
  - H4: Gateway
  - H4: Przestrzeń robocza agenta
  - H4: Postawa sandboxa
  - H4: Obsługa danych
  - H4: Sekrety
  - H4: Zatwierdzenia exec
  - H4: Profile uwierzytelniania
  - H4: Metadane narzędzi
  - H4: Postawa narzędzi
  - H2: Skonfiguruj zasady
  - H2: Zaakceptuj stan zasad
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
  - H2: Omówienie
  - H2: Polecenia
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Przypadki użycia
  - H3: Po zaktualizowaniu obrazu Docker
  - H3: Po zmianie konfiguracji sandboxa
  - H3: Po zmianie celu SSH lub materiału uwierzytelniania SSH
  - H3: Po zmianie źródła, zasad lub trybu OpenShell
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
  - H2: Dlaczego bez kopii zapasowych rollbacku
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
  - H2: Kompaktuj sesję
  - H3: RPC sessions.compact
  - H2: Powiązane

## cli/setup.md

- Ścieżka: /cli/setup
- Nagłówki:
  - H1: openclaw setup
  - H2: Opcje
  - H3: Automatyczne wyzwalanie kreatora
  - H2: Przykłady
  - H2: Uwagi
  - H2: Powiązane

## cli/skills.md

- Ścieżka: /cli/skills
- Nagłówki:
  - H1: openclaw skills
  - H2: Polecenia
  - H2: Warsztat Skill
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
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
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
  - H2: Zgodność z poleceniami ukośnikiem
  - H2: Uprawnienia
  - H2: Rozwiązywanie problemów
  - H3: Nie pojawiają się żadne karty
  - H3: Dispatch zgłasza tylko dane
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
  - H2: Kiedy się uruchamia
  - H2: Typy sesji
  - H2: Gdzie działa
  - H2: Dlaczego warto tego używać
  - H2: Jak to działa
  - H2: Tryby zapytań
  - H2: Style promptów
  - H2: Zasady awaryjnego wyboru modelu
  - H2: Narzędzia pamięci
  - H3: Wbudowane memory-core
  - H3: Pamięć LanceDB
  - H3: Bezstratny Claw
  - H2: Zaawansowane wyjścia awaryjne
  - H2: Trwałość transkryptu
  - H2: Konfiguracja
  - H2: Zalecana konfiguracja
  - H3: Okres karencji zimnego startu
  - H2: Debugowanie
  - H2: Typowe problemy
  - H2: Powiązane strony

## concepts/agent-loop.md

- Ścieżka: /concepts/agent-loop
- Nagłówki:
  - H2: Punkty wejścia
  - H2: Jak to działa (wysoki poziom)
  - H2: Kolejkowanie + współbieżność
  - H2: Przygotowanie sesji + przestrzeni roboczej
  - H2: Składanie promptu + prompt systemowy
  - H2: Punkty hooków (gdzie można przechwycić)
  - H3: Hooki wewnętrzne (hooki Gateway)
  - H3: Hooki Plugin (cykl życia agenta + Gateway)
  - H2: Streaming + częściowe odpowiedzi
  - H2: Wykonywanie narzędzi + narzędzia wiadomości
  - H2: Kształtowanie odpowiedzi + tłumienie
  - H2: Compaction + ponowienia
  - H2: Strumienie zdarzeń (dzisiaj)
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
  - H2: Etykiety statusu
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
  - H2: Przenoszenie przestrzeni roboczej na nowy komputer
  - H2: Uwagi zaawansowane
  - H2: Powiązane

## concepts/agent.md

- Ścieżka: /concepts/agent
- Nagłówki:
  - H2: Przestrzeń robocza (wymagana)
  - H2: Pliki bootstrapu (wstrzyknięte)
  - H2: Wbudowane narzędzia
  - H2: Skills
  - H2: Granice runtime
  - H2: Sesje
  - H2: Sterowanie podczas streamingu
  - H2: Odwołania do modeli
  - H2: Konfiguracja (minimalna)
  - H2: Powiązane

## concepts/architecture.md

- Ścieżka: /concepts/architecture
- Nagłówki:
  - H2: Omówienie
  - H2: Komponenty i przepływy
  - H3: Gateway (daemon)
  - H3: Klienci (aplikacja na Maca / CLI / panel webowy administratora)
  - H3: Węzły (macOS / iOS / Android / bez interfejsu graficznego)
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
  - H3: Ochrona liczby bajtów aktywnej transkrypcji
  - H3: Transkrypcje następcze
  - H3: Powiadomienia Compaction
  - H3: Opróżnianie pamięci
  - H2: Podłączalni dostawcy Compaction
  - H2: Compaction a przycinanie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/context-engine.md

- Ścieżka: /concepts/context-engine
- Nagłówki:
  - H2: Szybki start
  - H2: Jak to działa
  - H3: Cykl życia podagenta (opcjonalny)
  - H3: Dodatek do promptu systemowego
  - H2: Starszy silnik
  - H2: Silniki Plugin
  - H3: Interfejs ContextEngine
  - H3: Ustawienia runtime
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
  - H2: Szybki start (sprawdź kontekst)
  - H2: Przykładowe wyjście
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Co wlicza się do okna kontekstu
  - H2: Jak OpenClaw buduje prompt systemowy
  - H2: Wstrzyknięte pliki przestrzeni roboczej (kontekst projektu)
  - H2: Skills: wstrzyknięte a ładowane na żądanie
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
  - H3: Poziom 1: tylko do odczytu + szkic
  - H3: Poziom 2: wysyłanie w imieniu
  - H3: Poziom 3: proaktywny
  - H2: Wymagania wstępne: izolacja i utwardzenie
  - H3: Twarde blokady (nienegocjowalne)
  - H3: Ograniczenia narzędzi
  - H3: Izolacja sandboxa
  - H3: Ślad audytowy
  - H2: Konfigurowanie delegata
  - H3: 1. Utwórz agenta delegata
  - H3: 2. Skonfiguruj delegowanie dostawcy tożsamości
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Powiąż delegata z kanałami
  - H3: 4. Dodaj dane uwierzytelniające do agenta delegata
  - H2: Przykład: asystent organizacyjny
  - H2: Wzorzec skalowania
  - H2: Powiązane

## concepts/dreaming.md

- Ścieżka: /concepts/dreaming
- Nagłówki:
  - H2: Co zapisuje Dreaming
  - H2: Model faz
  - H2: Przetwarzanie transkrypcji sesji
  - H2: Dziennik snów
  - H2: Głębokie sygnały rankingowe
  - H2: Pokrycie raportu próbnego QA w tle
  - H2: Harmonogram
  - H2: Szybki start
  - H2: Polecenie ukośnika
  - H2: Przepływ pracy CLI
  - H2: Kluczowe wartości domyślne
  - H2: Interfejs snów
  - H2: Dreaming nigdy się nie uruchamia: status pokazuje blokadę
  - H2: Powiązane

## concepts/experimental-features.md

- Ścieżka: /concepts/experimental-features
- Nagłówki:
  - H2: Obecnie udokumentowane flagi
  - H2: Odchudzony tryb modelu lokalnego
  - H3: Dlaczego te trzy narzędzia
  - H3: Kiedy to włączyć
  - H3: Kiedy pozostawić wyłączone
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
  - H2: Wywołanie GitHub
  - H2: Lokalne CLI
  - H2: Tryby hydratacji
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
  - H2: Discord MVP
  - H2: Istniejące elementy QA
  - H2: Model dowodów
  - H2: Przeglądarka i VNC
  - H2: Maszyny
  - H2: Sekrety
  - H2: Artefakty GitHub i komentarze PR
  - H2: Prywatne notatki wdrożeniowe
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
  - H2: Honcho a pamięć wbudowana
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
  - H2: Wspomnienia wrażliwe na akcje
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
  - H2: Relacja z ruchem przychodzącym kanału
  - H2: Bariery zgodności
  - H2: Magazyn wewnętrzny
  - H2: Klasy awarii
  - H2: Mapowanie kanałów
  - H2: Plan migracji
  - H3: Faza 1: wewnętrzna domena wiadomości
  - H3: Faza 2: trwały rdzeń wysyłania
  - H3: Faza 3: most przychodzący kanału
  - H3: Faza 4: przygotowany most dispatchera
  - H3: Faza 5: ujednolicony cykl życia na żywo
  - H3: Faza 6: publiczne SDK
  - H3: Faza 7: wszyscy nadawcy
  - H3: Faza 8: usuń zgodność z nazwami opartymi na turach
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
  - H2: Kolejkowanie i kontynuacje
  - H2: Własność uruchomienia kanału
  - H2: Streaming, dzielenie na fragmenty i grupowanie
  - H2: Widoczność rozumowania i tokeny
  - H2: Prefiksy, wątki i odpowiedzi
  - H2: Ciche odpowiedzi
  - H2: Powiązane

## concepts/model-failover.md

- Ścieżka: /concepts/model-failover
- Nagłówki:
  - H2: Przepływ runtime
  - H2: Zasady źródła wyboru
  - H2: Pamięć podręczna pomijania awarii uwierzytelniania
  - H2: Widoczne dla użytkownika powiadomienia o fallbacku
  - H2: Magazyn uwierzytelniania (klucze + OAuth)
  - H2: Identyfikatory profili
  - H2: Kolejność rotacji
  - H3: Przywiązanie sesji (przyjazne dla pamięci podręcznej)
  - H3: Subskrypcja OpenAI Codex plus zapasowy klucz API
  - H2: Okresy cooldown
  - H2: Wyłączenia rozliczeń
  - H2: Fallback modelu
  - H3: Reguły łańcucha kandydatów
  - H3: Które błędy przesuwają fallback
  - H3: Pomijanie cooldown a zachowanie sondowania
  - H2: Nadpisania sesji i przełączanie modelu na żywo
  - H2: Obserwowalność i podsumowania awarii
  - H2: Powiązana konfiguracja

## concepts/model-providers.md

- Ścieżka: /concepts/model-providers
- Nagłówki:
  - H2: Szybkie reguły
  - H2: Zachowanie dostawcy będące własnością Plugin
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
  - H4: Osobliwości warte poznania
  - H2: Dostawcy przez models.providers (niestandardowy/podstawowy URL)
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
  - H3: Bezpieczne edycje allowlisty
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
  - H2: Wyszukiwanie pamięci QMD między agentami
  - H2: Jeden numer WhatsApp, wiele osób (podział DM)
  - H2: Reguły routingu (jak wiadomości wybierają agenta)
  - H2: Wiele kont / numerów telefonów
  - H2: Pojęcia
  - H2: Przykłady platform
  - H2: Typowe wzorce
  - H2: Sandbox i konfiguracja narzędzi dla każdego agenta
  - H2: Powiązane

## concepts/oauth.md

- Ścieżka: /concepts/oauth
- Nagłówki:
  - H2: Odbiornik tokenów (dlaczego istnieje)
  - H2: Magazyn (gdzie znajdują się tokeny)
  - H2: Zgodność ze starszymi tokenami Anthropic
  - H2: Migracja Anthropic Claude CLI
  - H2: Wymiana OAuth (jak działa logowanie)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Odświeżanie + wygaśnięcie
  - H2: Wiele kont (profile) + routing
  - H3: 1) Preferowane: oddzielni agenci
  - H3: 2) Zaawansowane: wiele profili w jednym agencie
  - H2: Powiązane

## concepts/parallel-specialist-lanes.md

- Trasa: /concepts/parallel-specialist-lanes
- Nagłówki:
  - H2: Pierwsze zasady
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
  - H3: 4) Połączenia Node (rola: node)
  - H2: Reguły scalania i deduplikacji (dlaczego instanceId ma znaczenie)
  - H2: TTL i ograniczony rozmiar
  - H2: Zastrzeżenie dotyczące zdalnego dostępu/tunelu (adresy IP pętli zwrotnej)
  - H2: Konsumenci
  - H3: Karta Instancje w macOS
  - H2: Wskazówki dotyczące debugowania
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
  - H2: Pokrycie transportu na żywo
  - H2: Odniesienie QA dla Telegram, Discord, Slack i WhatsApp
  - H3: Wspólne flagi CLI
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Konfigurowanie obszaru roboczego Slack
  - H3: QA WhatsApp
  - H3: Pula poświadczeń Convex
  - H2: Seedy oparte na repozytorium
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
  - H3: Wspólne flagi
  - H3: Flagi dostawcy
  - H2: Profile
  - H2: Scenariusze
  - H2: Zmienne środowiskowe
  - H2: Artefakty wyjściowe
  - H2: Wskazówki dotyczące triage'u
  - H2: Kontrakt transportu na żywo
  - H2: Powiązane

## concepts/queue-steering.md

- Trasa: /concepts/queue-steering
- Nagłówki:
  - H2: Granica środowiska uruchomieniowego
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
  - H2: Wartości domyślne
  - H2: Tryby kolejki
  - H2: Opcje kolejki
  - H2: Sterowanie i strumieniowanie
  - H2: Pierwszeństwo
  - H2: Nadpisania na sesję
  - H2: Zakres i gwarancje
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## concepts/retry.md

- Trasa: /concepts/retry
- Nagłówki:
  - H2: Cele
  - H2: Wartości domyślne
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
  - H2: Przycinanie a Compaction
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/session-tool.md

- Trasa: /concepts/session-tool
- Nagłówki:
  - H2: Dostępne narzędzia
  - H2: Wyświetlanie i odczytywanie sesji
  - H2: Wysyłanie wiadomości między sesjami
  - H2: Helpery statusu i orkiestracji
  - H2: Tworzenie podagentów
  - H2: Widoczność
  - H2: Dalsza lektura
  - H2: Powiązane

## concepts/session.md

- Trasa: /concepts/session
- Nagłówki:
  - H2: Jak wiadomości są kierowane
  - H2: Izolacja DM
  - H3: Kanały połączone z Dockiem
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
  - H2: Jak wygląda dobry wynik
  - H2: Jedno ostrzeżenie
  - H2: Powiązane

## concepts/streaming.md

- Trasa: /concepts/streaming
- Nagłówki:
  - H2: Strumieniowanie blokowe (wiadomości kanału)
  - H3: Dostarczanie multimediów ze strumieniowaniem blokowym
  - H2: Algorytm dzielenia na fragmenty (dolne/górne granice)
  - H2: Koalescencja (scalanie strumieniowanych bloków)
  - H2: Ludzkie tempo między blokami
  - H2: „Strumieniuj fragmenty albo wszystko”
  - H2: Tryby strumieniowania podglądu
  - H3: Mapowanie kanałów
  - H3: Zachowanie środowiska uruchomieniowego
  - H3: Aktualizacje podglądu postępu narzędzi
  - H2: Powiązane

## concepts/system-prompt.md

- Trasa: /concepts/system-prompt
- Nagłówki:
  - H2: Struktura
  - H2: Tryby promptów
  - H2: Migawki promptów
  - H2: Wstrzyknięcie bootstrapu obszaru roboczego
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
  - H2: Bieżący pipeline
  - H2: Jak schematy są używane w czasie wykonywania
  - H2: Przykładowe ramki
  - H2: Minimalny klient (Node.js)
  - H2: Przykład roboczy: dodanie metody od początku do końca
  - H2: Zachowanie generowania kodu Swift
  - H2: Wersjonowanie + zgodność
  - H2: Wzorce i konwencje schematów
  - H2: JSON schematu na żywo
  - H2: Gdy zmieniasz schematy
  - H2: Powiązane

## concepts/typing-indicators.md

- Trasa: /concepts/typing-indicators
- Nagłówki:
  - H2: Wartości domyślne
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
  - H2: Reprodukcja (tylko Node)
  - H2: Minimalna reprodukcja w repozytorium
  - H2: Sprawdzenie wersji Node
  - H2: Uwagi / hipoteza
  - H2: Historia regresji
  - H2: Obejścia
  - H2: Odniesienia
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
  - H2: Uwaga dotycząca Anthropic
  - H2: Sprawdzanie statusu uwierzytelnienia modelu
  - H2: Zachowanie rotacji klucza API (gateway)
  - H2: Usuwanie uwierzytelnienia dostawcy, gdy gateway działa
  - H2: Kontrolowanie, które poświadczenie jest używane
  - H3: OpenAI i starsze identyfikatory openai-codex
  - H3: Podczas logowania (CLI)
  - H3: Na sesję (polecenie czatu)
  - H3: Na agenta (nadpisanie CLI)
  - H2: Rozwiązywanie problemów
  - H3: „Nie znaleziono poświadczeń”
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
  - H2: Bonjour szerokiego obszaru (Unicast DNS-SD) przez Tailscale
  - H3: Konfiguracja Gateway (zalecane)
  - H3: Jednorazowa konfiguracja serwera DNS (host gateway)
  - H3: Ustawienia DNS Tailscale
  - H3: Bezpieczeństwo nasłuchiwania Gateway (zalecane)
  - H2: Co się ogłasza
  - H2: Typy usług
  - H2: Klucze TXT (niesekretne wskazówki)
  - H2: Debugowanie w macOS
  - H2: Debugowanie w logach Gateway
  - H2: Debugowanie na węźle iOS
  - H2: Kiedy włączyć Bonjour
  - H2: Kiedy wyłączyć Bonjour
  - H2: Pułapki Docker
  - H2: Rozwiązywanie problemów z wyłączonym Bonjour
  - H2: Typowe tryby awarii
  - H2: Nazwy instancji ze znakami ucieczki (\032)
  - H2: Włączanie / wyłączanie / konfiguracja
  - H2: Powiązana dokumentacja

## gateway/bridge-protocol.md

- Trasa: /gateway/bridge-protocol
- Nagłówki:
  - H2: Dlaczego istniał
  - H2: Transport
  - H2: Uzgadnianie + parowanie
  - H2: Ramki
  - H2: Zdarzenia cyklu życia exec
  - H2: Historyczne użycie tailnet
  - H2: Wersjonowanie
  - H2: Powiązane

## gateway/cli-backends.md

- Trasa: /gateway/cli-backends
- Nagłówki:
  - H2: Szybki start dla początkujących
  - H2: Używanie jako fallbacku
  - H2: Przegląd konfiguracji
  - H3: Przykładowa konfiguracja
  - H2: Jak to działa
  - H2: Sesje
  - H2: Wstępny fallback z sesji claude-cli
  - H2: Obrazy (przekazywanie bez zmian)
  - H2: Wejścia / wyjścia
  - H2: Wartości domyślne (własność Plugin)
  - H2: Wartości domyślne będące własnością Plugin
  - H2: Własność natywnej Compaction
  - H2: Nakładki MCP pakietu
  - H2: Limit ponownego zasiania historii
  - H2: Ograniczenia
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/config-agents.md

- Trasa: /gateway/config-agents
- Nagłówki:
  - H2: Wartości domyślne agentów
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
  - H3: Polityka środowiska uruchomieniowego
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Strumieniowanie blokowe
  - H3: Wskaźniki pisania
  - H3: agents.defaults.sandbox
  - H3: agents.list (nadpisania dla agentów)
  - H2: Routing wieloagentowy
  - H3: Pola dopasowania powiązania
  - H3: Profile dostępu dla agentów
  - H2: Sesja
  - H2: Wiadomości
  - H3: Prefiks odpowiedzi
  - H3: Reakcja potwierdzenia
  - H3: Debounce przychodzący
  - H3: TTS (text-to-speech)
  - H2: Rozmowa
  - H2: Powiązane

## gateway/config-channels.md

- Trasa: /gateway/config-channels
- Nagłówki:
  - H2: Kanały
  - H3: Dostęp do DM i grup
  - H3: Nadpisania modelu kanału
  - H3: Wartości domyślne kanału i Heartbeat
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
  - H3: Bramka wzmianek w czacie grupowym
  - H4: Limity historii DM
  - H4: Tryb czatu z samym sobą
  - H3: Polecenia (obsługa poleceń czatu)
  - H2: Powiązane

## gateway/config-tools.md

- Trasa: /gateway/config-tools
- Nagłówki:
  - H2: Narzędzia
  - H3: Profile narzędzi
  - H3: Grupy narzędzi
  - H3: Narzędzia MCP i pluginów w zasadach narzędzi sandbox
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
  - H3: Zalecana konfiguracja początkowa
  - H2: Rozszerzony przykład (główne opcje)
  - H3: Dowiązane repozytorium Skills obok
  - H2: Typowe wzorce
  - H3: Wspólna baza Skills z jednym nadpisaniem
  - H3: Konfiguracja wieloplatformowa
  - H3: Automatyczne zatwierdzanie sieci zaufanych węzłów
  - H3: Bezpieczny tryb wiadomości prywatnych (wspólna skrzynka odbiorcza / wiadomości prywatne wielu użytkowników)
  - H3: Klucz API Anthropic + awaryjny MiniMax
  - H3: Bot roboczy (ograniczony dostęp)
  - H3: Tylko modele lokalne
  - H2: Wskazówki
  - H2: Powiązane

## gateway/configuration-reference.md

- Trasa: /gateway/configuration-reference
- Nagłówki:
  - H2: Kanały
  - H2: Domyślne ustawienia agenta, wielu agentów, sesje i wiadomości
  - H2: Narzędzia i niestandardowi dostawcy
  - H2: Modele
  - H2: MCP
  - H2: Skills
  - H2: Pluginy
  - H3: Konfiguracja Pluginu harness Codex
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
  - H2: Host Pluginu Canvas
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
  - H2: Magazyn uwierzytelniania
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
  - H2: Zmienne szablonu modelu multimediów
  - H2: Dołączanie konfiguracji ($include)
  - H2: Powiązane

## gateway/configuration.md

- Trasa: /gateway/configuration
- Nagłówki:
  - H2: Minimalna konfiguracja
  - H2: Edytowanie konfiguracji
  - H2: Ścisła walidacja
  - H2: Typowe zadania
  - H2: Przeładowywanie konfiguracji na gorąco
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
  - H2: Dlaczego zachowujemy zarówno połączenie bezpośrednie, jak i SSH
  - H2: Dane wejściowe wykrywania (jak klienci dowiadują się, gdzie jest Gateway)
  - H3: 1) Wykrywanie Bonjour / DNS-SD
  - H4: Szczegóły sygnału usługi
  - H3: 2) Tailnet (między sieciami)
  - H3: 3) Cel ręczny / SSH
  - H2: Wybór transportu (zasady klienta)
  - H2: Parowanie + uwierzytelnianie (transport bezpośredni)
  - H2: Odpowiedzialności według komponentu
  - H2: Powiązane

## gateway/doctor.md

- Trasa: /gateway/doctor
- Nagłówki:
  - H2: Szybki start
  - H3: Tryby bez interfejsu i automatyzacji
  - H2: Tryb lint tylko do odczytu
  - H2: Co robi (podsumowanie)
  - H2: Uzupełnianie i resetowanie UI Dreams
  - H2: Szczegółowe zachowanie i uzasadnienie
  - H2: Powiązane

## gateway/external-apps.md

- Trasa: /gateway/external-apps
- Nagłówki:
  - H2: Co jest dostępne dzisiaj
  - H2: Zalecana ścieżka
  - H2: Kod aplikacji a kod Pluginu
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
  - H2: Do czego służy monit Heartbeat
  - H2: Kontrakt odpowiedzi
  - H2: Konfiguracja
  - H3: Zakres i priorytet
  - H3: Heartbeat dla poszczególnych agentów
  - H3: Przykład aktywnych godzin
  - H3: Konfiguracja 24/7
  - H3: Przykład wielu kont
  - H3: Uwagi dotyczące pól
  - H2: Zachowanie dostarczania
  - H2: Kontrola widoczności
  - H3: Co robi każda flaga
  - H3: Przykłady dla kanału i dla konta
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
  - H2: 5-minutowe uruchomienie lokalne
  - H2: Model środowiska wykonawczego
  - H2: Punkty końcowe zgodne z OpenAI
  - H3: Priorytet portu i powiązania
  - H3: Tryby przeładowania na gorąco
  - H2: Zestaw poleceń operatora
  - H2: Wiele Gateway (ten sam host)
  - H2: Dostęp zdalny
  - H2: Nadzór i cykl życia usługi
  - H2: Szybka ścieżka profilu deweloperskiego
  - H2: Krótka dokumentacja protokołu (widok operatora)
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
  - H3: Konfiguracja hybrydowa: hostowany główny, lokalny awaryjny
  - H3: Najpierw lokalny z hostowaną siatką bezpieczeństwa
  - H3: Hosting regionalny / routing danych
  - H2: Inne lokalne proxy zgodne z OpenAI
  - H2: Mniejsze lub bardziej rygorystyczne backendy
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## gateway/logging.md

- Trasa: /gateway/logging
- Nagłówki:
  - H1: Rejestrowanie
  - H2: Rejestrator oparty na plikach
  - H2: Przechwytywanie konsoli
  - H2: Redakcja
  - H2: Logi WebSocket Gateway
  - H3: Styl logów WS
  - H2: Formatowanie konsoli (rejestrowanie podsystemu)
  - H2: Powiązane

## gateway/multiple-gateways.md

- Trasa: /gateway/multiple-gateways
- Nagłówki:
  - H2: Najlepsza zalecana konfiguracja
  - H2: Szybki start Rescue-Bot
  - H2: Dlaczego to działa
  - H2: Co zmienia --profile rescue onboard
  - H2: Ogólna konfiguracja wielu Gateway
  - H2: Lista kontrolna izolacji
  - H2: Mapowanie portów (wyprowadzone)
  - H2: Uwagi dotyczące przeglądarki/CDP (częsty błąd)
  - H2: Przykład ręcznego env
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
  - H2: Kontrakt modelu z agentem na pierwszym miejscu
  - H2: Włączanie punktu końcowego
  - H2: Wyłączanie punktu końcowego
  - H2: Zachowanie sesji
  - H2: Dlaczego ta powierzchnia ma znaczenie
  - H2: Lista modeli i routing agentów
  - H2: Strumieniowanie (SSE)
  - H2: Kontrakt narzędzia czatu
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
  - H2: Uwierzytelnianie, bezpieczeństwo i routing
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
  - H2: Tryby obszaru roboczego
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
  - H2: Utwardzanie bezpieczeństwa
  - H2: Obecne ograniczenia
  - H2: Jak to działa
  - H2: Powiązane

## gateway/opentelemetry.md

- Trasa: /gateway/opentelemetry
- Nagłówki:
  - H2: Jak to się łączy
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
  - H3: Cykl życia harness
  - H3: Wykonywanie narzędzi
  - H3: Exec
  - H3: Wewnętrzne elementy diagnostyki (pamięć i pętla narzędzi)
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
  - H2: Zatwierdzenia parowania Node
  - H2: Uwierzytelnianie współdzielonym sekretem

## gateway/pairing.md

- Trasa: /gateway/pairing
- Nagłówki:
  - H2: Pojęcia
  - H2: Jak działa parowanie
  - H2: Przepływ pracy CLI (przyjazny dla trybu bez interfejsu)
  - H2: Powierzchnia API (protokół Gateway)
  - H2: Bramkowanie poleceń Node (2026.3.31+)
  - H2: Granice zaufania zdarzeń Node (2026.3.31+)
  - H2: Automatyczne zatwierdzanie (aplikacja macOS)
  - H2: Automatyczne zatwierdzanie urządzeń Trusted-CIDR
  - H2: Automatyczne zatwierdzanie aktualizacji metadanych
  - H2: Pomocniki parowania QR
  - H2: Lokalność i przekazywane nagłówki
  - H2: Magazyn (lokalny, prywatny)
  - H2: Zachowanie transportu
  - H2: Powiązane

## gateway/prometheus.md

- Trasa: /gateway/prometheus
- Nagłówki:
  - H2: Szybki start
  - H2: Eksportowane metryki
  - H2: Zasady etykiet
  - H2: Przepisy PromQL
  - H2: Wybór między eksportem Prometheus a OpenTelemetry
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
  - H3: Możliwości/polecenia/uprawnienia (Node)
  - H2: Obecność
  - H3: Zdarzenie Node działającego w tle
  - H2: Zakres zdarzeń rozgłoszeniowych
  - H2: Typowe rodziny metod RPC
  - H3: Typowe rodziny zdarzeń
  - H3: Metody pomocnicze Node
  - H3: RPC rejestru zadań
  - H3: Metody pomocnicze operatora
  - H3: Widoki models.list
  - H2: Zatwierdzenia exec
  - H2: Awaryjne dostarczanie agenta
  - H2: Wersjonowanie
  - H3: Stałe klienta
  - H2: Uwierzytelnianie
  - H2: Tożsamość urządzenia + parowanie
  - H3: Diagnostyka migracji uwierzytelniania urządzeń
  - H2: TLS + przypinanie
  - H2: Zakres
  - H2: Powiązane

## gateway/remote-gateway-readme.md

- Trasa: /gateway/remote-gateway-readme
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
  - H3: Załaduj Launch Agent
  - H2: Rozwiązywanie problemów
  - H2: Jak to działa
  - H2: Powiązane

## gateway/remote.md

- Trasa: /gateway/remote
- Nagłówki:
  - H2: Główna idea
  - H2: Typowe konfiguracje VPN i tailnet
  - H3: Zawsze włączony Gateway w Twoim tailnet
  - H3: Domowy komputer uruchamia Gateway
  - H3: Laptop uruchamia Gateway
  - H2: Przepływ poleceń (co uruchamia się gdzie)
  - H2: Tunel SSH (CLI + narzędzia)
  - H2: Zdalne ustawienia domyślne CLI
  - H2: Kolejność pierwszeństwa poświadczeń
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
  - H2: Piaskownica: gdzie uruchamiane są narzędzia
  - H3: Montowania bind (szybka kontrola bezpieczeństwa)
  - H2: Zasady narzędzi: które narzędzia istnieją i można wywołać
  - H3: Grupy narzędzi (skróty)
  - H2: Podwyższone uprawnienia: tylko exec „uruchom na hoście”
  - H2: Typowe poprawki „więzienia piaskownicy”
  - H3: „Narzędzie X zablokowane przez zasady narzędzi piaskownicy”
  - H3: „Myślałem, że to główny kontekst, dlaczego jest w piaskownicy?”
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
  - H2: Zasady narzędzi i wyjścia awaryjne
  - H2: Nadpisania dla wielu agentów
  - H2: Minimalny przykład włączenia
  - H2: Powiązane

## gateway/secrets-plan-contract.md

- Trasa: /gateway/secrets-plan-contract
- Nagłówki:
  - H2: Kształt pliku planu
  - H2: Upserty i usunięcia dostawcy
  - H2: Obsługiwany zakres celu
  - H2: Zachowanie typu celu
  - H2: Reguły walidacji ścieżek
  - H2: Zachowanie przy niepowodzeniu
  - H2: Zachowanie zgody dostawcy exec
  - H2: Uwagi dotyczące zakresu środowiska uruchomieniowego i audytu
  - H2: Kontrole operatora
  - H2: Powiązana dokumentacja

## gateway/secrets.md

- Trasa: /gateway/secrets
- Nagłówki:
  - H2: Cele i model środowiska uruchomieniowego
  - H2: Granica dostępu agenta
  - H2: Filtrowanie aktywnej powierzchni
  - H2: Diagnostyka powierzchni uwierzytelniania Gateway
  - H2: Wstępna kontrola odniesienia onboardingu
  - H2: Kontrakt SecretRef
  - H2: Konfiguracja dostawcy
  - H2: Klucze API oparte na plikach
  - H2: Przykłady integracji exec
  - H2: Zmienne środowiskowe serwera MCP
  - H2: Materiały uwierzytelniania SSH piaskownicy
  - H2: Obsługiwana powierzchnia poświadczeń
  - H2: Wymagane zachowanie i kolejność pierwszeństwa
  - H2: Wyzwalacze aktywacji
  - H2: Sygnały degradacji i odzyskania
  - H2: Rozwiązywanie ścieżki polecenia
  - H2: Przepływ audytu i konfiguracji
  - H2: Jednokierunkowa polityka bezpieczeństwa
  - H2: Uwagi o zgodności ze starszym uwierzytelnianiem
  - H2: Uwaga dotycząca interfejsu webowego
  - H2: Powiązane

## gateway/security/audit-checks.md

- Trasa: /gateway/security/audit-checks
- Nagłówki:
  - H2: Powiązane

## gateway/security/exposure-runbook.md

- Trasa: /gateway/security/exposure-runbook
- Nagłówki:
  - H2: Wybierz wzorzec ekspozycji
  - H2: Inwentaryzacja wstępna
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
  - H3: Zaufanie do wdrożenia i hosta
  - H3: Bezpieczne operacje na plikach
  - H3: Współdzielony obszar roboczy Slack: realne ryzyko
  - H3: Agent współdzielony w firmie: akceptowalny wzorzec
  - H2: Koncepcja zaufania do Gateway i Node
  - H2: Macierz granic zaufania
  - H2: Nie są podatnościami z założenia
  - H2: Utwardzona baza w 60 sekund
  - H2: Szybka reguła współdzielonej skrzynki odbiorczej
  - H2: Model widoczności kontekstu
  - H2: Co sprawdza audyt (wysoki poziom)
  - H2: Mapa przechowywania poświadczeń
  - H2: Lista kontrolna audytu bezpieczeństwa
  - H2: Słownik audytu bezpieczeństwa
  - H2: Control UI przez HTTP
  - H2: Podsumowanie niezabezpieczonych lub niebezpiecznych flag
  - H2: Konfiguracja reverse proxy
  - H2: Uwagi dotyczące HSTS i origin
  - H2: Lokalne logi sesji znajdują się na dysku
  - H2: Wykonywanie Node (system.run)
  - H2: Dynamiczne Skills (watcher / zdalne węzły)
  - H2: Model zagrożeń
  - H2: Podstawowa koncepcja: kontrola dostępu przed inteligencją
  - H2: Model autoryzacji poleceń
  - H2: Ryzyko narzędzi płaszczyzny sterowania
  - H2: Plugins
  - H2: Model dostępu DM: parowanie, allowlist, otwarte, wyłączone
  - H2: Izolacja sesji DM (tryb wielu użytkowników)
  - H3: Bezpieczny tryb DM (zalecany)
  - H2: Allowlists dla DM i grup
  - H2: Prompt injection (czym jest i dlaczego ma znaczenie)
  - H2: Sanityzacja specjalnych tokenów w treści zewnętrznej
  - H2: Flagi obejścia dla niebezpiecznej treści zewnętrznej
  - H3: Prompt injection nie wymaga publicznych DM
  - H3: Samodzielnie hostowane backendy LLM
  - H3: Siła modelu (uwaga dotycząca bezpieczeństwa)
  - H2: Rozumowanie i szczegółowe wyjście w grupach
  - H2: Przykłady utwardzania konfiguracji
  - H3: Uprawnienia plików
  - H3: Ekspozycja sieciowa (bind, port, firewall)
  - H3: Publikowanie portu Docker z UFW
  - H3: Wykrywanie mDNS/Bonjour
  - H3: Zablokuj WebSocket Gateway (lokalne uwierzytelnianie)
  - H3: Nagłówki tożsamości Tailscale Serve
  - H3: Sterowanie przeglądarką przez host Node (zalecane)
  - H3: Sekrety na dysku
  - H3: Pliki .env obszaru roboczego
  - H3: Logi i transkrypty (redakcja i retencja)
  - H3: DM: domyślne parowanie
  - H3: Grupy: wymagaj wzmianki wszędzie
  - H3: Oddzielne numery (WhatsApp, Signal, Telegram)
  - H3: Tryb tylko do odczytu (przez piaskownicę i narzędzia)
  - H3: Bezpieczna baza (kopiuj/wklej)
  - H2: Piaskownica (zalecane)
  - H3: Bariera ochronna delegowania do podagentów
  - H2: Ryzyka sterowania przeglądarką
  - H3: Polityka SSRF przeglądarki (domyślnie ścisła)
  - H2: Profile dostępu na agenta (wielu agentów)
  - H3: Przykład: pełny dostęp (bez piaskownicy)
  - H3: Przykład: narzędzia tylko do odczytu + obszar roboczy tylko do odczytu
  - H3: Przykład: brak dostępu do systemu plików/powłoki (dozwolone wiadomości dostawcy)
  - H2: Reagowanie na incydenty
  - H3: Ogranicz
  - H3: Rotuj (zakładaj kompromitację, jeśli sekrety wyciekły)
  - H3: Audyt
  - H3: Zbierz dane do raportu
  - H2: Skanowanie sekretów
  - H2: Zgłaszanie problemów bezpieczeństwa

## gateway/security/secure-file-operations.md

- Trasa: /gateway/security/secure-file-operations
- Nagłówki:
  - H2: Domyślnie: bez pomocnika Python
  - H2: Co pozostaje chronione bez Python
  - H2: Co dodaje Python
  - H2: Wytyczne dla Plugin i rdzenia

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
  - H3: Tylko tailnet (powiąż z adresem IP tailnet)
  - H3: Publiczny internet (Funnel + wspólne hasło)
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
  - H2: Zachowanie zasad i routingu
  - H2: Odpowiedzi
  - H2: Przykład
  - H2: Powiązane

## gateway/troubleshooting.md

- Trasa: /gateway/troubleshooting
- Nagłówki:
  - H2: Drabina poleceń
  - H2: Po aktualizacji
  - H2: Instalacje split brain i strażnik nowszej konfiguracji
  - H2: Niezgodność protokołu po wycofaniu
  - H2: Dowiązanie symboliczne Skill pominięte jako ucieczka ścieżki
  - H2: Anthropic 429 wymaga dodatkowego użycia dla długiego kontekstu
  - H2: Odpowiedzi upstream 403 zablokowane
  - H2: Lokalny backend zgodny z OpenAI przechodzi bezpośrednie próby, ale uruchomienia agenta zawodzą
  - H2: Brak odpowiedzi
  - H2: Łączność Control UI pulpitu
  - H3: Szybka mapa kodów szczegółów uwierzytelniania
  - H2: Usługa Gateway nie działa
  - H2: Gateway macOS po cichu przestaje odpowiadać, a potem wznawia, gdy dotkniesz pulpitu
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
  - H3: Odniesienie konfiguracji
  - H2: Terminacja TLS i HSTS
  - H3: Wskazówki wdrożeniowe
  - H2: Przykłady konfiguracji proxy
  - H2: Konfiguracja z mieszanymi tokenami
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
  - H2: Wyjście śledzenia sesji
  - H2: Śledzenie cyklu życia Plugin
  - H2: Profilowanie uruchamiania CLI i poleceń
  - H2: Tryb obserwowania Gateway
  - H2: Profil deweloperski + deweloperski Gateway (--dev)
  - H2: Surowe logowanie strumienia (OpenClaw)
  - H2: Surowe logowanie fragmentów zgodnych z OpenAI
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Debugowanie w VSCode
  - H3: Konfiguracja
  - H3: Uwagi
  - H2: Powiązane

## help/environment.md

- Trasa: /help/environment
- Nagłówki:
  - H2: Kolejność pierwszeństwa (najwyższa → najniższa)
  - H2: Poświadczenia dostawcy i .env obszaru roboczego
  - H2: Blok env konfiguracji
  - H2: Import env powłoki
  - H2: Migawki powłoki exec
  - H2: Zmienne env wstrzykiwane w czasie działania
  - H2: Zmienne env UI
  - H2: Podstawianie zmiennych env w konfiguracji
  - H2: Odniesienia do sekretów vs ciągi ${ENV}
  - H2: Zmienne env związane ze ścieżkami
  - H2: Logowanie
  - H3: OPENCLAWHOME
  - H2: Użytkownicy nvm: awarie TLS webfetch
  - H2: Starsze zmienne środowiskowe
  - H2: Powiązane

## help/faq-first-run.md

- Trasa: /help/faq-first-run
- Nagłówki:
  - H2: Szybki start i konfiguracja przy pierwszym uruchomieniu
  - H2: Powiązane

## help/faq-models.md

- Trasa: /help/faq-models
- Nagłówki:
  - H2: Modele: ustawienia domyślne, wybór, aliasy, przełączanie
  - H2: Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”
  - H2: Profile uwierzytelniania: czym są i jak nimi zarządzać
  - H2: Powiązane

## help/faq.md

- Trasa: /help/faq
- Nagłówki:
  - H2: Pierwsze 60 sekund, jeśli coś jest zepsute
  - H2: Szybki start i konfiguracja przy pierwszym uruchomieniu
  - H2: Czym jest OpenClaw?
  - H2: Skills i automatyzacja
  - H2: Piaskownica i pamięć
  - H2: Gdzie rzeczy znajdują się na dysku
  - H2: Podstawy konfiguracji
  - H2: Zdalne Gateway i węzły
  - H2: Zmienne env i ładowanie .env
  - H2: Sesje i wiele czatów
  - H2: Modele, przełączanie awaryjne i profile uwierzytelniania
  - H2: Gateway: porty, „już działa” i tryb zdalny
  - H2: Logowanie i debugowanie
  - H2: Media i załączniki
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
  - H2: Przy dodawaniu skryptów
  - H2: Powiązane

## help/testing-live.md

- Ścieżka: /help/testing-live
- Nagłówki:
  - H2: Na żywo: lokalne polecenia testów dymnych
  - H2: Na żywo: przegląd możliwości węzła Android
  - H2: Na żywo: test dymny modelu (klucze profili)
  - H3: Warstwa 1: bezpośrednie uzupełnianie modelu (bez gateway)
  - H3: Warstwa 2: Gateway + test dymny agenta deweloperskiego (co faktycznie robi „@openclaw”)
  - H2: Na żywo: test dymny backendu CLI (Claude, Gemini lub inne lokalne CLI)
  - H2: Na żywo: osiągalność proxy APNs HTTP/2
  - H2: Na żywo: test dymny wiązania ACP (/acp spawn ... --bind here)
  - H2: Na żywo: test dymny uprzęży app-server Codex
  - H3: Zalecane przepisy na żywo
  - H2: Na żywo: macierz modeli (co obejmujemy)
  - H3: Nowoczesny zestaw testów dymnych (wywoływanie narzędzi + obraz)
  - H3: Punkt odniesienia: wywoływanie narzędzi (Read + opcjonalny Exec)
  - H3: Vision: wysłanie obrazu (załącznik → wiadomość multimodalna)
  - H3: Agregatory / alternatywne Gateway
  - H2: Poświadczenia (nigdy nie commituj)
  - H2: Deepgram na żywo (transkrypcja audio)
  - H2: BytePlus coding plan na żywo
  - H2: Media przepływu pracy ComfyUI na żywo
  - H2: Generowanie obrazów na żywo
  - H2: Generowanie muzyki na żywo
  - H2: Generowanie wideo na żywo
  - H2: Uprząż mediów na żywo
  - H2: Powiązane

## help/testing-updates-plugins.md

- Ścieżka: /help/testing-updates-plugins
- Nagłówki:
  - H2: Co chronimy
  - H2: Lokalny dowód podczas developmentu
  - H2: Ścieżki Docker
  - H2: Akceptacja pakietu
  - H2: Domyślna ścieżka wydania
  - H2: Zgodność ze starszymi wersjami
  - H2: Dodawanie pokrycia
  - H2: Triage awarii

## help/testing.md

- Ścieżka: /help/testing
- Nagłówki:
  - H2: Szybki start
  - H2: Tymczasowe katalogi testowe
  - H2: Uruchamiacze specyficzne dla QA
  - H3: Wspólne poświadczenia Telegram przez Convex (v1)
  - H3: Dodawanie kanału do QA
  - H2: Zestawy testów (co uruchamia się gdzie)
  - H3: Jednostkowe / integracyjne (domyślnie)
  - H3: Stabilność (gateway)
  - H3: E2E (agregat repozytorium)
  - H3: E2E (test dymny gateway)
  - H3: E2E (Control UI z mockowaną przeglądarką)
  - H3: E2E: test dymny backendu OpenShell
  - H3: Na żywo (prawdziwi dostawcy + prawdziwe modele)
  - H2: Który zestaw uruchomić?
  - H2: Testy na żywo (dotykające sieci)
  - H2: Uruchamiacze Docker (opcjonalne sprawdzenia „działa w Linux”)
  - H2: Kontrola poprawności dokumentacji
  - H2: Regresja offline (bezpieczna dla CI)
  - H2: Ewaluacje niezawodności agenta (Skills)
  - H2: Testy kontraktowe (kształt Plugin i kanału)
  - H3: Polecenia
  - H3: Kontrakty kanałów
  - H3: Kontrakty statusu dostawców
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
  - H2: Instalacja Plugin kończy się niepowodzeniem z powodu brakujących rozszerzeń openclaw
  - H2: Polityka instalacji blokuje instalacje lub aktualizacje pluginów
  - H2: Plugin obecny, ale zablokowany przez podejrzane właścicielstwo
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
  - H2: Panel
  - H2: Konfiguracja (opcjonalnie)
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
  - H3: Interfejs WWW i parowanie
  - H3: Konfiguracja i utrzymanie
  - H3: Narzędzia
  - H2: Przebieg przy pierwszym użyciu
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
  - H2: Najlepsze praktyki tagowania
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
  - H2: Wbuduj wymagane pliki binarne w obraz
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
  - H3: Kontrole zdrowia
  - H3: LAN kontra loopback
  - H3: Lokalne dostawcy hosta
  - H3: Backend Claude CLI w Docker
  - H3: Bonjour / mDNS
  - H3: Przechowywanie i trwałość
  - H3: Pomocniki powłoki (opcjonalnie)
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
  - H2: Automatyczna instalacja z Shelley
  - H2: Instalacja ręczna
  - H2: 1) Utwórz VM
  - H2: 2) Zainstaluj wymagania wstępne (na VM)
  - H2: 3) Zainstaluj OpenClaw
  - H2: 4) Skonfiguruj nginx do proxy OpenClaw na port 8000
  - H2: 5) Uzyskaj dostęp do OpenClaw i przyznaj uprawnienia
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
  - H3: „Aplikacja nie nasłuchuje na oczekiwanym adresie”
  - H3: Kontrole zdrowia zawodzą / odmowa połączenia
  - H3: OOM / problemy z pamięcią
  - H3: Problemy z blokadą Gateway
  - H3: Konfiguracja nie jest odczytywana
  - H3: Zapisywanie konfiguracji przez SSH
  - H3: Stan nie jest utrwalany
  - H2: Aktualizacje
  - H3: Polecenie aktualizacji maszyny
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
  - H2: Zweryfikuj swoją konfigurację
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
  - H3: Instalacja z checkoutu main w GitHub
  - H3: Kontenery i menedżery pakietów
  - H2: Zweryfikuj instalację
  - H2: Hosting i wdrożenie
  - H2: Aktualizacja, migracja lub odinstalowanie
  - H2: Rozwiązywanie problemów: nie znaleziono openclaw

## install/installer.md

- Ścieżka: /install/installer
- Nagłówki:
  - H2: Szybkie polecenia
  - H2: install.sh
  - H3: Przebieg (install.sh)
  - H3: Wykrywanie checkoutu źródłowego
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
  - H2: Dostosowanie
  - H3: Instrukcje agenta
  - H3: Konfiguracja Gateway
  - H3: Dodaj dostawców
  - H3: Własna przestrzeń nazw
  - H3: Własny obraz
  - H3: Udostępnienie poza port-forward
  - H2: Ponowne wdrożenie
  - H2: Rozbiórka
  - H2: Uwagi architektoniczne
  - H2: Struktura plików
  - H2: Powiązane

## install/macos-vm.md

- Ścieżka: /install/macos-vm
- Nagłówki:
  - H2: Zalecane ustawienie domyślne (większość użytkowników)
  - H2: Opcje VM macOS
  - H3: Lokalna VM na Twoim Apple Silicon Mac (Lume)
  - H3: Hostowani dostawcy Mac (chmura)
  - H2: Szybka ścieżka (Lume, doświadczeni użytkownicy)
  - H2: Czego potrzebujesz (Lume)
  - H2: 1) Zainstaluj Lume
  - H2: 2) Utwórz VM macOS
  - H2: 3) Ukończ Asystenta konfiguracji
  - H2: 4) Pobierz adres IP VM
  - H2: 5) Połącz się z VM przez SSH
  - H2: 6) Zainstaluj OpenClaw
  - H2: 7) Skonfiguruj kanały
  - H2: 8) Uruchom VM bez monitora
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
  - H2: Dane wyjściowe JSON do automatyzacji
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
  - H2: Dane wyjściowe JSON do automatyzacji
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## install/migrating.md

- Ścieżka: /install/migrating
- Nagłówki:
  - H2: Import z innego systemu agentów
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
  - H3: openclaw: nie znaleziono polecenia
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
  - H2: Uwagi dotyczące ARM
  - H2: Trwałość i kopie zapasowe
  - H2: Fallback: tunel SSH
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
  - H2: Konfiguracja, env i przechowywanie
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
  - H3: Wolumin (wymagany)
  - H3: Zmienne
  - H2: Połącz kanał
  - H2: Kopie zapasowe i migracja
  - H2: Następne kroki

## install/raspberry-pi.md

- Trasa: /install/raspberry-pi
- Nagłówki:
  - H2: Zgodność sprzętowa
  - H2: Wymagania wstępne
  - H2: Konfiguracja
  - H2: Wskazówki dotyczące wydajności
  - H2: Zalecana konfiguracja modelu
  - H2: Uwagi dotyczące binariów ARM
  - H2: Trwałość i kopie zapasowe
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
  - H3: Dostęp do Control UI
  - H2: Funkcje panelu Render
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
  - H2: Ręczne usuwanie usługi (CLI nie jest zainstalowane)
  - H3: macOS (launchd)
  - H3: Linux (jednostka użytkownika systemd)
  - H3: Windows (zaplanowane zadanie)
  - H2: Normalna instalacja a checkout źródłowy
  - H3: Normalna instalacja (install.sh / npm / pnpm / bun)
  - H3: Checkout źródłowy (git clone)
  - H2: Powiązane

## install/updating.md

- Trasa: /install/updating
- Nagłówki:
  - H2: Zalecane: openclaw update
  - H2: Przełączanie między instalacjami npm i git
  - H2: Alternatywa: ponownie uruchom instalator
  - H2: Alternatywa: ręczne npm, pnpm lub bun
  - H3: Zaawansowane tematy instalacji npm
  - H2: Automatyczny aktualizator
  - H2: Po aktualizacji
  - H3: Uruchom doctor
  - H3: Uruchom ponownie Gateway
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
  - H2: Połącz za pomocą tunelu SSH
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
  - H3: CLI: podgląd na żywo (zalecane)
  - H3: Control UI (web)
  - H3: Logi tylko kanału
  - H2: Formaty logów
  - H3: Logi plikowe (JSONL)
  - H3: Wyjście konsoli
  - H3: Logi WebSocket Gateway
  - H2: Konfigurowanie logowania
  - H3: Poziomy logowania
  - H3: Ukierunkowana diagnostyka transportu modelu
  - H3: Korelacja śledzenia
  - H3: Rozmiar i czas wywołań modelu
  - H3: Style konsoli
  - H3: Redakcja
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
  - H2: Model rdzenia
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
  - H3: Dostawca + zapasowe CLI (OpenAI + Whisper CLI)
  - H3: Tylko dostawca z bramkowaniem zakresu
  - H3: Tylko dostawca (Deepgram)
  - H3: Tylko dostawca (Mistral Voxtral)
  - H3: Tylko dostawca (SenseAudio)
  - H3: Echo transkrypcji do czatu (opcjonalne)
  - H2: Uwagi i ograniczenia
  - H3: Obsługa środowiska proxy
  - H2: Wykrywanie wzmianki w grupach
  - H2: Pułapki
  - H2: Powiązane

## nodes/camera.md

- Trasa: /nodes/camera
- Nagłówki:
  - H2: Węzeł iOS
  - H3: Ustawienie użytkownika (domyślnie włączone)
  - H3: Polecenia (przez Gateway node.invoke)
  - H3: Wymóg pierwszego planu
  - H3: Pomocnik CLI
  - H2: Węzeł Android
  - H3: Ustawienie użytkownika Android (domyślnie włączone)
  - H3: Uprawnienia
  - H3: Wymóg pierwszego planu Android
  - H3: Polecenia Android (przez Gateway node.invoke)
  - H3: Ochrona ładunku
  - H2: Aplikacja macOS
  - H3: Ustawienie użytkownika (domyślnie wyłączone)
  - H3: Pomocnik CLI (node invoke)
  - H2: Bezpieczeństwo + praktyczne ograniczenia
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
  - H3: Zdalny Gateway przez tunel SSH (wiązanie loopback)
  - H3: Uruchom host węzła (usługa)
  - H3: Sparuj + nazwij
  - H3: Dodaj polecenia do listy dozwolonych
  - H3: Skieruj exec do węzła
  - H2: Wywoływanie poleceń
  - H2: Polityka poleceń
  - H2: Konfiguracja (openclaw.json)
  - H2: Zrzuty ekranu (migawki canvas)
  - H3: Kontrolki Canvas
  - H3: A2UI (Canvas)
  - H2: Zdjęcia + wideo (kamera węzła)
  - H2: Nagrania ekranu (węzły)
  - H2: Lokalizacja (węzły)
  - H2: SMS (węzły Android)
  - H2: Polecenia urządzenia Android + danych osobistych
  - H2: Polecenia systemowe (host węzła / węzeł Mac)
  - H2: Wiązanie węzła exec
  - H2: Mapa uprawnień
  - H2: Bezgłowy host węzła (wieloplatformowy)
  - H2: Tryb węzła Mac

## nodes/location-command.md

- Trasa: /nodes/location-command
- Nagłówki:
  - H2: TL;DR
  - H2: Dlaczego selektor (a nie tylko przełącznik)
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
  - H3: Wpisy modelu
  - H3: Dane uwierzytelniające dostawcy (apiKey)
  - H2: Wartości domyślne i limity
  - H3: Automatyczne wykrywanie rozumienia mediów (domyślne)
  - H3: Obsługa środowiska proxy (modele dostawców)
  - H2: Możliwości (opcjonalne)
  - H2: Macierz obsługi dostawców (integracje OpenClaw)
  - H2: Wskazówki wyboru modelu
  - H2: Polityka załączników
  - H2: Przykłady konfiguracji
  - H2: Wyjście statusu
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
  - H2: Wymagania pierwszego planu
  - H2: Macierz uprawnień
  - H2: Parowanie a zatwierdzenia
  - H2: Typowe kody błędów węzła
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
  - H2: Poza zakresem
  - H2: Obecna architektura
  - H2: Obecna luka
  - H2: Pożądane zachowanie
  - H2: Ograniczenia projektowe
  - H3: Serwer aplikacji Codex pozostaje kanoniczny dla natywnego stanu wątku
  - H3: Składanie silnika kontekstu musi być projektowane do wejść Codex
  - H3: Stabilność cache promptu ma znaczenie
  - H3: Semantyka wyboru środowiska uruchomieniowego się nie zmienia
  - H2: Plan implementacji
  - H3: 1. Wyeksportuj lub przenieś pomocniki prób silnika kontekstu do ponownego użycia
  - H3: 2. Dodaj pomocnik projekcji kontekstu Codex
  - H3: 3. Podłącz bootstrap przed uruchomieniem wątku Codex
  - H3: 4. Podłącz assemble przed thread/start / thread/resume i turn/start
  - H3: 5. Zachowaj stabilne formatowanie cache promptu
  - H3: 6. Podłącz post-turn po lustrzanym zapisie transkrypcji
  - H3: 7. Znormalizuj użycie i kontekst środowiska uruchomieniowego cache promptu
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
  - H2: Poza zakresem
  - H2: Model docelowy
  - H2: Metadane dostarczania
  - H2: Kontrakt możliwości środowiska uruchomieniowego
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
  - H3: 3) Połącz z Android
  - H3: Sygnały obecności alive
  - H3: 4) Zatwierdź parowanie (CLI)
  - H3: 5) Zweryfikuj, że węzeł jest połączony
  - H3: 6) Czat + historia
  - H3: 7) Canvas + kamera
  - H4: Host Gateway Canvas (zalecany dla treści webowych)
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
  - H2: Typowe linki
  - H2: Instalacja usługi Gateway (CLI)
  - H2: Powiązane

## platforms/ios.md

- Trasa: /platforms/ios
- Nagłówki:
  - H2: Co robi
  - H2: Wymagania
  - H2: Szybki start (sparuj + połącz)
  - H2: Push oparty na przekaźniku dla oficjalnych buildów
  - H2: Sygnały alive w tle
  - H2: Uwierzytelnianie i przepływ zaufania
  - H2: Ścieżki wykrywania
  - H3: Bonjour (LAN)
  - H3: Tailnet (między sieciami)
  - H3: Ręczny host/port
  - H2: Canvas + A2UI
  - H2: Relacja z Computer Use
  - H3: Eval / migawka Canvas
  - H2: Wybudzanie głosowe + tryb rozmowy
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
  - H2: Presja pamięci i zabicia OOM
  - H2: Powiązane

## platforms/mac/bundled-gateway.md

- Trasa: /platforms/mac/bundled-gateway
- Nagłówki:
  - H2: Zainstaluj CLI (wymagane dla trybu lokalnego)
  - H2: Launchd (Gateway jako LaunchAgent)
  - H2: Zgodność wersji
  - H2: Katalog stanu na macOS
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
  - H3: Kompilacja nie powiodła się: niezgodność toolchaina lub SDK
  - H3: Aplikacja zawiesza się przy nadawaniu uprawnień
  - H3: Gateway wyświetla „Uruchamianie...” bez końca
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
  - H1: Logowanie (macOS)
  - H2: Rotacyjny plik logu diagnostycznego (panel Debug)
  - H2: Prywatne dane w ujednoliconym logowaniu w macOS
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
  - H2: Podmenu kontekstowe
  - H2: Tekst wiersza stanu (menu)
  - H2: Pobieranie zdarzeń
  - H2: Nadpisanie debugowania
  - H2: Lista kontrolna testów
  - H2: Powiązane

## platforms/mac/peekaboo.md

- Trasa: /platforms/mac/peekaboo
- Nagłówki:
  - H2: Czym to jest (i czym nie jest)
  - H2: Relacja z Computer Use
  - H2: Włącz most
  - H2: Kolejność wykrywania klienta
  - H2: Bezpieczeństwo i uprawnienia
  - H2: Zachowanie zrzutu (automatyzacja)
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## platforms/mac/permissions.md

- Trasa: /platforms/mac/permissions
- Nagłówki:
  - H2: Wymagania dotyczące stabilnych uprawnień
  - H2: Uprawnienia dostępności dla środowisk uruchomieniowych Node i CLI
  - H2: Lista kontrolna odzyskiwania, gdy monity znikają
  - H2: Uprawnienia plików i folderów (Desktop/Documents/Downloads)
  - H2: Powiązane

## platforms/mac/remote.md

- Trasa: /platforms/mac/remote
- Nagłówki:
  - H2: Tryby
  - H2: Zdalne transporty
  - H2: Wymagania wstępne na zdalnym hoście
  - H2: Konfiguracja aplikacji macOS
  - H2: Czat WWW
  - H2: Uprawnienia
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Przepływ logowania WhatsApp (zdalny)
  - H2: Rozwiązywanie problemów
  - H2: Dźwięki powiadomień
  - H2: Powiązane

## platforms/mac/signing.md

- Trasa: /platforms/mac/signing
- Nagłówki:
  - H1: Podpisywanie mac (kompilacje debugowania)
  - H2: Użycie
  - H3: Uwaga dotycząca podpisywania ad-hoc
  - H2: Metadane kompilacji dla okna O programie
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
  - H2: Jak to jest połączone
  - H2: Powierzchnia bezpieczeństwa
  - H2: Znane ograniczenia
  - H2: Powiązane

## platforms/mac/xpc.md

- Trasa: /platforms/mac/xpc
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

- Trasa: /platforms/macos
- Nagłówki:
  - H2: Pobieranie
  - H2: Pierwsze uruchomienie
  - H2: Wybierz tryb Gateway
  - H2: Za co odpowiada aplikacja
  - H2: Szczegółowe strony macOS
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
  - H2: Natywne CLI i Gateway dla Windows
  - H2: Gateway WSL2
  - H2: Automatyczne uruchamianie Gateway przed logowaniem do Windows
  - H2: Udostępnianie usług WSL przez LAN
  - H2: Rozwiązywanie problemów
  - H3: Ikona w zasobniku nie pojawia się
  - H3: Konfiguracja lokalna nie powiodła się
  - H3: Aplikacja informuje, że wymagane jest parowanie
  - H3: Czat WWW nie może połączyć się ze zdalnym Gateway
  - H3: Polecenia screen.snapshot, kamera lub audio nie działają
  - H3: Łączność z Git lub GitHub nie działa
  - H2: Powiązane

## plugins/adding-capabilities.md

- Trasa: /plugins/adding-capabilities
- Nagłówki:
  - H2: Kiedy utworzyć capability
  - H2: Standardowa sekwencja
  - H2: Co trafia gdzie
  - H2: Granice providera i harnessu
  - H2: Lista kontrolna plików
  - H2: Przykład roboczy: generowanie obrazów
  - H2: Providerzy osadzania
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
  - H3: Zachowanie oparte najpierw na manifeście
  - H3: Granica pamięci podręcznej Plugin
  - H2: Model rejestru
  - H2: Wywołania zwrotne powiązania rozmowy
  - H2: Hooki środowiska uruchomieniowego providera
  - H3: Kolejność hooków i użycie
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
  - H2: Pakiety pakietów
  - H3: Metadane katalogu kanałów
  - H2: Pluginy silnika kontekstu
  - H2: Dodawanie nowej capability
  - H3: Lista kontrolna capability
  - H3: Szablon capability
  - H2: Powiązane

## plugins/architecture.md

- Trasa: /plugins/architecture
- Nagłówki:
  - H2: Publiczny model capability
  - H3: Stanowisko zgodności zewnętrznej
  - H3: Kształty Plugin
  - H3: Starsze hooki
  - H3: Sygnały zgodności
  - H2: Omówienie architektury
  - H3: Migawka metadanych Plugin i tabela wyszukiwania
  - H3: Planowanie aktywacji
  - H3: Pluginy kanałów i współdzielone narzędzie wiadomości
  - H2: Model własności capability
  - H3: Warstwowanie capability
  - H3: Przykład firmowego Plugin o wielu capability
  - H3: Przykład capability: rozumienie wideo
  - H2: Kontrakty i egzekwowanie
  - H3: Co należy do kontraktu
  - H2: Model wykonania
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
  - H2: Lista kontrolna przed zgłoszeniem
  - H2: Testowanie względem wersji beta
  - H2: Następne kroki
  - H2: Powiązane

## plugins/bundles.md

- Trasa: /plugins/bundles
- Nagłówki:
  - H2: Dlaczego istnieją pakiety
  - H2: Zainstaluj pakiet
  - H2: Co OpenClaw mapuje z pakietów
  - H3: Obecnie obsługiwane
  - H4: Zawartość Skill
  - H4: Pakiety hooków
  - H4: MCP dla osadzonego OpenClaw
  - H4: Ustawienia osadzonego OpenClaw
  - H4: LSP osadzonego OpenClaw
  - H3: Wykryte, ale niewykonywane
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
  - H2: Wybory marketplace
  - H2: Dołączony marketplace macOS
  - H2: Limit katalogu zdalnego
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
  - H2: Piaskownicowe wykonanie natywne
  - H2: Izolacja uwierzytelniania i środowiska
  - H2: Narzędzia dynamiczne
  - H2: Limity czasu
  - H2: Wykrywanie modelu
  - H2: Pliki bootstrapu przestrzeni roboczej
  - H2: Nadpisania środowiska
  - H2: Powiązane

## plugins/codex-harness-runtime.md

- Trasa: /plugins/codex-harness-runtime
- Nagłówki:
  - H2: Omówienie
  - H2: Powiązania wątków i zmiany modelu
  - H2: Widoczne odpowiedzi i Heartbeat
  - H2: Granice hooków
  - H2: Kontrakt wsparcia V1
  - H2: Uprawnienia natywne i elicitation MCP
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
  - H3: Wdrożenie mieszanego providera
  - H3: Wdrożenie Codex z fail-closed
  - H2: Polityka app-server
  - H2: Polecenia i diagnostyka
  - H3: Sprawdzaj wątki Codex lokalnie
  - H2: Natywne pluginy Codex
  - H2: Computer Use
  - H2: Granice środowiska uruchomieniowego
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## plugins/codex-native-plugins.md

- Trasa: /plugins/codex-native-plugins
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Zarządzaj pluginami z czatu
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
  - H3: Ścieżka akceptacji maintainerów
  - H2: Polityka wycofywania
  - H2: Obecne obszary zgodności
  - H3: Płaskie aliasy wywołań zwrotnych przychodzących WhatsApp
  - H3: Pola dopuszczania przychodzących WhatsApp
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
  - H2: Korzenie instalacji
  - H2: Lokalne pluginy
  - H2: Uruchamianie i ponowne ładowanie
  - H2: Dołączone pluginy
  - H2: Czyszczenie spuścizny

## plugins/google-meet.md

- Ścieżka: /plugins/google-meet
- Nagłówki:
  - H2: Szybki start
  - H3: Lokalny Gateway + Chrome w Parallels
  - H2: Uwagi instalacyjne
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
  - H3: Hook środowiska wykonywania
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
  - H2: Restart i inspekcja
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
  - H2: Dokumentacja metadanych narzędzia
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
  - H2: Manifest kontra package.json
  - H3: Pola package.json wpływające na wykrywanie
  - H2: Pierwszeństwo wykrywania (zduplikowane identyfikatory pluginów)
  - H2: Wymagania JSON Schema
  - H2: Zachowanie walidacji
  - H2: Uwagi
  - H2: Powiązane

## plugins/memory-lancedb.md

- Ścieżka: /plugins/memory-lancedb
- Nagłówki:
  - H2: Instalacja
  - H2: Szybki start
  - H2: Osadzania oparte na dostawcy
  - H2: Osadzania Ollama
  - H2: Dostawcy zgodni z OpenAI
  - H2: Limity przywoływania i przechwytywania
  - H2: Polecenia
  - H2: Magazyn
  - H2: Zależności środowiska uruchomieniowego
  - H2: Rozwiązywanie problemów
  - H3: Długość wejścia przekracza długość kontekstu
  - H3: Nieobsługiwany model osadzania
  - H3: Plugin się ładuje, ale nie pojawiają się żadne wspomnienia
  - H2: Powiązane

## plugins/memory-wiki.md

- Ścieżka: /plugins/memory-wiki
- Nagłówki:
  - H2: Co dodaje
  - H2: Jak pasuje do pamięci
  - H2: Zalecany wzorzec hybrydowy
  - H2: Tryby skarbca
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Układ skarbca
  - H2: Importy Open Knowledge Format
  - H2: Strukturyzowane twierdzenia i dowody
  - H2: Metadane encji widoczne dla agenta
  - H2: Potok kompilacji
  - H2: Pulpity i raporty o stanie
  - H2: Wyszukiwanie i pobieranie
  - H2: Narzędzia agenta
  - H2: Zachowanie promptu i kontekstu
  - H2: Konfiguracja
  - H3: Przykład: QMD + tryb bridge
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
  - H2: Mapowanie dostawców
  - H2: Prezentacja kontra InteractiveReply
  - H2: Przypięcie dostarczenia
  - H2: Lista kontrolna autora pluginu
  - H2: Powiązana dokumentacja

## plugins/oc-path.md

- Ścieżka: /plugins/oc-path
- Nagłówki:
  - H2: Dlaczego warto to włączyć
  - H2: Gdzie to działa
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
  - H2: Tylko checkout źródeł

## plugins/plugin-permission-requests.md

- Ścieżka: /plugins/plugin-permission-requests
- Nagłówki:
  - H2: Wybór właściwej bramki
  - H2: Żądanie zatwierdzenia przed wywołaniem narzędzia
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
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/admin-http-rpc.md

- Ścieżka: /plugins/reference/admin-http-rpc
- Nagłówki:
  - H1: Plugin Admin Http Rpc
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/alibaba.md

- Ścieżka: /plugins/reference/alibaba
- Nagłówki:
  - H1: Plugin Alibaba
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/amazon-bedrock-mantle.md

- Ścieżka: /plugins/reference/amazon-bedrock-mantle
- Nagłówki:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/amazon-bedrock.md

- Ścieżka: /plugins/reference/amazon-bedrock
- Nagłówki:
  - H1: Plugin Amazon Bedrock
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/arcee.md

- Ścieżka: /plugins/reference/arcee
- Nagłówki:
  - H1: Plugin Arcee
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/azure-speech.md

- Ścieżka: /plugins/reference/azure-speech
- Nagłówki:
  - H1: Plugin Azure Speech
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/browser.md

- Ścieżka: /plugins/reference/browser
- Nagłówki:
  - H1: Plugin Browser
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/chutes.md

- Ścieżka: /plugins/reference/chutes
- Nagłówki:
  - H1: Plugin Chutes
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/clickclack.md

- Ścieżka: /plugins/reference/clickclack
- Nagłówki:
  - H1: Plugin Clickclack
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/cloudflare-ai-gateway.md

- Ścieżka: /plugins/reference/cloudflare-ai-gateway
- Nagłówki:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/cohere.md

- Ścieżka: /plugins/reference/cohere
- Nagłówki:
  - H1: Plugin Cohere
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/comfy.md

- Ścieżka: /plugins/reference/comfy
- Nagłówki:
  - H1: Plugin ComfyUI
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/deepgram.md

- Ścieżka: /plugins/reference/deepgram
- Nagłówki:
  - H1: Plugin Deepgram
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/deepinfra.md

- Ścieżka: /plugins/reference/deepinfra
- Nagłówki:
  - H1: Plugin DeepInfra
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/deepseek.md

- Ścieżka: /plugins/reference/deepseek
- Nagłówki:
  - H1: Plugin DeepSeek
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

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
  - H2: Powiązana dokumentacja

## plugins/reference/document-extract.md

- Ścieżka: /plugins/reference/document-extract
- Nagłówki:
  - H1: Plugin Document Extract
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/duckduckgo.md

- Ścieżka: /plugins/reference/duckduckgo
- Nagłówki:
  - H1: Plugin DuckDuckGo
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/elevenlabs.md

- Ścieżka: /plugins/reference/elevenlabs
- Nagłówki:
  - H1: Plugin Elevenlabs
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/exa.md

- Ścieżka: /plugins/reference/exa
- Nagłówki:
  - H1: Plugin Exa
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/fal.md

- Ścieżka: /plugins/reference/fal
- Nagłówki:
  - H1: Plugin fal
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/feishu.md

- Ścieżka: /plugins/reference/feishu
- Nagłówki:
  - H1: Plugin Feishu
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/file-transfer.md

- Ścieżka: /plugins/reference/file-transfer
- Nagłówki:
  - H1: Plugin File Transfer
  - H2: Dystrybucja
  - H2: Interfejs

## plugins/reference/firecrawl.md

- Ścieżka: /plugins/reference/firecrawl
- Nagłówki:
  - H1: Plugin Firecrawl
  - H2: Dystrybucja
  - H2: Interfejs
  - H2: Powiązana dokumentacja

## plugins/reference/fireworks.md

- Trasa: /plugins/reference/fireworks
- Nagłówki:
  - H1: Fireworks Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/github-copilot.md

- Trasa: /plugins/reference/github-copilot
- Nagłówki:
  - H1: GitHub Copilot Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/gmi.md

- Trasa: /plugins/reference/gmi
- Nagłówki:
  - H1: Gmi Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/google-meet.md

- Trasa: /plugins/reference/google-meet
- Nagłówki:
  - H1: Google Meet Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/google.md

- Trasa: /plugins/reference/google
- Nagłówki:
  - H1: Google Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/googlechat.md

- Trasa: /plugins/reference/googlechat
- Nagłówki:
  - H1: Google Chat Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/gradium.md

- Trasa: /plugins/reference/gradium
- Nagłówki:
  - H1: Gradium Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/groq.md

- Trasa: /plugins/reference/groq
- Nagłówki:
  - H1: Groq Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/huggingface.md

- Trasa: /plugins/reference/huggingface
- Nagłówki:
  - H1: Hugging Face Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/imessage.md

- Trasa: /plugins/reference/imessage
- Nagłówki:
  - H1: iMessage Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/inworld.md

- Trasa: /plugins/reference/inworld
- Nagłówki:
  - H1: Inworld Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/irc.md

- Trasa: /plugins/reference/irc
- Nagłówki:
  - H1: IRC Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/kilocode.md

- Trasa: /plugins/reference/kilocode
- Nagłówki:
  - H1: Kilocode Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/kimi.md

- Trasa: /plugins/reference/kimi
- Nagłówki:
  - H1: Kimi Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/line.md

- Trasa: /plugins/reference/line
- Nagłówki:
  - H1: LINE Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/litellm.md

- Trasa: /plugins/reference/litellm
- Nagłówki:
  - H1: LiteLLM Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/llama-cpp.md

- Trasa: /plugins/reference/llama-cpp
- Nagłówki:
  - H1: Llama Cpp Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/llm-task.md

- Trasa: /plugins/reference/llm-task
- Nagłówki:
  - H1: LLM Task Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/lmstudio.md

- Trasa: /plugins/reference/lmstudio
- Nagłówki:
  - H1: LM Studio Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/lobster.md

- Trasa: /plugins/reference/lobster
- Nagłówki:
  - H1: Lobster Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/matrix.md

- Trasa: /plugins/reference/matrix
- Nagłówki:
  - H1: Matrix Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/mattermost.md

- Trasa: /plugins/reference/mattermost
- Nagłówki:
  - H1: Mattermost Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/memory-core.md

- Trasa: /plugins/reference/memory-core
- Nagłówki:
  - H1: Memory Core Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/memory-lancedb.md

- Trasa: /plugins/reference/memory-lancedb
- Nagłówki:
  - H1: Memory Lancedb Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/memory-wiki.md

- Trasa: /plugins/reference/memory-wiki
- Nagłówki:
  - H1: Memory Wiki Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/microsoft-foundry.md

- Trasa: /plugins/reference/microsoft-foundry
- Nagłówki:
  - H1: Microsoft Foundry Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Wymagania
  - H2: Modele czatu
  - H2: Generowanie obrazów MAI
  - H2: Rozwiązywanie problemów

## plugins/reference/microsoft.md

- Trasa: /plugins/reference/microsoft
- Nagłówki:
  - H1: Microsoft Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-claude.md

- Trasa: /plugins/reference/migrate-claude
- Nagłówki:
  - H1: Migrate Claude Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/migrate-hermes.md

- Trasa: /plugins/reference/migrate-hermes
- Nagłówki:
  - H1: Migrate Hermes Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/minimax.md

- Trasa: /plugins/reference/minimax
- Nagłówki:
  - H1: MiniMax Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/mistral.md

- Trasa: /plugins/reference/mistral
- Nagłówki:
  - H1: Mistral Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/moonshot.md

- Trasa: /plugins/reference/moonshot
- Nagłówki:
  - H1: Moonshot Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/msteams.md

- Trasa: /plugins/reference/msteams
- Nagłówki:
  - H1: Microsoft Teams Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/nextcloud-talk.md

- Trasa: /plugins/reference/nextcloud-talk
- Nagłówki:
  - H1: Nextcloud Talk Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/nostr.md

- Trasa: /plugins/reference/nostr
- Nagłówki:
  - H1: Nostr Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/novita.md

- Trasa: /plugins/reference/novita
- Nagłówki:
  - H1: Novita Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/nvidia.md

- Trasa: /plugins/reference/nvidia
- Nagłówki:
  - H1: NVIDIA Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/oc-path.md

- Trasa: /plugins/reference/oc-path
- Nagłówki:
  - H1: Oc Path Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/ollama.md

- Trasa: /plugins/reference/ollama
- Nagłówki:
  - H1: Ollama Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/open-prose.md

- Trasa: /plugins/reference/open-prose
- Nagłówki:
  - H1: Open Prose Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/openai.md

- Trasa: /plugins/reference/openai
- Nagłówki:
  - H1: OpenAI Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/opencode-go.md

- Trasa: /plugins/reference/opencode-go
- Nagłówki:
  - H1: OpenCode Go Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/opencode.md

- Trasa: /plugins/reference/opencode
- Nagłówki:
  - H1: OpenCode Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/openrouter.md

- Trasa: /plugins/reference/openrouter
- Nagłówki:
  - H1: OpenRouter Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/openshell.md

- Trasa: /plugins/reference/openshell
- Nagłówki:
  - H1: Openshell Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/perplexity.md

- Trasa: /plugins/reference/perplexity
- Nagłówki:
  - H1: Perplexity Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/pixverse.md

- Trasa: /plugins/reference/pixverse
- Nagłówki:
  - H1: PixVerse Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/policy.md

- Trasa: /plugins/reference/policy
- Nagłówki:
  - H1: Policy Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Zachowanie
  - H2: Powiązane dokumenty

## plugins/reference/qa-channel.md

- Trasa: /plugins/reference/qa-channel
- Nagłówki:
  - H1: QA Channel Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/qa-lab.md

- Trasa: /plugins/reference/qa-lab
- Nagłówki:
  - H1: QA Lab Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qa-matrix.md

- Trasa: /plugins/reference/qa-matrix
- Nagłówki:
  - H1: QA Matrix Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/qianfan.md

- Trasa: /plugins/reference/qianfan
- Nagłówki:
  - H1: Qianfan Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/qqbot.md

- Trasa: /plugins/reference/qqbot
- Nagłówki:
  - H1: QQ Bot Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/qwen.md

- Trasa: /plugins/reference/qwen
- Nagłówki:
  - H1: Qwen Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/raft.md

- Trasa: /plugins/reference/raft
- Nagłówki:
  - H1: Raft Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/runway.md

- Trasa: /plugins/reference/runway
- Nagłówki:
  - H1: Runway Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/searxng.md

- Trasa: /plugins/reference/searxng
- Nagłówki:
  - H1: SearXNG Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/senseaudio.md

- Trasa: /plugins/reference/senseaudio
- Nagłówki:
  - H1: Senseaudio Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/sglang.md

- Trasa: /plugins/reference/sglang
- Nagłówki:
  - H1: SGLang Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/signal.md

- Trasa: /plugins/reference/signal
- Nagłówki:
  - H1: Signal Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/slack.md

- Trasa: /plugins/reference/slack
- Nagłówki:
  - H1: Slack Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/sms.md

- Trasa: /plugins/reference/sms
- Nagłówki:
  - H1: Sms Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/stepfun.md

- Trasa: /plugins/reference/stepfun
- Nagłówki:
  - H1: StepFun Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/synology-chat.md

- Trasa: /plugins/reference/synology-chat
- Nagłówki:
  - H1: Synology Chat Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/synthetic.md

- Trasa: /plugins/reference/synthetic
- Nagłówki:
  - H1: Synthetic Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/tavily.md

- Trasa: /plugins/reference/tavily
- Nagłówki:
  - H1: Tavily Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/telegram.md

- Trasa: /plugins/reference/telegram
- Nagłówki:
  - H1: Telegram Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/tencent.md

- Trasa: /plugins/reference/tencent
- Nagłówki:
  - H1: Tencent Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/tlon.md

- Trasa: /plugins/reference/tlon
- Nagłówki:
  - H1: Tlon Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/together.md

- Trasa: /plugins/reference/together
- Nagłówki:
  - H1: Together Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/tokenjuice.md

- Trasa: /plugins/reference/tokenjuice
- Nagłówki:
  - H1: Tokenjuice Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

## plugins/reference/tts-local-cli.md

- Trasa: /plugins/reference/tts-local-cli
- Nagłówki:
  - H1: TTS Local CLI Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia

## plugins/reference/twitch.md

- Trasa: /plugins/reference/twitch
- Nagłówki:
  - H1: Twitch Plugin
  - H2: Dystrybucja
  - H2: Powierzchnia
  - H2: Powiązane dokumenty

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
  - H2: Kiedy używać harness
  - H2: Za co nadal odpowiada core
  - H2: Rejestrowanie harness
  - H2: Zasady wyboru
  - H2: Parowanie dostawcy z harness
  - H3: Middleware wyników narzędzi
  - H3: Klasyfikacja wyniku końcowego
  - H3: Efekty uboczne po stronie końca agenta
  - H3: Dane wejściowe użytkownika i powierzchnie narzędzi
  - H3: Natywny tryb harness Codex
  - H2: Rygor środowiska uruchomieniowego
  - H2: Natywne sesje i kopia transkrypcji
  - H2: Wyniki narzędzi i multimediów
  - H2: Obecne ograniczenia
  - H2: Powiązane

## plugins/sdk-channel-inbound.md

- Ścieżka: /plugins/sdk-channel-inbound
- Nagłówki:
  - H2: Pomocnicze elementy core
  - H2: Migracja

## plugins/sdk-channel-ingress.md

- Ścieżka: /plugins/sdk-channel-ingress
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
  - H2: Jak działają Plugin kanałów
  - H2: Zatwierdzenia i możliwości kanałów
  - H2: Zasady wzmianki przychodzącej
  - H2: Przewodnik
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
  - H2: Kształty Plugin
  - H2: Powiązane

## plugins/sdk-migration.md

- Ścieżka: /plugins/sdk-migration
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

- Ścieżka: /plugins/sdk-overview
- Nagłówki:
  - H2: Konwencja importu
  - H2: Referencja podścieżek
  - H2: API rejestracji
  - H3: Rejestracja możliwości
  - H3: Narzędzia i polecenia
  - H3: Infrastruktura
  - H3: Haki hosta dla Plugin workflow
  - H3: Rejestracja wykrywania Gateway
  - H3: Metadane rejestracji CLI
  - H3: Rejestracja backendu CLI
  - H3: Wyłączne sloty
  - H3: Wycofane adaptery osadzania pamięci
  - H3: Zdarzenia i cykl życia
  - H3: Semantyka decyzji haków
  - H3: Pola obiektu API
  - H2: Konwencja modułów wewnętrznych
  - H2: Powiązane

## plugins/sdk-provider-plugins.md

- Ścieżka: /plugins/sdk-provider-plugins
- Nagłówki:
  - H2: Przewodnik
  - H2: Publikowanie w ClawHub
  - H2: Struktura plików
  - H2: Referencja kolejności katalogu
  - H2: Następne kroki
  - H2: Powiązane

## plugins/sdk-runtime.md

- Ścieżka: /plugins/sdk-runtime
- Nagłówki:
  - H2: Ładowanie i zapisy konfiguracji
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
  - H2: Manifest Plugin
  - H2: Publikowanie w ClawHub
  - H2: Wejście konfiguracji
  - H3: Wąskie importy pomocników konfiguracji
  - H3: Promocja pojedynczego konta zarządzana przez kanał
  - H2: Schemat konfiguracji
  - H3: Budowanie schematów konfiguracji kanału
  - H2: Kreatory konfiguracji
  - H2: Publikowanie i instalowanie
  - H2: Powiązane

## plugins/sdk-subpaths.md

- Ścieżka: /plugins/sdk-subpaths
- Nagłówki:
  - H2: Wejście Plugin
  - H3: Wycofana zgodność i pomocniki testowe
  - H3: Zarezerwowane podścieżki pomocnicze bundled Plugin
  - H2: Powiązane

## plugins/sdk-testing.md

- Ścieżka: /plugins/sdk-testing
- Nagłówki:
  - H2: Narzędzia testowe
  - H3: Dostępne eksporty
  - H3: Typy
  - H2: Testowanie rozwiązywania celu
  - H2: Wzorce testowania
  - H3: Testowanie kontraktów rejestracji
  - H3: Testowanie dostępu do konfiguracji środowiska uruchomieniowego
  - H3: Testy jednostkowe Plugin kanału
  - H3: Testy jednostkowe Plugin dostawcy
  - H3: Mockowanie środowiska uruchomieniowego Plugin
  - H3: Testowanie ze stubami per instancja
  - H2: Testy kontraktowe (Plugin w repozytorium)
  - H3: Uruchamianie testów zakresowych
  - H2: Egzekwowanie lint (Plugin w repozytorium)
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
  - H2: Instalowanie i sprawdzanie lokalnie
  - H2: Publikowanie
  - H2: Rozwiązywanie problemów
  - H3: nie znaleziono wejścia Plugin: ./dist/index.js
  - H3: wejście Plugin nie ujawnia metadanych defineToolPlugin
  - H3: wygenerowane metadane openclaw.plugin.json są nieaktualne
  - H3: package.json openclaw.extensions musi zawierać ./dist/index.js
  - H3: Nie można znaleźć pakietu 'typebox'
  - H3: Narzędzie nie pojawia się po instalacji
  - H2: Zobacz też

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
  - H3: Przykłady dostawców strumieniowania
  - H2: TTS dla połączeń
  - H3: Przykłady TTS
  - H2: Połączenia przychodzące
  - H3: Routing per numer
  - H3: Kontrakt wypowiedzi głosowej
  - H3: Zachowanie startu konwersacji
  - H3: Okres karencji rozłączenia strumienia Twilio
  - H2: Czyściciel nieaktualnych połączeń
  - H2: Bezpieczeństwo Webhook
  - H2: CLI
  - H2: Narzędzie agenta
  - H2: Gateway RPC
  - H2: Rozwiązywanie problemów
  - H3: Konfiguracja nie przechodzi ekspozycji Webhook
  - H3: Dane uwierzytelniające dostawcy nie działają
  - H3: Połączenia startują, ale Webhook dostawcy nie docierają
  - H3: Weryfikacja podpisu nie działa
  - H3: Dołączanie Twilio do Google Meet nie działa
  - H3: Połączenie w czasie rzeczywistym nie ma mowy
  - H2: Powiązane

## plugins/webhooks.md

- Ścieżka: /plugins/webhooks
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

- Ścieżka: /plugins/workboard
- Nagłówki:
  - H2: Stan domyślny
  - H2: Co zawierają karty
  - H2: Wykonania kart i zadania
  - H2: Koordynacja agentów
  - H3: Wybór workera dispatch
  - H3: Prompt workera i cykl życia
  - H3: Punkty wejścia dispatch
  - H2: CLI i polecenie slash
  - H2: Synchronizacja cyklu życia sesji
  - H2: Workflow panelu
  - H2: Uprawnienia
  - H2: Konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Karta mówi, że Workboard jest niedostępny
  - H3: Karty się nie zapisują
  - H3: Uruchomienie karty nie otwiera oczekiwanej sesji
  - H3: Dispatch nie uruchamia workera
  - H2: Powiązane

## plugins/zalouser.md

- Ścieżka: /plugins/zalouser
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

- Ścieżka: /prose
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
  - H2: Domyślne ustawienia myślenia (Claude Fable 5, 4.8 i 4.6)
  - H2: Buforowanie promptów
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/arcee.md

- Ścieżka: /providers/arcee
- Nagłówki:
  - H2: Instalacja Plugin
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
  - H2: Instalacja Plugin
  - H2: Pierwsze kroki
  - H2: Konfiguracja nieinteraktywna
  - H2: Wbudowany katalog
  - H2: Konfiguracja ręczna
  - H2: Powiązane

## providers/chutes.md

- Ścieżka: /providers/chutes
- Nagłówki:
  - H2: Instalacja Plugin
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
  - H2: Trzy sposoby użycia Copilot w OpenClaw
  - H2: Opcjonalne flagi
  - H2: Nieinteraktywne wdrażanie
  - H2: Osadzenia wyszukiwania pamięci
  - H3: Konfiguracja
  - H3: Jak to działa
  - H2: Powiązane

## providers/gmi.md

- Trasa: /providers/gmi
- Nagłówki:
  - H2: Konfiguracja
  - H2: Ustawienia domyślne
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
  - H3: Nadpisanie głosu dla wiadomości
  - H2: Dane wyjściowe
  - H2: Kolejność automatycznego wyboru
  - H2: Powiązane

## providers/groq.md

- Trasa: /providers/groq
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Pierwsze kroki
  - H3: Przykład pliku konfiguracyjnego
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
  - H3: Plik konfiguracyjny
  - H2: Konfiguracja zaawansowana
  - H3: Generowanie obrazów
  - H2: Powiązane

## providers/lmstudio.md

- Trasa: /providers/lmstudio
- Nagłówki:
  - H2: Szybki start
  - H2: Nieinteraktywne wdrażanie
  - H2: Konfiguracja
  - H3: Zgodność użycia strumieniowego
  - H3: Zgodność myślenia
  - H3: Jawna konfiguracja
  - H2: Rozwiązywanie problemów
  - H3: Nie wykryto LM Studio
  - H3: Błędy uwierzytelniania (HTTP 401)
  - H3: Ładowanie modelu na żądanie
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
  - H2: Ustawienia domyślne
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
  - H2: Ustawienia domyślne
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
  - H2: Wizja i opis obrazu
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
  - H2: Mapa nazw
  - H2: Pokrycie funkcji OpenClaw
  - H2: Osadzenia pamięci
  - H2: Pierwsze kroki
  - H2: Uwierzytelnianie natywnego serwera aplikacji Codex
  - H2: Generowanie obrazów
  - H2: Generowanie wideo
  - H2: Wkład promptu GPT-5
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
  - H2: Filtrowanie natywnego API
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
  - H2: Ustawienia domyślne
  - H2: Czym to różni się od Qwen
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
  - H2: Wykrywanie modeli (dostawca niejawny)
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
  - H3: Venice (zanonimizowane) a bezpośrednie API
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
  - H2: Wykrywanie modeli (dostawca niejawny)
  - H2: Jawna konfiguracja (modele ręczne)
  - H2: Konfiguracja zaawansowana
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## providers/volcengine.md

- Ścieżka: /providers/volcengine
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Dostawcy i punkty końcowe
  - H2: Wbudowany katalog
  - H2: Zamiana tekstu na mowę
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## providers/vydra.md

- Ścieżka: /providers/vydra
- Nagłówki:
  - H2: Konfiguracja
  - H2: Możliwości
  - H2: Powiązane

## providers/xai.md

- Ścieżka: /providers/xai
- Nagłówki:
  - H2: Wybierz ścieżkę konfiguracji
  - H2: Rozwiązywanie problemów z OAuth
  - H2: Wbudowany katalog
  - H2: Pokrycie funkcji OpenClaw
  - H3: Mapowania trybu szybkiego
  - H3: Aliasy zgodności ze starszymi wersjami
  - H2: Funkcje
  - H2: Testowanie na żywo
  - H2: Powiązane

## providers/xiaomi.md

- Ścieżka: /providers/xiaomi
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Katalog płatności zgodnie z użyciem
  - H2: Katalog planu Token
  - H2: Zamiana tekstu na mowę
  - H2: Przykład konfiguracji
  - H2: Powiązane

## providers/zai.md

- Ścieżka: /providers/zai
- Nagłówki:
  - H2: Modele GLM
  - H2: Pierwsze kroki
  - H2: Przykład konfiguracji
  - H2: Wbudowany katalog
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## refactor/access.md

- Ścieżka: /refactor/access
- Nagłówki: brak

## refactor/acp.md

- Ścieżka: /refactor/acp
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
  - H3: Faza 2: Czyszczenie z pierwszeństwem dzierżaw
  - H3: Faza 3: Zbieranie przy uruchamianiu z pierwszeństwem dzierżaw
  - H3: Faza 4: Wiersze własności sesji
  - H3: Faza 5: Usunięcie starszych heurystyk
  - H2: Testy
  - H2: Uwagi dotyczące zgodności
  - H2: Kryteria sukcesu

## refactor/canvas.md

- Ścieżka: /refactor/canvas
- Nagłówki:
  - H1: Refaktoryzacja Plugin Canvas
  - H2: Cel
  - H2: Poza zakresem
  - H2: Bieżący stan gałęzi
  - H2: Kształt docelowy
  - H2: Kroki migracji
  - H2: Lista kontrolna audytu
  - H2: Polecenia weryfikacyjne

## refactor/database-first.md

- Ścieżka: /refactor/database-first
- Nagłówki:
  - H1: Refaktoryzacja stanu z bazą danych jako pierwszym wyborem
  - H2: Decyzja
  - H2: Twardy kontrakt
  - H2: Stan docelowy i postęp
  - H3: Twardy cel
  - H3: Stany docelowe
  - H3: Stan bieżący
  - H3: Pozostała praca
  - H3: Nie powoduj regresji
  - H2: Założenia z odczytu kodu
  - H2: Ustalenia z odczytu kodu
  - H2: Bieżący kształt kodu
  - H2: Docelowy kształt schematu
  - H2: Kształt migracji Doctor
  - H2: Inwentarz migracji
  - H2: Plan migracji
  - H3: Faza 0: Zamrożenie granicy
  - H3: Faza 1: Ukończenie globalnej płaszczyzny sterowania
  - H3: Faza 2: Wprowadzenie baz danych per agent
  - H3: Faza 3: Zastąpienie API magazynu sesji
  - H3: Faza 4: Przeniesienie transkryptów, strumieni ACP, trajektorii i VFS
  - H3: Faza 5: Kopia zapasowa, przywracanie, vacuum i weryfikacja
  - H3: Faza 6: Środowisko wykonawcze workera
  - H3: Faza 7: Usunięcie starego świata
  - H2: Kopia zapasowa i przywracanie
  - H2: Plan refaktoryzacji środowiska wykonawczego
  - H2: Reguły wydajności
  - H2: Zakazy statyczne
  - H2: Kryteria ukończenia

## refactor/ingress-core.md

- Ścieżka: /refactor/ingress-core
- Nagłówki:
  - H1: Plan usunięcia rdzenia ingress
  - H2: Budżet
  - H2: Diagnoza
  - H2: Punkty krytyczne
  - H2: Bieżący odczyt kodu
  - H2: Granica
  - H2: Reguła akceptacji
  - H2: Pakiety prac
  - H2: Fale usuwania
  - H2: Nie przenosić
  - H2: Weryfikacja
  - H2: Kryteria wyjścia

## reference/AGENTS.default.md

- Ścieżka: /reference/AGENTS.default
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

- Ścieżka: /reference/RELEASING
- Nagłówki:
  - H2: Nazewnictwo wersji
  - H2: Rytm wydań
  - H2: Lista kontrolna operatora wydania
  - H2: Zamknięcie stabilnego main
  - H2: Preflight wydania
  - H2: Boksy testowe wydania
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Pakiet
  - H2: Automatyzacja publikacji wydania
  - H2: Dane wejściowe workflow NPM
  - H2: Sekwencja stabilnego wydania npm
  - H2: Odnośniki publiczne
  - H2: Powiązane

## reference/api-usage-costs.md

- Ścieżka: /reference/api-usage-costs
- Nagłówki:
  - H2: Gdzie pojawiają się koszty (czat + CLI)
  - H2: Jak wykrywane są klucze
  - H2: Funkcje, które mogą wydawać klucze
  - H3: 1) Odpowiedzi głównego modelu (czat + narzędzia)
  - H3: 2) Rozumienie mediów (audio/obraz/wideo)
  - H3: 3) Generowanie obrazów i wideo
  - H3: 4) Embeddingi pamięci + wyszukiwanie semantyczne
  - H3: 5) Narzędzie wyszukiwania w sieci
  - H3: 5) Narzędzie pobierania z sieci (Firecrawl)
  - H3: 6) Migawki użycia dostawcy (status/kondycja)
  - H3: 7) Podsumowywanie zabezpieczające Compaction
  - H3: 8) Skanowanie / próbkowanie modelu
  - H3: 9) Mowa (speech)
  - H3: 10) Skills (API stron trzecich)
  - H2: Powiązane

## reference/application-modernization-plan.md

- Ścieżka: /reference/application-modernization-plan
- Nagłówki:
  - H2: Cel
  - H2: Zasady
  - H2: Faza 1: Audyt bazowy
  - H2: Faza 2: Porządkowanie produktu i UX
  - H2: Faza 3: Uszczelnienie architektury frontendu
  - H2: Faza 4: Wydajność i niezawodność
  - H2: Faza 5: Utwardzenie typów, kontraktów i testów
  - H2: Faza 6: Dokumentacja i gotowość do wydania
  - H2: Zalecany pierwszy wycinek
  - H2: Aktualizacja umiejętności frontendowej

## reference/code-mode.md

- Ścieżka: /reference/code-mode
- Nagłówki:
  - H2: Co to jest?
  - H2: Dlaczego to jest dobre?
  - H2: Jak to włączyć
  - H2: Przegląd techniczny
  - H2: Status środowiska wykonawczego
  - H2: Zakres
  - H2: Terminy
  - H2: Konfiguracja
  - H2: Aktywacja
  - H2: Narzędzia widoczne dla modelu
  - H2: exec
  - H2: wait
  - H2: API środowiska wykonawczego gościa
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
  - H2: Stan środowiska wykonawczego
  - H2: Środowisko wykonawcze QuickJS-WASI
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

- Ścieżka: /reference/credits
- Nagłówki:
  - H2: Nazwa
  - H2: Podziękowania
  - H2: Główni kontrybutorzy
  - H2: Licencja
  - H2: Powiązane

## reference/device-models.md

- Ścieżka: /reference/device-models
- Nagłówki:
  - H2: Źródło danych
  - H2: Aktualizowanie bazy danych
  - H2: Powiązane

## reference/full-release-validation.md

- Ścieżka: /reference/full-release-validation
- Nagłówki:
  - H2: Etapy najwyższego poziomu
  - H2: Etapy kontroli wydania
  - H2: Fragmenty ścieżki wydania Docker
  - H2: Profile wydania
  - H2: Dodatki tylko dla pełnej walidacji
  - H2: Skoncentrowane ponowne uruchomienia
  - H2: Dowody do zachowania
  - H2: Pliki workflow

## reference/memory-config.md

- Ścieżka: /reference/memory-config
- Nagłówki:
  - H2: Wybór dostawcy
  - H3: Niestandardowe identyfikatory dostawców
  - H3: Rozwiązywanie klucza API
  - H2: Konfiguracja zdalnego punktu końcowego
  - H2: Konfiguracja specyficzna dla dostawcy
  - H3: Limit czasu embeddingu inline
  - H2: Konfiguracja wyszukiwania hybrydowego
  - H3: Pełny przykład
  - H2: Dodatkowe ścieżki pamięci
  - H2: Pamięć multimodalna (Gemini)
  - H2: Pamięć podręczna embeddingów
  - H2: Indeksowanie wsadowe
  - H2: Wyszukiwanie w pamięci sesji (eksperymentalne)
  - H2: Przyspieszanie wektorowe SQLite (sqlite-vec)
  - H2: Magazyn indeksu
  - H2: Konfiguracja backendu QMD
  - H3: Pełny przykład QMD
  - H2: Dreaming
  - H3: Ustawienia użytkownika
  - H3: Przykład
  - H2: Powiązane

## reference/prompt-caching.md

- Ścieżka: /reference/prompt-caching
- Nagłówki:
  - H2: Główne pokrętła
  - H3: cacheRetention (globalna wartość domyślna, model i per agent)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat utrzymujące ciepły stan
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
  - H2: Strażniki stabilności pamięci podręcznej OpenClaw
  - H2: Wzorce strojenia
  - H3: Ruch mieszany (zalecane domyślnie)
  - H3: Punkt odniesienia z priorytetem kosztów
  - H2: Diagnostyka pamięci podręcznej
  - H2: Testy regresji na żywo
  - H3: Oczekiwania live Anthropic
  - H3: Oczekiwania live OpenAI
  - H3: Konfiguracja diagnostics.cacheTrace
  - H3: Przełączniki env (jednorazowe debugowanie)
  - H3: Co sprawdzać
  - H2: Szybkie rozwiązywanie problemów
  - H2: Powiązane

## reference/release-performance-sweep.md

- Ścieżka: /reference/release-performance-sweep
- Nagłówki:
  - H2: Migawka
  - H2: Oś czasu rozmiaru instalacji
  - H2: Co zmieniło się w 5.28
  - H2: Najważniejsze liczby
  - H3: Rozmiar instalacji
  - H3: Rozmiar pakietu npm
  - H2: Podsumowanie tury agenta Kova
  - H2: Próbniki źródłowe
  - H2: Audyt rozmiaru instalacji
  - H3: Granica shrinkwrap
  - H2: Interpretacja łańcucha dostaw

## reference/rich-output-protocol.md

- Ścieżka: /reference/rich-output-protocol
- Nagłówki:
  - H2: [embed ...]
  - H2: Przechowywany kształt renderowania
  - H2: Powiązane

## reference/rpc.md

- Ścieżka: /reference/rpc
- Nagłówki:
  - H2: Wzorzec A: daemon HTTP (signal-cli)
  - H2: Wzorzec B: proces potomny stdio (imsg)
  - H2: Wytyczne adaptera
  - H2: Powiązane

## reference/secret-placeholder-conventions.md

- Ścieżka: /reference/secret-placeholder-conventions
- Nagłówki:
  - H1: Konwencje placeholderów sekretów
  - H2: Zalecany styl
  - H2: Unikaj tych wzorców w dokumentacji
  - H2: Przykład

## reference/secretref-credential-surface.md

- Ścieżka: /reference/secretref-credential-surface
- Nagłówki:
  - H2: Obsługiwane poświadczenia
  - H3: Cele openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Cele auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Nieobsługiwane poświadczenia
  - H2: Powiązane

## reference/session-management-compaction.md

- Ścieżka: /reference/session-management-compaction
- Nagłówki:
  - H2: Źródło prawdy: Gateway
  - H2: Dwie warstwy trwałości
  - H2: Lokalizacje na dysku
  - H2: Utrzymanie magazynu i kontrolki dysku
  - H2: Sesje Cron i dzienniki uruchomień
  - H2: Klucze sesji (sessionKey)
  - H2: Identyfikatory sesji (sessionId)
  - H2: Schemat magazynu sesji (sessions.json)
  - H2: Struktura transkryptu (.jsonl)
  - H2: Okna kontekstu a śledzone tokeny
  - H2: Compaction: co to jest
  - H2: Granice fragmentów Compaction i parowanie narzędzi
  - H2: Kiedy następuje automatyczne Compaction (środowisko wykonawcze OpenClaw)
  - H2: Ustawienia Compaction (reserveTokens, keepRecentTokens)
  - H2: Podłączalni dostawcy Compaction
  - H2: Powierzchnie widoczne dla użytkownika
  - H2: Ciche utrzymanie porządku (NOREPLY)
  - H2: „Opróżnienie pamięci” przed Compaction (zaimplementowane)
  - H2: Lista kontrolna rozwiązywania problemów
  - H2: Powiązane

## reference/templates/AGENTS.dev.md

- Ścieżka: /reference/templates/AGENTS.dev
- Nagłówki:
  - H1: AGENTS.md - przestrzeń robocza OpenClaw
  - H2: Pierwsze uruchomienie (jednorazowe)
  - H2: Wskazówka dotycząca kopii zapasowej (zalecane)
  - H2: Domyślne ustawienia bezpieczeństwa
  - H2: Wstępna kontrola istniejących rozwiązań
  - H2: Codzienna pamięć (zalecane)
  - H2: Heartbeats (opcjonalne)
  - H2: Dostosuj
  - H2: Pamięć pochodzenia C-3PO
  - H3: Dzień narodzin: 2026-01-09
  - H3: Rdzenne prawdy (od Clawd)
  - H2: Powiązane

## reference/templates/BOOT.md

- Ścieżka: /reference/templates/BOOT
- Nagłówki:
  - H1: BOOT.md
  - H2: Powiązane

## reference/templates/BOOTSTRAP.md

- Ścieżka: /reference/templates/BOOTSTRAP
- Nagłówki:
  - H1: BOOTSTRAP.md - Witaj, świecie
  - H2: Rozmowa
  - H2: Gdy już wiesz, kim jesteś
  - H2: Połącz (opcjonalne)
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
  - H1: IDENTITY.md - tożsamość agenta
  - H2: Rola
  - H2: Dusza
  - H2: Relacja z Clawd
  - H2: Dziwactwa
  - H2: Powiedzonko
  - H2: Powiązane

## reference/templates/IDENTITY.md

- Ścieżka: /reference/templates/IDENTITY
- Nagłówki:
  - H1: IDENTITY.md - kim jestem?
  - H2: Powiązane

## reference/templates/SOUL.dev.md

- Trasa: /reference/templates/SOUL.dev
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

- Trasa: /reference/templates/SOUL
- Nagłówki:
  - H1: SOUL.md - Kim jesteś
  - H2: Podstawowe prawdy
  - H2: Granice
  - H2: Klimat
  - H2: Ciągłość
  - H2: Powiązane

## reference/templates/TOOLS.dev.md

- Trasa: /reference/templates/TOOLS.dev
- Nagłówki:
  - H1: TOOLS.md - Notatki użytkownika o narzędziach (edytowalne)
  - H2: Przykłady
  - H3: imsg
  - H3: sag
  - H2: Powiązane

## reference/templates/TOOLS.md

- Trasa: /reference/templates/TOOLS
- Nagłówki:
  - H1: TOOLS.md - Lokalne notatki
  - H2: Co tu umieścić
  - H2: Przykłady
  - H2: Dlaczego osobno?
  - H2: Powiązane

## reference/templates/USER.dev.md

- Trasa: /reference/templates/USER.dev
- Nagłówki:
  - H1: USER.md - Profil użytkownika
  - H2: Powiązane

## reference/templates/USER.md

- Trasa: /reference/templates/USER
- Nagłówki:
  - H1: USER.md - O Twoim człowieku
  - H2: Kontekst
  - H2: Powiązane

## reference/test.md

- Trasa: /reference/test
- Nagłówki:
  - H2: Lokalna bramka PR
  - H2: Benchmark opóźnień modelu (lokalne klucze)
  - H2: Benchmark uruchamiania CLI
  - H2: Benchmark uruchamiania Gateway
  - H2: Benchmark restartu Gateway
  - H2: E2E onboardingu (Docker)
  - H2: Test dymny importu QR (Docker)
  - H2: Powiązane

## reference/token-use.md

- Trasa: /reference/token-use
- Nagłówki:
  - H2: Jak budowany jest prompt systemowy
  - H2: Co wlicza się do okna kontekstu
  - H2: Jak sprawdzić bieżące użycie tokenów
  - H2: Szacowanie kosztów (gdy jest wyświetlane)
  - H2: Wpływ TTL pamięci podręcznej i przycinania
  - H3: Przykład: utrzymywanie ciepłej pamięci podręcznej 1h za pomocą Heartbeat
  - H3: Przykład: ruch mieszany ze strategią pamięci podręcznej dla każdego agenta
  - H3: Kontekst Anthropic 1M
  - H2: Wskazówki dotyczące zmniejszania presji tokenów
  - H2: Powiązane

## reference/transcript-hygiene.md

- Trasa: /reference/transcript-hygiene
- Nagłówki:
  - H2: Reguła globalna: kontekst wykonawczy nie jest transkrypcją użytkownika
  - H2: Gdzie to działa
  - H2: Reguła globalna: sanitizacja obrazów
  - H2: Reguła globalna: nieprawidłowo sformatowane wywołania narzędzi
  - H2: Reguła globalna: niekompletne tury zawierające tylko rozumowanie
  - H2: Reguła globalna: pochodzenie danych wejściowych między sesjami
  - H2: Macierz dostawców (bieżące zachowanie)
  - H2: Zachowanie historyczne (sprzed 2026.1.22)
  - H2: Powiązane

## reference/wizard.md

- Trasa: /reference/wizard
- Nagłówki:
  - H2: Szczegóły przepływu (tryb lokalny)
  - H2: Tryb nieinteraktywny
  - H3: Dodaj agenta (nieinteraktywnie)
  - H2: RPC kreatora Gateway
  - H2: Konfiguracja Signal (signal-cli)
  - H2: Co zapisuje kreator
  - H2: Powiązane dokumenty

## releases/index.md

- Trasa: /releases
- Nagłówki:
  - H1: Informacje o wydaniach
  - H2: Wkrótce
  - H2: Surowa historia wydań

## security/CONTRIBUTING-THREAT-MODEL.md

- Trasa: /security/CONTRIBUTING-THREAT-MODEL
- Nagłówki:
  - H2: Sposoby współtworzenia
  - H3: Dodaj zagrożenie
  - H3: Zaproponuj mitigację
  - H3: Zaproponuj łańcuch ataku
  - H3: Popraw lub ulepsz istniejącą treść
  - H2: Czego używamy
  - H3: Struktura MITRE ATLAS
  - H3: Identyfikatory zagrożeń
  - H3: Poziomy ryzyka
  - H2: Proces przeglądu
  - H2: Zasoby
  - H2: Kontakt
  - H2: Uznanie
  - H2: Powiązane

## security/THREAT-MODEL-ATLAS.md

- Trasa: /security/THREAT-MODEL-ATLAS
- Nagłówki:
  - H2: Struktura MITRE ATLAS
  - H3: Atrybucja struktury
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
  - H4: T-RECON-001: Wykrywanie punktu końcowego agenta
  - H4: T-RECON-002: Sondowanie integracji kanału
  - H3: 3.2 Dostęp początkowy (AML.TA0004)
  - H4: T-ACCESS-001: Przechwycenie kodu parowania
  - H4: T-ACCESS-002: Podszywanie się pod AllowFrom
  - H4: T-ACCESS-003: Kradzież tokenu
  - H3: 3.3 Wykonanie (AML.TA0005)
  - H4: T-EXEC-001: Bezpośrednie wstrzyknięcie promptu
  - H4: T-EXEC-002: Pośrednie wstrzyknięcie promptu
  - H4: T-EXEC-003: Wstrzyknięcie argumentu narzędzia
  - H4: T-EXEC-004: Obejście zatwierdzenia Exec
  - H3: 3.4 Utrwalenie dostępu (AML.TA0006)
  - H4: T-PERSIST-001: Instalacja złośliwego Skill
  - H4: T-PERSIST-002: Zatrucie aktualizacji Skill
  - H4: T-PERSIST-003: Manipulacja konfiguracją agenta
  - H3: 3.5 Unikanie obrony (AML.TA0007)
  - H4: T-EVADE-001: Obejście wzorca moderacji
  - H4: T-EVADE-002: Ucieczka z opakowania treści
  - H3: 3.6 Odkrywanie (AML.TA0008)
  - H4: T-DISC-001: Wyliczanie narzędzi
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
  - H2: 7. Załączniki
  - H3: 7.1 Mapowanie technik ATLAS
  - H3: 7.2 Kluczowe pliki bezpieczeństwa
  - H3: 7.3 Glosariusz
  - H2: Powiązane

## security/formal-verification.md

- Trasa: /security/formal-verification
- Nagłówki:
  - H2: Gdzie znajdują się modele
  - H2: Ważne zastrzeżenia
  - H2: Odtwarzanie wyników
  - H3: Ekspozycja Gateway i błędna konfiguracja otwartego Gateway
  - H3: Potok exec Node (zdolność najwyższego ryzyka)
  - H3: Magazyn parowania (bramkowanie DM)
  - H3: Bramkowanie ruchu przychodzącego (wzmianki + obejście poleceń sterujących)
  - H3: Izolacja routingu/klucza sesji
  - H2: v1++: dodatkowe ograniczone modele (współbieżność, ponowienia, poprawność śladu)
  - H3: Współbieżność / idempotencja magazynu parowania
  - H3: Korelacja śladu ruchu przychodzącego / idempotencja
  - H3: Precedencja routing dmScope + identityLinks
  - H2: Powiązane

## security/incident-response.md

- Trasa: /security/incident-response
- Nagłówki:
  - H2: 1. Wykrywanie i triage
  - H2: 2. Ocena
  - H2: 3. Reakcja
  - H2: 4. Komunikacja
  - H2: 5. Odzyskiwanie i działania następcze

## security/network-proxy.md

- Trasa: /security/network-proxy
- Nagłówki:
  - H2: Dlaczego używać proxy
  - H2: Jak OpenClaw kieruje ruch
  - H2: Powiązane terminy proxy
  - H2: Konfiguracja
  - H3: Tryb local loopback Gateway
  - H2: Wymagania proxy
  - H2: Zalecane blokowane miejsca docelowe
  - H2: Walidacja
  - H2: Zaufanie do CA proxy
  - H2: Limity

## specs/claw-supervisor.md

- Trasa: /specs/claw-supervisor
- Nagłówki:
  - H1: Claw Supervisor
  - H2: Cel
  - H2: Model produktu
  - H2: Architektura
  - H2: Kontrakt Codex App-Server
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

- Trasa: /start/bootstrapping
- Nagłówki:
  - H2: Co robi bootstrapping
  - H2: Pomijanie bootstrappingu
  - H2: Gdzie działa
  - H2: Powiązane dokumenty

## start/docs-directory.md

- Trasa: /start/docs-directory
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Dostawcy i UX
  - H2: Aplikacje towarzyszące
  - H2: Operacje i bezpieczeństwo
  - H2: Powiązane

## start/getting-started.md

- Trasa: /start/getting-started
- Nagłówki:
  - H2: Czego potrzebujesz
  - H2: Szybka konfiguracja
  - H2: Co zrobić dalej
  - H2: Powiązane

## start/hubs.md

- Trasa: /start/hubs
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Instalacja + aktualizacje
  - H2: Podstawowe pojęcia
  - H2: Dostawcy + ingress
  - H2: Gateway + operacje
  - H2: Narzędzia + automatyzacja
  - H2: Węzły, media, głos
  - H2: Platformy
  - H2: Aplikacja towarzysząca macOS (zaawansowane)
  - H2: Plugins
  - H2: Przestrzeń robocza + szablony
  - H2: Projekt
  - H2: Testowanie + wydanie
  - H2: Powiązane

## start/lore.md

- Trasa: /start/lore
- Nagłówki:
  - H1: Lore OpenClaw 🦞📖
  - H2: Historia początków
  - H2: Pierwsze linienie (27 stycznia 2026)
  - H2: Nazwa
  - H2: Dalekowie kontra homary
  - H2: Kluczowe postacie
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Wielkie incydenty
  - H3: Zrzut katalogu (3 grudnia 2025)
  - H3: Wielkie linienie (27 stycznia 2026)
  - H3: Ostateczna forma (30 stycznia 2026)
  - H3: Robotyczny szał zakupów (3 grudnia 2025)
  - H2: Święte teksty
  - H2: Kredo homara
  - H3: Saga generowania ikon (27 stycznia 2026)
  - H2: Przyszłość
  - H2: Powiązane

## start/onboarding-overview.md

- Trasa: /start/onboarding-overview
- Nagłówki:
  - H2: Której ścieżki użyć?
  - H2: Co konfiguruje onboarding
  - H2: Onboarding CLI
  - H2: Onboarding aplikacji macOS
  - H2: Niestandardowi lub niewymienieni dostawcy
  - H2: Powiązane

## start/onboarding.md

- Trasa: /start/onboarding
- Nagłówki:
  - H2: Powiązane

## start/openclaw.md

- Trasa: /start/openclaw
- Nagłówki:
  - H2: ⚠️ Najpierw bezpieczeństwo
  - H2: Wymagania wstępne
  - H2: Konfiguracja z dwoma telefonami (zalecana)
  - H2: 5-minutowy szybki start
  - H2: Daj agentowi przestrzeń roboczą (AGENTS)
  - H2: Konfiguracja, która zamienia go w „asystenta”
  - H2: Sesje i pamięć
  - H2: Heartbeats (tryb proaktywny)
  - H2: Media wchodzące i wychodzące
  - H2: Lista kontrolna operacji
  - H2: Następne kroki
  - H2: Powiązane

## start/quickstart.md

- Trasa: /start/quickstart
- Nagłówki:
  - H2: Powiązane

## start/setup.md

- Trasa: /start/setup
- Nagłówki:
  - H2: TL;DR
  - H2: Wymagania wstępne (ze źródeł)
  - H2: Strategia dostosowywania (żeby aktualizacje nie szkodziły)
  - H2: Uruchom Gateway z tego repozytorium
  - H2: Stabilny przepływ pracy (najpierw aplikacja macOS)
  - H2: Przepływ pracy z najnowszymi zmianami (Gateway w terminalu)
  - H3: 0) (Opcjonalnie) Uruchom też aplikację macOS ze źródeł
  - H3: 1) Uruchom deweloperski Gateway
  - H3: 2) Skieruj aplikację macOS na działający Gateway
  - H3: 3) Zweryfikuj
  - H3: Typowe pułapki
  - H2: Mapa przechowywania danych uwierzytelniających
  - H2: Aktualizowanie (bez niszczenia konfiguracji)
  - H2: Linux (usługa użytkownika systemd)
  - H2: Powiązane dokumenty

## start/showcase.md

- Trasa: /start/showcase
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

- Trasa: /start/wizard-cli-automation
- Nagłówki:
  - H2: Bazowy przykład nieinteraktywny
  - H2: Przykłady specyficzne dla dostawcy
  - H2: Dodaj kolejnego agenta
  - H2: Powiązane dokumenty

## start/wizard-cli-reference.md

- Trasa: /start/wizard-cli-reference
- Nagłówki:
  - H2: Co robi kreator
  - H2: Szczegóły przepływu lokalnego
  - H2: Szczegóły trybu zdalnego
  - H2: Opcje uwierzytelniania i modelu
  - H2: Wyniki i elementy wewnętrzne
  - H2: Powiązane dokumenty

## start/wizard.md

- Trasa: /start/wizard
- Nagłówki:
  - H2: Lokalizacja
  - H2: QuickStart kontra zaawansowane
  - H2: Co konfiguruje onboarding
  - H2: Dodaj kolejnego agenta
  - H2: Pełna referencja
  - H2: Powiązane dokumenty

## tools/acp-agents-setup.md

- Trasa: /tools/acp-agents-setup
- Nagłówki:
  - H2: Obsługa uprzęży acpx (bieżąca)
  - H2: Wymagana konfiguracja
  - H2: Konfiguracja Plugin dla backendu acpx
  - H3: Konfiguracja polecenia i wersji acpx
  - H3: Automatyczna instalacja zależności
  - H3: Most MCP narzędzi Plugin
  - H3: Most MCP narzędzi OpenClaw
  - H3: Konfiguracja limitu czasu operacji środowiska wykonawczego
  - H3: Konfiguracja agenta sondy zdrowia
  - H2: Konfiguracja uprawnień
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguracja
  - H2: Powiązane

## tools/acp-agents.md

- Trasa: /tools/acp-agents
- Nagłówki:
  - H2: Którą stronę wybrać?
  - H2: Czy to działa od razu?
  - H2: Obsługiwane cele harness
  - H2: Runbook operatora
  - H2: ACP kontra podagenci
  - H2: Jak ACP uruchamia Claude Code
  - H2: Powiązane sesje
  - H3: Model mentalny
  - H3: Powiązania bieżącej konwersacji
  - H2: Trwałe powiązania kanałów
  - H3: Model powiązań
  - H3: Domyślne ustawienia runtime dla agenta
  - H3: Przykład
  - H3: Zachowanie
  - H2: Uruchamianie sesji ACP
  - H3: Parametry sessionsspawn
  - H2: Tryby spawn bind i wątków
  - H2: Model dostarczania
  - H2: Zgodność z sandboxem
  - H2: Rozwiązywanie celu sesji
  - H2: Kontrolki ACP
  - H3: Mapowanie opcji runtime
  - H2: Harness acpx, konfiguracja pluginu i uprawnienia
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
  - H2: API sterowania (opcjonalne)
  - H3: Kontrakt błędów /act
  - H3: Wymaganie Playwright
  - H4: Instalacja Docker Playwright
  - H2: Jak to działa (wewnętrznie)
  - H2: Skrócony opis CLI
  - H2: Migawki i odwołania
  - H2: Ulepszenia oczekiwania
  - H2: Przepływy debugowania
  - H2: Dane wyjściowe JSON
  - H2: Ustawienia stanu i środowiska
  - H2: Bezpieczeństwo i prywatność
  - H2: Powiązane

## tools/browser-linux-troubleshooting.md

- Trasa: /tools/browser-linux-troubleshooting
- Nagłówki:
  - H2: Problem: „Failed to start Chrome CDP on port 18800”
  - H3: Przyczyna źródłowa
  - H3: Rozwiązanie 1: Zainstaluj Google Chrome (zalecane)
  - H3: Rozwiązanie 2: Użyj Snap Chromium w trybie Attach-Only
  - H3: Weryfikacja działania przeglądarki
  - H3: Odwołanie do konfiguracji
  - H3: Problem: „No Chrome tabs found for profile=\"user\"”
  - H2: Powiązane

## tools/browser-login.md

- Trasa: /tools/browser-login
- Nagłówki:
  - H2: Logowanie ręczne (zalecane)
  - H2: Który profil Chrome jest używany?
  - H2: X/Twitter: zalecany przepływ
  - H2: Sandboxing + dostęp do przeglądarki hosta
  - H2: Powiązane

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Trasa: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Nagłówki:
  - H2: Najpierw wybierz właściwy tryb przeglądarki
  - H3: Opcja 1: Surowy zdalny CDP z WSL2 do Windows
  - H3: Opcja 2: Host-local Chrome MCP
  - H2: Działająca architektura
  - H2: Dlaczego ta konfiguracja jest myląca
  - H2: Krytyczna reguła dla Control UI
  - H2: Waliduj warstwami
  - H3: Warstwa 1: Sprawdź, czy Chrome udostępnia CDP w Windows
  - H3: Warstwa 2: Sprawdź, czy WSL2 może połączyć się z tym punktem końcowym Windows
  - H3: Warstwa 3: Skonfiguruj właściwy profil przeglądarki
  - H3: Warstwa 4: Oddzielnie sprawdź warstwę Control UI
  - H3: Warstwa 5: Sprawdź kompleksowe sterowanie przeglądarką
  - H2: Częste mylące błędy
  - H2: Szybka lista kontrolna triage
  - H2: Praktyczny wniosek
  - H2: Powiązane

## tools/browser.md

- Trasa: /tools/browser
- Nagłówki:
  - H2: Co otrzymujesz
  - H2: Szybki start
  - H2: Sterowanie Pluginem
  - H2: Wskazówki dla agenta
  - H2: Brakujące polecenie lub narzędzie przeglądarki
  - H2: Profile: openclaw vs user
  - H2: Konfiguracja
  - H3: Wizja ze zrzutów ekranu (obsługa modeli tekstowych)
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
  - H3: Niestandardowe uruchomienie Chrome MCP
  - H2: Gwarancje izolacji
  - H2: Wybór przeglądarki
  - H2: API sterowania (opcjonalne)
  - H2: Rozwiązywanie problemów
  - H3: Błąd uruchamiania CDP kontra blokada SSRF nawigacji
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
  - H2: Odwołanie do SKILL.md
  - H3: Pola wymagane
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
  - H2: Typowy przepływ pracy agenta
  - H2: Przykłady wejścia
  - H2: Odwołanie do wejścia narzędzia
  - H2: Podświetlanie składni
  - H2: Kontrakt szczegółów wyjścia
  - H2: Zwinięte niezmienione sekcje
  - H2: Domyślne ustawienia Pluginu
  - H3: Konfiguracja trwałego URL-a przeglądarki
  - H2: Konfiguracja zabezpieczeń
  - H2: Cykl życia i przechowywanie artefaktów
  - H2: URL przeglądarki i zachowanie sieci
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
  - H2: Kolejność rozstrzygania
  - H2: Dostępność i listy dozwolone
  - H2: Czego elevated nie kontroluje
  - H2: Powiązane

## tools/exa-search.md

- Trasa: /tools/exa-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Uzyskaj klucz API
  - H2: Konfiguracja
  - H2: Nadpisanie bazowego URL-a
  - H2: Parametry narzędzia
  - H3: Ekstrakcja treści
  - H3: Tryby wyszukiwania
  - H2: Uwagi
  - H2: Powiązane

## tools/exec-approvals-advanced.md

- Trasa: /tools/exec-approvals-advanced
- Nagłówki:
  - H2: Bezpieczne programy (tylko stdin)
  - H3: Walidacja argv i zabronione flagi
  - H3: Zaufane katalogi binarne
  - H3: Łączenie poleceń shell, wrappery i multipleksery
  - H3: Bezpieczne programy kontra lista dozwolonych
  - H2: Polecenia interpretera/runtime
  - H3: Zachowanie dostarczania follow-up
  - H2: Przekazywanie zatwierdzeń do kanałów czatu
  - H3: Przekazywanie zatwierdzeń Pluginu
  - H3: Zatwierdzenia w tym samym czacie na dowolnym kanale
  - H3: Natywne dostarczanie zatwierdzeń
  - H3: Przepływ IPC macOS
  - H2: FAQ
  - H3: Kiedy accountId i threadId byłyby używane w celu zatwierdzenia?
  - H3: Gdy zatwierdzenia są wysyłane do sesji, czy ktokolwiek w tej sesji może je zatwierdzić?
  - H2: Powiązane

## tools/exec-approvals.md

- Trasa: /tools/exec-approvals
- Nagłówki:
  - H2: Sprawdzanie efektywnej polityki
  - H2: Gdzie ma zastosowanie
  - H3: Model zaufania
  - H3: Podział macOS
  - H2: Ustawienia i przechowywanie
  - H2: Ustawienia polityki
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Tryb YOLO (bez zatwierdzeń)
  - H3: Trwała konfiguracja „nigdy nie pytaj” na hoście gateway
  - H3: Lokalny skrót
  - H3: Host Node
  - H3: Skrót tylko dla sesji
  - H2: Lista dozwolonych (na agenta)
  - H3: Ograniczanie argumentów za pomocą argPattern
  - H2: Automatyczne zezwalanie CLI Skills
  - H2: Bezpieczne programy i przekazywanie zatwierdzeń
  - H2: Edycja Control UI
  - H2: Przepływ zatwierdzania
  - H2: Zdarzenia systemowe
  - H2: Zachowanie po odmowie zatwierdzenia
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
  - H2: Lista dozwolonych + bezpieczne programy
  - H2: Przykłady
  - H2: applypatch
  - H2: Powiązane

## tools/firecrawl.md

- Trasa: /tools/firecrawl
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: webfetch bez klucza i klucze API
  - H2: Skonfiguruj wyszukiwanie Firecrawl
  - H2: Skonfiguruj fallback webfetch Firecrawl
  - H3: Self-hosted Firecrawl
  - H2: Narzędzia Pluginu Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / obchodzenie botów
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
  - H2: Nadpisania bazowego URL-a
  - H2: Powiązane

## tools/goal.md

- Trasa: /tools/goal
- Nagłówki:
  - H1: Cel
  - H2: Szybki start
  - H2: Do czego służą cele
  - H2: Odwołanie do poleceń
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
  - H2: Nadpisania bazowego URL-a
  - H2: Powiązane

## tools/image-generation.md

- Trasa: /tools/image-generation
- Nagłówki:
  - H2: Szybki start
  - H2: Częste ścieżki
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

- Trasa: /tools
- Nagłówki:
  - H2: Zacznij tutaj
  - H2: Wybierz narzędzia, Skills lub pluginy
  - H2: Wbudowane kategorie narzędzi
  - H2: Narzędzia dostarczane przez pluginy
  - H2: Skonfiguruj dostęp i zatwierdzenia
  - H2: Rozszerz możliwości
  - H2: Rozwiąż problemy z brakującymi narzędziami
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
  - H2: Konfiguracja (opcjonalna)
  - H2: Parametry narzędzia
  - H2: Dane wyjściowe
  - H2: Przykład: krok przepływu pracy Lobster
  - H3: Ważne ograniczenie
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Powiązane

## tools/lobster.md

- Trasa: /tools/lobster
- Nagłówki:
  - H2: Hook
  - H2: Dlaczego
  - H2: Dlaczego DSL zamiast zwykłych programów?
  - H2: Jak to działa
  - H2: Wzorzec: małe CLI + potoki JSON + zatwierdzenia
  - H2: Kroki LLM tylko JSON (llm-task)
  - H3: Ważne ograniczenie: osadzony Lobster kontra openclaw.invoke
  - H2: Pliki przepływów pracy (.lobster)
  - H2: Zainstaluj Lobster
  - H2: Włącz narzędzie
  - H2: Przykład: triage e-maili
  - H2: Parametry narzędzia
  - H3: run
  - H3: resume
  - H3: Opcjonalne wejścia
  - H2: Koperta wyjścia
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
  - H3: Zachowanie pola
  - H2: Zalecana konfiguracja
  - H2: Strażnik po Compaction
  - H2: Logi i oczekiwane zachowanie
  - H2: Powiązane

## tools/media-overview.md

- Trasa: /tools/media-overview
- Nagłówki:
  - H2: Możliwości
  - H2: Macierz możliwości dostawców
  - H2: Asynchroniczne kontra synchroniczne
  - H2: Speech-to-text i Voice Call
  - H2: Mapowania dostawców (jak dostawcy dzielą powierzchnie)
  - H2: Powiązane

## tools/minimax-search.md

- Trasa: /tools/minimax-search
- Nagłówki:
  - H2: Uzyskaj poświadczenie Token Plan
  - H2: Konfiguracja
  - H2: Wybór regionu
  - H2: Obsługiwane parametry
  - H2: Powiązane

## tools/multi-agent-sandbox-tools.md

- Trasa: /tools/multi-agent-sandbox-tools
- Nagłówki:
  - H2: Przykłady konfiguracji
  - H2: Pierwszeństwo konfiguracji
  - H3: Konfiguracja piaskownicy
  - H3: Ograniczenia narzędzi
  - H2: Migracja z pojedynczego agenta
  - H2: Przykłady ograniczeń narzędzi
  - H2: Częsta pułapka: „non-main”
  - H2: Testowanie
  - H2: Rozwiązywanie problemów
  - H2: Powiązane

## tools/music-generation.md

- Trasa: /tools/music-generation
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

- Trasa: /tools/ollama-search
- Nagłówki:
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Uwagi
  - H2: Powiązane

## tools/parallel-search.md

- Trasa: /tools/parallel-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Klucz API (płatny dostawca)
  - H2: Konfiguracja
  - H2: Nadpisanie bazowego URL
  - H2: Parametry narzędzia
  - H2: Uwagi
  - H2: Powiązane

## tools/pdf.md

- Trasa: /tools/pdf
- Nagłówki:
  - H2: Dostępność
  - H2: Odwołanie do danych wejściowych
  - H2: Obsługiwane odwołania PDF
  - H2: Tryby wykonywania
  - H3: Tryb natywnego dostawcy
  - H3: Tryb awaryjny wyodrębniania
  - H2: Konfiguracja
  - H2: Szczegóły danych wyjściowych
  - H2: Zachowanie przy błędach
  - H2: Przykłady
  - H2: Powiązane

## tools/permission-modes.md

- Trasa: /tools/permission-modes
- Nagłówki:
  - H2: Zalecana wartość domyślna
  - H2: Tryby wykonywania hosta OpenClaw
  - H2: Mapowanie Codex Guardian
  - H2: Uprawnienia uprzęży ACPX
  - H2: Wybór trybu
  - H2: Powiązane

## tools/perplexity-search.md

- Trasa: /tools/perplexity-search
- Nagłówki:
  - H2: Zainstaluj Plugin
  - H2: Uzyskiwanie klucza API Perplexity
  - H2: Zgodność z OpenRouter
  - H2: Przykłady konfiguracji
  - H3: Natywne API Perplexity Search
  - H3: Zgodność OpenRouter / Sonar
  - H2: Gdzie ustawić klucz
  - H2: Parametry narzędzia
  - H3: Reguły filtra domen
  - H2: Uwagi
  - H2: Powiązane

## tools/plugin.md

- Trasa: /tools/plugin
- Nagłówki:
  - H2: Wymagania
  - H2: Szybki start
  - H2: Konfiguracja
  - H3: Wybierz źródło instalacji
  - H3: Zasady instalacji operatora
  - H3: Skonfiguruj zasady Pluginu
  - H2: Zrozum formaty Pluginów
  - H2: Haki Pluginu
  - H2: Zweryfikuj aktywny Gateway
  - H2: Rozwiązywanie problemów
  - H3: Zablokowana własność ścieżki Pluginu
  - H3: Wolna konfiguracja narzędzi Pluginu
  - H2: Powiązane

## tools/reactions.md

- Trasa: /tools/reactions
- Nagłówki:
  - H2: Jak to działa
  - H2: Zachowanie kanału
  - H2: Poziom reakcji
  - H2: Powiązane

## tools/searxng-search.md

- Trasa: /tools/searxng-search
- Nagłówki:
  - H2: Konfiguracja
  - H2: Konfiguracja
  - H2: Zmienna środowiskowa
  - H2: Odwołanie do konfiguracji Pluginu
  - H2: Uwagi
  - H2: Powiązane

## tools/skill-workshop.md

- Trasa: /tools/skill-workshop
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

- Trasa: /tools/skills-config
- Nagłówki:
  - H2: Ładowanie (skills.load)
  - H2: Instalacja (skills.install)
  - H2: Zasady instalacji operatora (security.installPolicy)
  - H2: Lista dozwolonych dołączonych Skills
  - H2: Wpisy dla poszczególnych Skills (skills.entries)
  - H2: Listy dozwolonych agentów (agents)
  - H2: Warsztat (skills.workshop)
  - H2: Katalogi główne Skills dowiązane symbolicznie
  - H2: Skills w piaskownicy i zmienne środowiskowe
  - H2: Przypomnienie o kolejności ładowania
  - H2: Powiązane

## tools/skills.md

- Trasa: /tools/skills
- Nagłówki:
  - H2: Kolejność ładowania
  - H2: Skills per agent vs współdzielone
  - H2: Listy dozwolonych agentów
  - H2: Pluginy i Skills
  - H2: Skill Workshop
  - H2: Instalowanie z ClawHub
  - H2: Bezpieczeństwo
  - H2: Format SKILL.md
  - H3: Opcjonalne klucze frontmatter
  - H2: Bramkowanie
  - H3: Specyfikacje instalatorów
  - H2: Nadpisania konfiguracji
  - H2: Wstrzykiwanie środowiska
  - H2: Migawki i odświeżanie
  - H2: Wpływ na tokeny
  - H2: Powiązane

## tools/slash-commands.md

- Trasa: /tools/slash-commands
- Nagłówki:
  - H2: Trzy typy poleceń
  - H2: Konfiguracja
  - H2: Lista poleceń
  - H3: Polecenia rdzenia
  - H3: Polecenia Dock
  - H3: Polecenia dołączonych Pluginów
  - H3: Polecenia Skills
  - H2: /tools — czego agent może teraz użyć
  - H2: /model — wybór modelu
  - H2: /config — zapisy konfiguracji na dysku
  - H2: /mcp — konfiguracja serwera MCP
  - H2: /debug — nadpisania tylko w czasie działania
  - H2: /plugins — zarządzanie Pluginami
  - H2: /trace — dane wyjściowe śledzenia Pluginu
  - H2: /btw — pytania poboczne
  - H2: Uwagi dotyczące powierzchni
  - H2: Użycie i status dostawcy
  - H2: Powiązane

## tools/steer.md

- Trasa: /tools/steer
- Nagłówki:
  - H2: Bieżąca sesja
  - H2: Sterowanie vs kolejka
  - H2: Podagenci
  - H2: Sesje ACP
  - H2: Powiązane

## tools/subagents.md

- Trasa: /tools/subagents
- Nagłówki:
  - H2: Polecenie ukośnika
  - H3: Kontrole powiązania wątku
  - H3: Zachowanie uruchamiania
  - H2: Tryby kontekstu
  - H2: Narzędzie: sessionsspawn
  - H3: Tryb monitu delegowania
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
  - H3: Limit uruchamiania na agenta
  - H3: Kaskadowe zatrzymanie
  - H2: Uwierzytelnianie
  - H2: Ogłaszanie
  - H3: Kontekst ogłaszania
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

- Trasa: /tools/tavily
- Nagłówki:
  - H2: Pierwsze kroki
  - H2: Odwołanie do narzędzi
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Wybór właściwego narzędzia
  - H2: Konfiguracja zaawansowana
  - H2: Powiązane

## tools/thinking.md

- Trasa: /tools/thinking
- Nagłówki:
  - H2: Co to robi
  - H2: Kolejność rozstrzygania
  - H2: Ustawianie wartości domyślnej sesji
  - H2: Zastosowanie według agenta
  - H2: Tryb szybki (/fast)
  - H2: Dyrektywy szczegółowe (/verbose lub /v)
  - H2: Dyrektywy śledzenia Pluginu (/trace)
  - H2: Widoczność rozumowania (/reasoning)
  - H2: Powiązane
  - H2: Heartbeats
  - H2: Interfejs czatu WWW
  - H2: Profile dostawców

## tools/tokenjuice.md

- Trasa: /tools/tokenjuice
- Nagłówki:
  - H2: Włącz Plugin
  - H2: Co zmienia tokenjuice
  - H2: Zweryfikuj, że działa
  - H2: Wyłącz Plugin
  - H2: Powiązane

## tools/tool-search.md

- Trasa: /tools/tool-search
- Nagłówki:
  - H2: Jak przebiega tura
  - H2: Tryby
  - H2: Dlaczego to istnieje
  - H2: API
  - H2: Granica czasu działania
  - H2: Konfiguracja
  - H2: Monit i telemetria
  - H2: Walidacja E2E
  - H2: Zachowanie przy awarii
  - H2: Powiązane

## tools/trajectory.md

- Trasa: /tools/trajectory
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

- Trasa: /tools/tts
- Nagłówki:
  - H2: Szybki start
  - H2: Obsługiwani dostawcy
  - H2: Konfiguracja
  - H3: Nadpisania głosu per agent
  - H2: Persony
  - H3: Minimalna persona
  - H3: Pełna persona (monit neutralny względem dostawcy)
  - H3: Rozstrzyganie persony
  - H3: Jak dostawcy używają monitów persony
  - H3: Zasady awaryjne
  - H2: Dyrektywy sterowane modelem
  - H2: Polecenia ukośnika
  - H2: Preferencje per użytkownik
  - H2: Formaty wyjściowe (stałe)
  - H2: Zachowanie Auto-TTS
  - H2: Formaty wyjściowe według kanału
  - H2: Odwołanie do pól
  - H2: Narzędzie agenta
  - H2: RPC Gateway
  - H2: Linki usług
  - H2: Powiązane

## tools/video-generation.md

- Trasa: /tools/video-generation
- Nagłówki:
  - H2: Szybki start
  - H2: Jak działa generowanie asynchroniczne
  - H3: Cykl życia zadania
  - H2: Obsługiwani dostawcy
  - H3: Macierz możliwości
  - H2: Parametry narzędzia
  - H3: Wymagane
  - H3: Dane wejściowe treści
  - H3: Kontrole stylu
  - H3: Zaawansowane
  - H4: Opcje awaryjne i typowane
  - H2: Akcje
  - H2: Wybór modelu
  - H2: Uwagi dotyczące dostawców
  - H2: Tryby możliwości dostawców
  - H2: Testy na żywo
  - H2: Konfiguracja
  - H2: Powiązane

## tools/web-fetch.md

- Trasa: /tools/web-fetch
- Nagłówki:
  - H2: Szybki start
  - H2: Parametry narzędzia
  - H2: Jak to działa
  - H2: Aktualizacje postępu
  - H2: Konfiguracja
  - H2: Tryb awaryjny Firecrawl
  - H2: Zaufany serwer proxy środowiska
  - H2: Limity i bezpieczeństwo
  - H2: Profile narzędzi
  - H2: Powiązane

## tools/web.md

- Trasa: /tools/web
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

- Trasa: /tts
- Nagłówki:
  - H2: Powiązane

## vps.md

- Trasa: /vps
- Nagłówki:
  - H2: Wybierz dostawcę
  - H2: Jak działają konfiguracje w chmurze
  - H2: Najpierw utwardź dostęp administratora
  - H2: Wspólny agent firmowy na VPS
  - H2: Używanie węzłów z VPS
  - H2: Dostrajanie uruchamiania dla małych maszyn wirtualnych i hostów ARM
  - H3: Lista kontrolna dostrajania systemd (opcjonalna)
  - H2: Powiązane

## web/control-ui.md

- Trasa: /web/control-ui
- Nagłówki:
  - H2: Szybkie otwarcie (lokalnie)
  - H2: Parowanie urządzenia (pierwsze połączenie)
  - H2: Tożsamość osobista (lokalna dla przeglądarki)
  - H2: Punkt końcowy konfiguracji czasu działania
  - H2: Obsługa języków
  - H2: Motywy wyglądu
  - H2: Co potrafi zrobić (dzisiaj)
  - H2: Strona MCP
  - H2: Karta aktywności
  - H2: Zachowanie czatu
  - H2: Instalacja PWA i web push
  - H2: Osadzenia hostowane
  - H2: Szerokość wiadomości czatu
  - H2: Dostęp Tailnet (zalecany)
  - H2: Niezabezpieczony HTTP
  - H2: Zasady bezpieczeństwa treści
  - H2: Uwierzytelnianie trasy awatara
  - H2: Uwierzytelnianie trasy mediów asystenta
  - H2: Budowanie interfejsu użytkownika
  - H2: Pusta strona Control UI
  - H2: Debugowanie/testowanie: serwer deweloperski + zdalny Gateway
  - H2: Powiązane

## web/dashboard.md

- Trasa: /web/dashboard
- Nagłówki:
  - H2: Szybka ścieżka (zalecana)
  - H2: Podstawy uwierzytelniania (lokalne vs zdalne)
  - H2: Jeśli widzisz „unauthorized” / 1008
  - H2: Powiązane

## web/index.md

- Trasa: /web
- Nagłówki:
  - H2: Webhooks
  - H2: Administracyjne HTTP RPC
  - H2: Konfiguracja (domyślnie włączona)
  - H2: Dostęp Tailscale
  - H3: Zintegrowane udostępnianie (zalecane)
  - H3: Powiązanie Tailnet + token
  - H3: Internet publiczny (Funnel)
  - H2: Uwagi dotyczące bezpieczeństwa
  - H2: Budowanie interfejsu użytkownika

## web/tui.md

- Trasa: /web/tui
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
  - H2: Naprawa konfiguracji z lokalnego TUI
  - H2: Dane wyjściowe narzędzi
  - H2: Kolory terminala
  - H2: Historia + strumieniowanie
  - H2: Szczegóły połączenia
  - H2: Opcje
  - H2: Rozwiązywanie problemów
  - H2: Rozwiązywanie problemów z połączeniem
  - H2: Powiązane

## web/webchat.md

- Trasa: /web/webchat
- Nagłówki:
  - H2: Co to jest
  - H2: Szybki start
  - H2: Jak to działa (zachowanie)
  - H3: Transkrypt i model dostarczania
  - H2: Panel narzędzi agentów Control UI
  - H2: Użycie zdalne
  - H2: Odwołanie do konfiguracji (WebChat)
  - H2: Powiązane
