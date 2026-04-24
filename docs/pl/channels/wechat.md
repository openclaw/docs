---
read_when:
    - Chcesz połączyć OpenClaw z WeChat lub Weixin.
    - Instalujesz lub rozwiązujesz problemy z Pluginem kanału openclaw-weixin.
    - Musisz zrozumieć, jak zewnętrzne Pluginy kanałów działają obok Gateway.
summary: Konfiguracja kanału WeChat przez zewnętrzny Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T09:00:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw łączy się z WeChat przez zewnętrzny Plugin kanału Tencent
`@tencent-weixin/openclaw-weixin`.

Status: zewnętrzny Plugin. Obsługiwane są czaty bezpośrednie i media. Czaty grupowe nie są
deklarowane przez bieżące metadane możliwości Pluginu.

## Nazewnictwo

- **WeChat** to nazwa widoczna dla użytkownika w tej dokumentacji.
- **Weixin** to nazwa używana przez pakiet Tencent i przez identyfikator Pluginu.
- `openclaw-weixin` to identyfikator kanału OpenClaw.
- `@tencent-weixin/openclaw-weixin` to pakiet npm.

Używaj `openclaw-weixin` w poleceniach CLI i ścieżkach konfiguracji.

## Jak to działa

Kod WeChat nie znajduje się w głównym repozytorium OpenClaw. OpenClaw udostępnia
ogólny kontrakt Pluginu kanału, a zewnętrzny Plugin dostarcza
środowisko wykonawcze specyficzne dla WeChat:

1. `openclaw plugins install` instaluje `@tencent-weixin/openclaw-weixin`.
2. Gateway wykrywa manifest Pluginu i ładuje punkt wejścia Pluginu.
3. Plugin rejestruje identyfikator kanału `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` uruchamia logowanie przez QR.
5. Plugin zapisuje poświadczenia konta w katalogu stanu OpenClaw.
6. Gdy Gateway się uruchamia, Plugin uruchamia monitor Weixin dla każdego
   skonfigurowanego konta.
7. Przychodzące wiadomości WeChat są normalizowane przez kontrakt kanału, kierowane do
   wybranego agenta OpenClaw i odsyłane przez wychodzącą ścieżkę Pluginu.

To rozdzielenie ma znaczenie: rdzeń OpenClaw powinien pozostać niezależny od kanałów. Logowanie do WeChat,
wywołania Tencent iLink API, wysyłanie/pobieranie mediów, tokeny kontekstu i monitorowanie
kont należą do zewnętrznego Pluginu.

## Instalacja

Szybka instalacja:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalacja ręczna:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Po instalacji uruchom ponownie Gateway:

```bash
openclaw gateway restart
```

## Logowanie

Uruchom logowanie przez QR na tej samej maszynie, na której działa Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Zeskanuj kod QR w WeChat na telefonie i potwierdź logowanie. Plugin zapisze
token konta lokalnie po udanym skanowaniu.

Aby dodać kolejne konto WeChat, uruchom ponownie to samo polecenie logowania. Przy wielu
kontach izoluj sesje wiadomości bezpośrednich według konta, kanału i nadawcy:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrola dostępu

Wiadomości bezpośrednie używają standardowego modelu parowania i list dozwolonych OpenClaw dla Pluginów
kanałów.

Zatwierdzanie nowych nadawców:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pełny model kontroli dostępu znajdziesz w [Parowaniu](/pl/channels/pairing).

## Zgodność

Plugin sprawdza wersję hosta OpenClaw przy uruchamianiu.

| Linia Pluginu | Wersja OpenClaw         | Tag npm  |
| ------------- | ----------------------- | -------- |
| `2.x`         | `>=2026.3.22`           | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22` | `legacy` |

Jeśli Plugin zgłasza, że twoja wersja OpenClaw jest zbyt stara, zaktualizuj
OpenClaw albo zainstaluj starszą linię Pluginu:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proces sidecar

Plugin WeChat może uruchamiać pracę pomocniczą obok Gateway, gdy monitoruje
Tencent iLink API. W issue #68451 ta ścieżka pomocnicza ujawniła błąd w
ogólnym czyszczeniu nieaktualnych Gateway w OpenClaw: proces potomny mógł próbować
posprzątać nadrzędny proces Gateway, powodując pętle restartów w menedżerach procesów
takich jak systemd.

Obecne czyszczenie podczas startu OpenClaw wyklucza bieżący proces i jego przodków,
więc pomocnik kanału nie może zabijać Gateway, który go uruchomił. Ta poprawka jest
ogólna; nie jest to ścieżka specyficzna dla WeChat w rdzeniu.

## Rozwiązywanie problemów

Sprawdź instalację i status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jeśli kanał jest widoczny jako zainstalowany, ale się nie łączy, potwierdź, że Plugin jest
włączony, i uruchom ponownie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jeśli Gateway wielokrotnie uruchamia się ponownie po włączeniu WeChat, zaktualizuj zarówno OpenClaw, jak i
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Tymczasowe wyłączenie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Powiązana dokumentacja

- Przegląd kanałów: [Kanały czatu](/pl/channels)
- Parowanie: [Parowanie](/pl/channels/pairing)
- Routing kanałów: [Routing kanałów](/pl/channels/channel-routing)
- Architektura Pluginów: [Architektura Pluginów](/pl/plugins/architecture)
- SDK Pluginów kanałów: [SDK Pluginów kanałów](/pl/plugins/sdk-channel-plugins)
- Zewnętrzny pakiet: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
