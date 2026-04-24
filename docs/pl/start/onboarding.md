---
read_when:
    - Projektowanie asystenta onboardingu dla aplikacji macOS
    - Implementacja konfiguracji auth lub tożsamości
sidebarTitle: 'Onboarding: macOS App'
summary: Przepływ konfiguracji przy pierwszym uruchomieniu OpenClaw (aplikacja macOS)
title: Onboarding (aplikacja macOS)
x-i18n:
    generated_at: "2026-04-24T09:33:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Ten dokument opisuje **bieżący** przepływ konfiguracji przy pierwszym uruchomieniu. Celem jest
płynne doświadczenie „dnia 0”: wybór miejsca działania Gateway, połączenie auth, uruchomienie
kreatora i pozwolenie agentowi na samodzielne przeprowadzenie bootstrapu.
Ogólny przegląd ścieżek onboardingu znajdziesz w [Przegląd onboardingu](/pl/start/onboarding-overview).

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
<Step title="Ekran powitalny i komunikat bezpieczeństwa">
<Frame caption="Przeczytaj wyświetlony komunikat bezpieczeństwa i podejmij decyzję odpowiednio">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model zaufania bezpieczeństwa:

- Domyślnie OpenClaw to osobisty agent: jedna granica zaufanego operatora.
- Konfiguracje współdzielone/wieloużytkownikowe wymagają utwardzenia (rozdzielenia granic zaufania, utrzymania minimalnego dostępu do narzędzi i stosowania zasad z [Bezpieczeństwo](/pl/gateway/security)).
- Lokalny onboarding ustawia teraz domyślnie nowe konfiguracje na `tools.profile: "coding"`, dzięki czemu świeże lokalne konfiguracje zachowują narzędzia systemu plików/runtime bez wymuszania nieograniczonego profilu `full`.
- Jeśli włączone są hooki/webhooki albo inne kanały niezaufanej treści, używaj silnego nowoczesnego poziomu modelu i utrzymuj ścisłą politykę narzędzi/sandboxing.

</Step>
<Step title="Local vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gdzie działa **Gateway**?

- **Ten Mac (tylko lokalnie):** onboarding może skonfigurować auth i zapisać poświadczenia
  lokalnie.
- **Remote (przez SSH/Tailnet):** onboarding **nie** konfiguruje lokalnego auth;
  poświadczenia muszą istnieć na hoście gateway.
- **Skonfiguruj później:** pomiń konfigurację i pozostaw aplikację nieskonfigurowaną.

<Tip>
**Wskazówka dotycząca auth Gateway:**

- Kreator generuje teraz **token** nawet dla loopback, więc lokalni klienci WS muszą się uwierzytelniać.
- Jeśli wyłączysz auth, każdy lokalny proces może się połączyć; używaj tego tylko na w pełni zaufanych maszynach.
- Używaj **tokenu** dla dostępu z wielu maszyn albo powiązań innych niż loopback.

</Tip>
</Step>
<Step title="Uprawnienia">
<Frame caption="Wybierz, jakie uprawnienia chcesz nadać OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding prosi o uprawnienia TCC potrzebne do:

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
  Aplikacja może zainstalować globalne CLI `openclaw` przez npm, pnpm lub bun.
  Preferuje najpierw npm, potem pnpm, a następnie bun, jeśli jest to jedyny wykryty
  menedżer pakietów. Dla środowiska wykonawczego Gateway nadal zalecaną ścieżką jest Node.
</Step>
<Step title="Czat onboardingu (dedykowana sesja)">
  Po konfiguracji aplikacja otwiera dedykowaną sesję czatu onboardingowego, aby agent mógł
  się przedstawić i poprowadzić kolejne kroki. Dzięki temu wskazówki przy pierwszym uruchomieniu są oddzielone
  od zwykłej rozmowy. Zobacz [Bootstrapowanie](/pl/start/bootstrapping), aby sprawdzić,
  co dzieje się na hoście gateway podczas pierwszego uruchomienia agenta.
</Step>
</Steps>

## Powiązane

- [Przegląd onboardingu](/pl/start/onboarding-overview)
- [Pierwsze kroki](/pl/start/getting-started)
