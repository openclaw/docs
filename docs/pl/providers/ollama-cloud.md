---
read_when:
    - Chcesz korzystać z hostowanych modeli Ollama bez lokalnego serwera Ollama
    - Potrzebujesz identyfikatora dostawcy ollama-cloud, klucza lub punktu końcowego
summary: Korzystaj z Ollama Cloud bezpośrednio w OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T15:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud to hostowane API modeli Ollama. Dostawca `ollama-cloud` wywołuje je
bezpośrednio pod adresem `https://ollama.com` przez natywne API `/api/chat`
Ollama, bez lokalnego serwera Ollama ani lokalnej aplikacji Ollama zalogowanej
w trybie chmurowym. Używaj odwołań do modeli takich jak `ollama-cloud/kimi-k2.6`.

OpenClaw rejestruje `ollama-cloud` jako osobny identyfikator dostawcy, aby
poświadczenia przeznaczone wyłącznie do chmury, wykrywanie katalogu na żywo
i wybór modelu nie mieszały się z lokalnym hostem `ollama`. Informacje o
lokalnym Ollama, hybrydowym routingu chmurowym i lokalnym, osadzaniu oraz
szczegółach niestandardowego hosta znajdziesz w sekcji [Ollama](/pl/providers/ollama).

## Konfiguracja

Utwórz klucz API Ollama Cloud na stronie [ollama.com/settings/keys](https://ollama.com/settings/keys), a następnie uruchom:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Możesz też ustawić:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Nieinteraktywne wdrażanie przyjmuje klucz bezpośrednio:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Wdrażanie ustawia domyślny model na `ollama-cloud/kimi-k2.5:cloud`.

## Ustawienia domyślne

- Dostawca: `ollama-cloud`
- Bazowy adres URL: `https://ollama.com`
- Zmienna środowiskowa: `OLLAMA_API_KEY`
- Styl API: natywne `/api/chat` Ollama
- Domyślny model wdrażania: `ollama-cloud/kimi-k2.5:cloud`

## Kiedy wybrać Ollama Cloud

- Chcesz korzystać z hostowanych modeli Ollama bez lokalnego uruchamiania `ollama serve`.
- Chcesz używać tego samego natywnego formatu API czatu Ollama, którego OpenClaw
  używa z lokalnym Ollama, ale skierowanego na `https://ollama.com`.
- Chcesz prostej ścieżki chmurowej dla modeli dostępnych już w hostowanym
  katalogu Ollama.
- Nie potrzebujesz lokalnego pobierania modeli, lokalnej kontroli GPU ani
  wnioskowania dostępnego wyłącznie w sieci LAN.

Zamiast tego użyj [Ollama](/pl/providers/ollama), jeśli chcesz routingu wyłącznie
lokalnego lub chmurowego i lokalnego przez zalogowany host Ollama. Użyj
dostawcy zgodnego z OpenAI, jeśli potrzebujesz semantyki
`/v1/chat/completions` lub funkcji charakterystycznych dla danego dostawcy,
działających w stylu OpenAI.

## Modele

Dostawca wymaga klucza API; bez niego pozostaje nieaktywny. Gdy klucz jest
dostępny, OpenClaw wykrywa modele Ollama Cloud na żywo w hostowanym katalogu:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Identyfikatory dostępne w katalogu na żywo obejmują `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` i `minimax-m2.7`. Gdy wykrywanie na żywo nie zwraca
żadnych wyników, OpenClaw używa awaryjnie dołączonych wpisów
`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` i `glm-5.2:cloud`.

Identyfikatory modeli są identyfikatorami katalogu chmurowego, a nie nazwami
lokalnie pobieranych modeli. Jeśli nazwa modelu działa na lokalnym hoście Ollama,
ale nie występuje w hostowanym katalogu, użyj zamiast tego dostawcy `ollama`
z tym lokalnym hostem.

## Test na żywo

W przypadku testów dymnych Ollama Cloud z kluczem API skieruj test na żywo
Ollama do hostowanego punktu końcowego i wybierz model z bieżącego katalogu:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Chmurowy test dymny sprawdza tekst, natywne strumieniowanie i wyszukiwanie
w internecie; ustaw `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, aby pominąć wyszukiwanie
w internecie. Domyślnie pomija osadzanie dla `https://ollama.com`, ponieważ
klucze API Ollama Cloud mogą nie mieć uprawnień do `/api/embed`; wymuś je za
pomocą `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Rozwiązywanie problemów

- Błędy `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: podaj
  prawidłowy klucz API chmury. Znacznik `ollama-local` jest przeznaczony
  wyłącznie dla lokalnych lub prywatnych hostów Ollama.
- Błędy nieznanego modelu: uruchom `openclaw models list --provider ollama-cloud`
  i skopiuj dokładny identyfikator hostowanego modelu.
- Problemy z wywoływaniem narzędzi lub nieprzetworzonym kodem JSON na
  niestandardowych hostach Ollama: sprawdź, czy przypadkowo nie używasz adresu
  URL `/v1` zgodnego z OpenAI. Trasy Ollama powinny używać natywnego bazowego
  adresu URL bez przyrostka `/v1`.

## Powiązane

- [Ollama](/pl/providers/ollama)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Wszyscy dostawcy](/pl/providers/index)
