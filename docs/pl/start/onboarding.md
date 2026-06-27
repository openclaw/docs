---
read_when:
    - Projektowanie asystenta wdrażania w systemie macOS
    - Implementowanie konfiguracji uwierzytelniania lub tożsamości
sidebarTitle: 'Onboarding: macOS App'
summary: Proces konfiguracji przy pierwszym uruchomieniu OpenClaw (aplikacja macOS)
title: Wdrażanie (aplikacja macOS)
x-i18n:
    generated_at: "2026-06-27T18:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Ten dokument opisuje **bieżący** przepływ konfiguracji przy pierwszym uruchomieniu. Celem jest
płynne doświadczenie „dnia 0”: wybrać, gdzie działa Gateway, podłączyć uwierzytelnianie, uruchomić
kreator i pozwolić agentowi samodzielnie się zainicjować.
Ogólny przegląd ścieżek wdrożenia znajdziesz w [Przeglądzie wdrożenia](/pl/start/onboarding-overview).

<Steps>
<Step title="Zatwierdź ostrzeżenie macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Zezwól na wyszukiwanie sieci lokalnych">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Powitanie i informacja o bezpieczeństwie">
<Frame caption="Przeczytaj wyświetloną informację o bezpieczeństwie i podejmij odpowiednią decyzję">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model zaufania bezpieczeństwa:

- Domyślnie OpenClaw jest osobistym agentem: jedna zaufana granica operatora.
- Konfiguracje współdzielone/wielu użytkowników wymagają zabezpieczenia (oddziel granice zaufania, ogranicz dostęp narzędzi do minimum i postępuj zgodnie z [Bezpieczeństwem](/pl/gateway/security)).
- Lokalne wdrożenie ustawia teraz w nowych konfiguracjach domyślnie `tools.profile: "coding"`, dzięki czemu świeże konfiguracje lokalne zachowują narzędzia systemu plików/środowiska uruchomieniowego bez wymuszania nieograniczonego profilu `full`.
- Jeśli włączone są hooks/webhooks lub inne niezaufane źródła treści, użyj mocnego, nowoczesnego poziomu modelu i utrzymuj ścisłą politykę narzędzi/sandboxing.

</Step>
<Step title="Lokalnie czy zdalnie">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gdzie działa **Gateway**?

- **Ten Mac (tylko lokalnie):** wdrożenie może skonfigurować uwierzytelnianie i zapisać poświadczenia
  lokalnie.
- **Zdalnie (przez SSH/Tailnet):** wdrożenie **nie** konfiguruje lokalnego uwierzytelniania;
  poświadczenia muszą istnieć na hoście gateway. Pole tokenu zdalnego gateway
  przechowuje token używany przez aplikację macOS do łączenia się z tym Gateway; istniejące
  wartości `gateway.remote.token`, które nie są zwykłym tekstem, są zachowywane, dopóki ich nie zastąpisz.
- **Skonfiguruj później:** pomiń konfigurację i pozostaw aplikację nieskonfigurowaną.

<Tip>
**Wskazówka dotycząca uwierzytelniania Gateway:**

- Kreator generuje teraz **token** nawet dla loopback, więc lokalni klienci WS muszą się uwierzytelniać.
- Jeśli wyłączysz uwierzytelnianie, dowolny proces lokalny może się połączyć; używaj tego tylko na w pełni zaufanych maszynach.
- Użyj **tokenu** do dostępu z wielu maszyn lub wiązań innych niż loopback.

</Tip>
</Step>
<Step title="Uprawnienia">
<Frame caption="Wybierz, jakie uprawnienia chcesz przyznać OpenClaw">
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
  Aplikacja może zainstalować globalny CLI `openclaw` przez npm, pnpm lub bun.
  Najpierw preferuje npm, następnie pnpm, a potem bun, jeśli jest to jedyny wykryty
  menedżer pakietów. Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.
</Step>
<Step title="Czat wdrożeniowy (dedykowana sesja)">
  Po konfiguracji aplikacja otwiera dedykowaną sesję czatu wdrożeniowego, aby agent mógł
  się przedstawić i wskazać kolejne kroki. Dzięki temu wskazówki przy pierwszym uruchomieniu są oddzielone
  od zwykłej rozmowy. Zobacz [Inicjowanie](/pl/start/bootstrapping), aby dowiedzieć się,
  co dzieje się na hoście gateway podczas pierwszego uruchomienia agenta.
</Step>
</Steps>

## Powiązane

- [Przegląd wdrożenia](/pl/start/onboarding-overview)
- [Pierwsze kroki](/pl/start/getting-started)
