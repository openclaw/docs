---
read_when:
    - Projektowanie asystenta wprowadzającego dla macOS
    - Implementowanie konfiguracji uwierzytelniania lub tożsamości
sidebarTitle: 'Onboarding: macOS App'
summary: Przepływ konfiguracji przy pierwszym uruchomieniu OpenClaw (aplikacja macOS)
title: Wprowadzenie (aplikacja macOS)
x-i18n:
    generated_at: "2026-05-06T09:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Ten dokument opisuje **bieżący** przepływ konfiguracji przy pierwszym uruchomieniu. Celem jest
płynne doświadczenie „dnia 0”: wybierz, gdzie działa Gateway, podłącz uwierzytelnianie, uruchom
kreator i pozwól agentowi samodzielnie się zainicjować.
Ogólny przegląd ścieżek wdrożenia znajdziesz w [Przeglądzie wdrożenia](/pl/start/onboarding-overview).

<Steps>
<Step title="Zatwierdź ostrzeżenie macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Zatwierdź wyszukiwanie sieci lokalnych">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Powitanie i informacja o bezpieczeństwie">
<Frame caption="Przeczytaj wyświetloną informację o bezpieczeństwie i podejmij odpowiednią decyzję">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model zaufania bezpieczeństwa:

- Domyślnie OpenClaw jest agentem osobistym: jedna zaufana granica operatora.
- Konfiguracje współdzielone/wieloużytkownikowe wymagają ograniczeń (oddziel granice zaufania, utrzymuj dostęp narzędzi na minimalnym poziomie i postępuj zgodnie z sekcją [Bezpieczeństwo](/pl/gateway/security)).
- Lokalne wdrożenie ustawia teraz domyślnie dla nowych konfiguracji `tools.profile: "coding"`, dzięki czemu świeże lokalne konfiguracje zachowują narzędzia systemu plików/środowiska uruchomieniowego bez wymuszania nieograniczonego profilu `full`.
- Jeśli włączone są hooki/webhooki lub inne kanały niezaufanych treści, użyj mocnego, nowoczesnego poziomu modelu i utrzymuj rygorystyczne zasady narzędzi/sandboxingu.

</Step>
<Step title="Lokalnie a zdalnie">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gdzie działa **Gateway**?

- **Ten Mac (tylko lokalnie):** wdrożenie może skonfigurować uwierzytelnianie i zapisać poświadczenia
  lokalnie.
- **Zdalnie (przez SSH/Tailnet):** wdrożenie **nie** konfiguruje lokalnego uwierzytelniania;
  poświadczenia muszą istnieć na hoście gateway.
- **Skonfiguruj później:** pomiń konfigurację i pozostaw aplikację nieskonfigurowaną.

<Tip>
**Wskazówka dotycząca uwierzytelniania Gateway:**

- Kreator generuje teraz **token** nawet dla loopback, więc lokalni klienci WS muszą się uwierzytelniać.
- Jeśli wyłączysz uwierzytelnianie, może połączyć się dowolny lokalny proces; używaj tego tylko na w pełni zaufanych maszynach.
- Użyj **tokenu** dla dostępu z wielu maszyn lub powiązań innych niż loopback.

</Tip>
</Step>
<Step title="Uprawnienia">
<Frame caption="Wybierz, jakie uprawnienia chcesz nadać OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Wdrożenie prosi o uprawnienia TCC potrzebne do:

- Automatyzacji (AppleScript)
- Powiadomień
- Dostępności
- Nagrywania ekranu
- Mikrofonu
- Rozpoznawania mowy
- Kamery
- Lokalizacji

</Step>
<Step title="CLI">
  <Info>Ten krok jest opcjonalny</Info>
  Aplikacja może zainstalować globalny `openclaw` CLI przez npm, pnpm lub bun.
  Preferuje najpierw npm, potem pnpm, a następnie bun, jeśli jest to jedyny wykryty
  menedżer pakietów. Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.
</Step>
<Step title="Czat wdrożeniowy (dedykowana sesja)">
  Po konfiguracji aplikacja otwiera dedykowaną sesję czatu wdrożeniowego, aby agent mógł
  się przedstawić i poprowadzić przez kolejne kroki. Oddziela to wskazówki pierwszego uruchomienia
  od normalnej rozmowy. Zobacz [Bootstrapping](/pl/start/bootstrapping), aby dowiedzieć się,
  co dzieje się na hoście gateway podczas pierwszego uruchomienia agenta.
</Step>
</Steps>

## Powiązane

- [Przegląd wdrożenia](/pl/start/onboarding-overview)
- [Pierwsze kroki](/pl/start/getting-started)
