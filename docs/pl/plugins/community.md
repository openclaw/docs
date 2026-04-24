---
read_when:
    - Chcesz znaleźć zewnętrzne Pluginy OpenClaw
    - Chcesz opublikować lub dodać własny Plugin do listy
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądanie, instalowanie i zgłaszanie własnych'
title: Pluginy społecznościowe
x-i18n:
    generated_at: "2026-04-24T09:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Pluginy społecznościowe to pakiety firm trzecich, które rozszerzają OpenClaw o nowe
kanały, narzędzia, providery lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, publikowane na [ClawHub](/pl/tools/clawhub) lub npm i
instalowane jednym poleceniem.

ClawHub to kanoniczna powierzchnia odkrywania Pluginów społecznościowych. Nie otwieraj
PR-ów tylko do dokumentacji wyłącznie po to, aby dodać tutaj swój Plugin dla większej wykrywalności; opublikuj go
zamiast tego na ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw najpierw sprawdza ClawHub, a następnie automatycznie wraca do npm.

## Wymienione Pluginy

### Apify

Scrapuj dane z dowolnej strony internetowej przy użyciu ponad 20 000 gotowych scraperów. Pozwól agentowi
wyodrębniać dane z Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sklepów e-commerce i innych — po prostu o to prosząc.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Niezależny bridge OpenClaw dla konwersacji Codex App Server. Powiąż czat z
wątkiem Codex, rozmawiaj z nim zwykłym tekstem i steruj nim natywnymi dla czatu
poleceniami do wznawiania, planowania, przeglądu, wyboru modelu, Compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja robota korporacyjnego z użyciem trybu Stream. Obsługuje tekst, obrazy i
wiadomości plikowe przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Podsumowywanie konwersacji
oparte na DAG z przyrostowym Compaction — zachowuje pełną wierność kontekstu,
jednocześnie zmniejszając zużycie tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny Plugin eksportujący ślady agentów do Opik. Monitoruj zachowanie agenta,
koszt, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Daj swojemu agentowi OpenClaw avatar Live2D z synchronizacją ruchu ust w czasie rzeczywistym, emocjami
i text-to-speech. Zawiera narzędzia twórcy do generowania zasobów AI
oraz wdrażanie jednym kliknięciem do Prometheus Marketplace. Obecnie w wersji alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez QQ Bot API. Obsługuje czaty prywatne, wzmianki
grupowe, wiadomości kanałowe oraz rich media, w tym głos, obrazy, wideo
i pliki.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Napędzany przez
trwałe połączenia WebSocket WeCom Bot, obsługuje wiadomości bezpośrednie i czaty grupowe,
streaming odpowiedzi, wiadomości proaktywne, przetwarzanie obrazów/plików, formatowanie Markdown,
wbudowaną kontrolę dostępu oraz Skills do dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Zgłoś swój Plugin

Witamy Pluginy społecznościowe, które są użyteczne, udokumentowane i bezpieczne w użyciu.

<Steps>
  <Step title="Opublikuj na ClawHub lub npm">
    Twój Plugin musi być możliwy do zainstalowania przez `openclaw plugins install \<package-name\>`.
    Opublikuj go na [ClawHub](/pl/tools/clawhub) (preferowane) albo npm.
    Pełny przewodnik znajdziesz w [Budowaniu Pluginów](/pl/plugins/building-plugins).

  </Step>

  <Step title="Hostuj na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i
    trackerem zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko przy zmianach w dokumentacji źródłowej">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, by Twój Plugin był wykrywalny. Opublikuj go
    zamiast tego na ClawHub.

    Otwieraj PR do dokumentacji tylko wtedy, gdy dokumentacja źródłowa OpenClaw wymaga rzeczywistej zmiany treści,
    na przykład poprawienia wskazówek instalacji lub dodania dokumentacji między repozytoriami,
    która należy do głównego zestawu dokumentacji.

  </Step>
</Steps>

## Poprzeczka jakości

| Wymaganie                  | Dlaczego                                      |
| -------------------------- | --------------------------------------------- |
| Opublikowany na ClawHub lub npm | Użytkownicy potrzebują działającego `openclaw plugins install` |
| Publiczne repozytorium GitHub | Przegląd źródeł, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak to skonfigurować |
| Aktywne utrzymanie         | Ostatnie aktualizacje lub responsywna obsługa zgłoszeń |

Wrappery niskiej jakości, niejasna własność lub nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalowanie i konfigurowanie Pluginów](/pl/tools/plugin) — jak zainstalować dowolny Plugin
- [Budowanie Pluginów](/pl/plugins/building-plugins) — stwórz własny
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
