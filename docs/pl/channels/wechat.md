---
read_when:
    - Chcesz połączyć OpenClaw z WeChat lub Weixin
    - Instalujesz lub rozwiązujesz problemy z pluginem kanału openclaw-weixin
    - Musisz zrozumieć, jak zewnętrzne pluginy kanałów działają obok Gateway
summary: Konfiguracja kanału WeChat za pomocą zewnętrznego pluginu openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T14:55:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw łączy się z WeChat za pośrednictwem zewnętrznego pluginu kanału Tencent
`@tencent-weixin/openclaw-weixin`.

Status: plugin zewnętrzny, utrzymywany przez zespół Tencent Weixin. Obsługiwane są czaty bezpośrednie i
multimedia. Czaty grupowe nie są deklarowane w metadanych możliwości pluginu
(plugin deklaruje wyłącznie czaty bezpośrednie).

## Nazewnictwo

- **WeChat** to nazwa widoczna dla użytkownika w tej dokumentacji.
- **Weixin** to nazwa używana w pakiecie Tencent oraz w identyfikatorze pluginu.
- `openclaw-weixin` to identyfikator kanału OpenClaw (`weixin` i `wechat` działają jako aliasy).
- `@tencent-weixin/openclaw-weixin` to pakiet npm.

W poleceniach CLI i ścieżkach konfiguracji używaj `openclaw-weixin`.

## Jak to działa

Kod WeChat nie znajduje się w głównym repozytorium OpenClaw. OpenClaw udostępnia
ogólny kontrakt pluginu kanału, a zewnętrzny plugin zapewnia środowisko wykonawcze
specyficzne dla WeChat:

1. `openclaw plugins install` instaluje `@tencent-weixin/openclaw-weixin`.
2. Gateway wykrywa manifest pluginu i ładuje jego punkt wejścia.
3. Plugin rejestruje identyfikator kanału `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` rozpoczyna logowanie za pomocą kodu QR.
5. Plugin przechowuje dane uwierzytelniające konta w katalogu stanu OpenClaw
   (domyślnie `~/.openclaw`).
6. Po uruchomieniu Gateway plugin uruchamia monitor Weixin dla każdego
   skonfigurowanego konta.
7. Przychodzące wiadomości WeChat są normalizowane zgodnie z kontraktem kanału, kierowane do
   wybranego agenta OpenClaw, a odpowiedzi są wysyłane ścieżką wychodzącą pluginu.

Ten podział ma znaczenie: rdzeń OpenClaw pozostaje niezależny od kanałów. Za logowanie do WeChat,
wywołania interfejsu API Tencent iLink, wysyłanie i pobieranie multimediów, tokeny kontekstu oraz
monitorowanie kont odpowiada zewnętrzny plugin.

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

Uruchom logowanie za pomocą kodu QR na tej samej maszynie, na której działa Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Zeskanuj kod QR za pomocą WeChat na telefonie i potwierdź logowanie. Po pomyślnym
zeskanowaniu plugin zapisze lokalnie token konta.

Aby dodać kolejne konto WeChat, ponownie uruchom to samo polecenie logowania. W przypadku wielu
kont odizoluj sesje wiadomości bezpośrednich według konta, kanału i nadawcy:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrola dostępu

Wiadomości bezpośrednie korzystają ze standardowego dla pluginów kanałów modelu parowania i listy dozwolonych
OpenClaw.

Zatwierdzaj nowych nadawców:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pełny opis modelu kontroli dostępu zawiera sekcja [Parowanie](/pl/channels/pairing).

## Zgodność

Plugin podczas uruchamiania sprawdza wersję hosta OpenClaw.

| Linia pluginu | Wersja OpenClaw                                                 | Znacznik npm |
| ------------- | --------------------------------------------------------------- | ------------ |
| `2.x`         | `>=2026.5.12` (obecna 2.4.6; wczesne 2.x akceptowały `>=2026.3.22`) | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Jeśli plugin zgłasza, że używana wersja OpenClaw jest zbyt stara, zaktualizuj
OpenClaw albo zainstaluj starszą linię pluginu:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proces pomocniczy

Plugin WeChat może uruchamiać procesy pomocnicze obok Gateway podczas monitorowania
interfejsu API Tencent iLink. W zgłoszeniu nr 68451 ta ścieżka pomocnicza ujawniła błąd w
ogólnym mechanizmie usuwania nieaktualnych procesów Gateway w OpenClaw: proces potomny mógł próbować
usunąć nadrzędny proces Gateway, powodując pętle ponownego uruchamiania pod nadzorem menedżerów procesów, takich jak systemd.

Obecny mechanizm porządkowania podczas uruchamiania OpenClaw wyklucza bieżący proces i jego procesy nadrzędne,
dzięki czemu proces pomocniczy kanału nie może zakończyć Gateway, który go uruchomił. Ta poprawka jest
ogólna; nie stanowi ścieżki specyficznej dla WeChat w rdzeniu.

## Rozwiązywanie problemów

Sprawdź instalację i stan:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jeśli kanał jest oznaczony jako zainstalowany, ale nie nawiązuje połączenia, upewnij się, że plugin jest
włączony, i uruchom ponownie Gateway:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jeśli po włączeniu WeChat Gateway wielokrotnie uruchamia się ponownie, zaktualizuj zarówno OpenClaw, jak i
plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Jeśli podczas uruchamiania pojawia się komunikat, że zainstalowany pakiet pluginu `requires compiled runtime
output for TypeScript entry`, pakiet npm opublikowano bez skompilowanych
plików środowiska wykonawczego JavaScript wymaganych przez OpenClaw. Zaktualizuj lub ponownie zainstaluj plugin po
opublikowaniu poprawionego pakietu przez jego wydawcę albo tymczasowo wyłącz lub odinstaluj plugin.

Tymczasowe wyłączenie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Powiązana dokumentacja

- Omówienie kanałów: [Kanały czatu](/pl/channels)
- Parowanie: [Parowanie](/pl/channels/pairing)
- Kierowanie kanałów: [Kierowanie kanałów](/pl/channels/channel-routing)
- Architektura pluginów: [Architektura pluginów](/pl/plugins/architecture)
- SDK pluginów kanałów: [SDK pluginów kanałów](/pl/plugins/sdk-channel-plugins)
- Pakiet zewnętrzny: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
