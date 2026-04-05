---
read_when:
    - Projektowanie asystenta onboardingu dla macOS
    - Implementowanie konfiguracji auth lub tożsamości
sidebarTitle: 'Onboarding: macOS App'
summary: Przepływ konfiguracji przy pierwszym uruchomieniu OpenClaw (aplikacja macOS)
title: Onboarding (aplikacja macOS)
x-i18n:
    generated_at: "2026-04-05T14:06:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (aplikacja macOS)

Ten dokument opisuje **bieżący** przepływ konfiguracji przy pierwszym uruchomieniu. Celem jest
płynne doświadczenie „day 0”: wybierz, gdzie działa Gateway, podłącz auth, uruchom
kreator i pozwól agentowi samodzielnie się zbootstrapować.
Ogólny przegląd ścieżek onboardingu znajdziesz w [Onboarding Overview](/start/onboarding-overview).

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
<Step title="Ekran powitalny i informacja o bezpieczeństwie">
<Frame caption="Przeczytaj wyświetloną informację o bezpieczeństwie i podejmij odpowiednią decyzję">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Model zaufania bezpieczeństwa:

- Domyślnie OpenClaw jest osobistym agentem: jedna granica zaufanego operatora.
- Konfiguracje współdzielone/wieloużytkownikowe wymagają ograniczeń (rozdzielenia granic zaufania, minimalnego dostępu do narzędzi i stosowania zasad z [Security](/pl/gateway/security)).
- Lokalny onboarding ustawia teraz domyślnie nowe konfiguracje na `tools.profile: "coding"`, aby świeże lokalne konfiguracje zachowywały narzędzia systemu plików/środowiska uruchomieniowego bez wymuszania nieograniczonego profilu `full`.
- Jeśli włączone są hooks/webhooks lub inne źródła niezaufanych treści, używaj silnej, nowoczesnej klasy modelu i utrzymuj ścisłą politykę narzędzi/sandboxing.

</Step>
<Step title="Lokalnie czy zdalnie">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

Gdzie działa **Gateway**?

- **Ten Mac (tylko lokalnie):** onboarding może skonfigurować auth i zapisać poświadczenia
  lokalnie.
- **Zdalnie (przez SSH/Tailnet):** onboarding **nie** konfiguruje lokalnego auth;
  poświadczenia muszą istnieć na hoście gateway.
- **Skonfiguruj później:** pomiń konfigurację i pozostaw aplikację nieskonfigurowaną.

<Tip>
**Wskazówka dotycząca auth gateway:**

- Kreator generuje teraz **token** nawet dla loopback, więc lokalni klienci WS muszą się uwierzytelnić.
- Jeśli wyłączysz auth, każdy lokalny proces może się połączyć; używaj tego tylko na w pełni zaufanych maszynach.
- Używaj **tokena** przy dostępie z wielu maszyn lub bindach innych niż loopback.

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
  menedżer pakietów. Dla środowiska uruchomieniowego Gateway zalecaną ścieżką pozostaje Node.
</Step>
<Step title="Onboarding Chat (dedykowana sesja)">
  Po konfiguracji aplikacja otwiera dedykowaną sesję czatu onboardingowego, aby agent mógł
  się przedstawić i poprowadzić kolejne kroki. Dzięki temu wskazówki przy pierwszym uruchomieniu są oddzielone
  od zwykłej rozmowy. Zobacz [Bootstrapping](/start/bootstrapping), aby dowiedzieć się,
  co dzieje się na hoście gateway podczas pierwszego uruchomienia agenta.
</Step>
</Steps>
